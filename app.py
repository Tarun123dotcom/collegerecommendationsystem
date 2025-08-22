from flask import Flask, request, render_template
from flask import Flask, session, redirect, url_for
from flask_mysqldb import MySQL
import MySQLdb.cursors
import logging
import pandas as pd
import spacy
import re
from markupsafe import Markup
import speech_recognition as sr
from flask import session
import threading
from gtts import gTTS
from playsound import playsound
import os
from flask import jsonify
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = 'crs'
app.config.from_object('config.Config')
import pyttsx3
engine = pyttsx3.init()
# Initialize MySQL
mysql = MySQL(app)
if(mysql):
    print("Sql connected")

# Initializing spacy model
nlp = spacy.load('en_core_web_sm')
data = pd.read_csv('cdatanew.csv', sep=',', header=0)

# Fill missing values
data.fillna('', inplace=True)

# Convert categorical values to numerical if needed
infra_map = {'Good': 1, 'VGood': 2}
faculty_map = {'Good': 1, 'VGood': 2}
data['Infra'] = data['Infra'].map(infra_map)
data['Faculty'] = data['Faculty'].map(faculty_map)
global isFiltered_col
isFiltered_col = False
# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Enable CORS for the React frontend (allow credentials for session cookie)
CORS(app, supports_credentials=True)

# --- JSON API endpoints for React frontend ---
@app.route('/api/login', methods=['POST'])
def api_login():
    payload = request.get_json() or {}
    email = payload.get('email')
    password = payload.get('password')

    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('SELECT * FROM users WHERE email = %s AND password = %s', (email, password))
    account = cursor.fetchone()
    cursor.close()

    if account:
        session['user_id'] = account['id']
        return jsonify(success=True, user={'id': account['id'], 'name': account.get('name'), 'email': account.get('email')})
    return jsonify(success=False, message='Incorrect email/password'), 401


@app.route('/api/signup', methods=['POST'])
def api_signup():
    payload = request.get_json() or {}
    name = payload.get('name')
    email = payload.get('email')
    phno = payload.get('phno')
    password = payload.get('password')

    try:
        cursor = mysql.connection.cursor()
        cursor.execute('INSERT INTO users (name, email, phno, password) VALUES (%s, %s, %s, %s)', (name, email, phno, password))
        mysql.connection.commit()
        cursor.execute('SELECT id, name, email FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()
        cursor.close()
        session['user_id'] = user['id']
        return jsonify(success=True, user={'id': user['id'], 'name': user['name'], 'email': user['email']})
    except Exception as e:
        logging.error('Signup error: %s', str(e))
        return jsonify(success=False, error=str(e)), 400


@app.route('/api/recommend', methods=['POST'])
def api_recommend():
    payload = request.get_json() or {}
    query_text = payload.get('query', '')
    show = payload.get('show', 'default')
    user_id = session.get('user_id')

    entities = extract_entities(query_text)
    if entities is None:
        return jsonify(success=False, message='No valid criteria found in the query.'), 400

    # Use the global CSV data loaded earlier named 'data'
    filtered = filter_data(data, entities)

    if show == 'default':
        filtered = filtered[:10]
    elif show == 'top20':
        filtered = filtered[:20]
    elif show == 'top30':
        filtered = filtered[:30]

    # Generate HTML response (server-side) and also return structured data
    html_response = str(generate_response(filtered))

    # Save query and response to DB
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('INSERT INTO previous_queries (query, response, user_id) VALUES (%s, %s, %s)', (query_text, html_response, user_id))
        mysql.connection.commit()
        cursor.close()
    except Exception as e:
        logging.error('Error saving previous query: %s', str(e))

    # Convert dataframe to list of records for JSON serialization
    try:
        colleges_list = filtered.to_dict(orient='records')
    except Exception:
        colleges_list = []

    return jsonify(success=True, html=html_response, colleges=colleges_list)


@app.route('/api/previous', methods=['GET'])
def api_previous():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify(previous=[])

    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT id, query, response, created_at FROM previous_queries WHERE user_id = %s ORDER BY id DESC LIMIT 10', (user_id,))
        rows = cursor.fetchall()
        cursor.close()
        return jsonify(previous=rows)
    except Exception as e:
        logging.error('Error fetching previous queries: %s', str(e))
        return jsonify(previous=[]), 500

@app.route('/collegelist')
def collegelist():
    df = pd.read_csv('cdatanew.csv')
    df['Links'] = df['Links'].apply(lambda x: f'<a href="{x}" target="_blank">Visit College</a>')
    df= df.drop(columns=['FeeCategory', 'S links', 'Classified Rating'])
    table_html = df.to_html(classes='table table-bordered', index=False,escape=False)
    return render_template('collegelist.html', table_html=table_html)

@app.route('/gobacktosearch')
def goBackToSearch():
    return render_template('search.html')
@app.route('/')
def index():
    return render_template('index.html')
@app.route('/logout')
def logout():
    return render_template('index.html')
@app.route('/myaccount')
def myaccount():
    user_id = session.get('user_id')
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT name, email, phno FROM users WHERE id = %s', (user_id,))
    user = cursor.fetchone()
    cursor.close()  # It's good practice to close the cursor after use
    return render_template('myaccount.html', user=user)

@app.route('/signup.html')
def signup():
    return render_template('signup.html')
@app.route('/feedback')
def feedback():
    return render_template('feedback.html')
@app.route('/feedbackSubmit', methods=['POST'])
def submitFeedback():
    user_id = session.get('user_id')
    cursor = mysql.connection.cursor()
    
    # Corrected the single value tuple with a trailing comma
    cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
    account = cursor.fetchone()
    email = account['email']
    msg = request.form['msg']
    
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('INSERT INTO feedback (user_id, email, feedback) VALUES (%s, %s, %s)', (user_id, email, msg))
        mysql.connection.commit()
        cursor.close()
        return render_template('myaccount.html')
    except MySQL.Error as e:
        logging.error('MySQL error: %s', str(e))
        return render_template('myaccount.html', error=e)
    except Exception as e:
        logging.error('General error: %s', str(e))
        return render_template('myaccount.html', error=e)
    
@app.route('/comments/<int:s_no>')
def comments(s_no):
    # Save the S.No into the session
    session['s_no'] = s_no
    # Redirect to a page where you display comments or handle the comments functionality
    return redirect(url_for('display_comments'))
@app.route('/display_comments')
def display_comments():
    s_no = session.get('s_no', None)

    if s_no is not None:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT * FROM databasecdata WHERE `COL 1` = %s LIMIT 0, 25', (s_no,))
        college = cursor.fetchone()
        cursor.close()
        # Fetch and display comments for the college with the saved S.No
        # Replace this with your actual logic to display comments
        return render_template('comments.html', text=s_no, college=college)
    else:
        return "No S.No found in session"
@app.route('/logindone', methods=['POST'])
def logindone():
    email = request.form['email']
    name = request.form['name']
    phno = request.form['phno']
    password = request.form['pass']
    copass = request.form['copass']

    logging.debug('Received signup data: email=%s, password=%s, copass=%s', email, password, copass)

    if password == copass:
        try:
            cursor = mysql.connection.cursor()
            cursor.execute('INSERT INTO users (name,email,phno, password) VALUES (%s, %s, %s, %s)', (name,email,phno, password))
            mysql.connection.commit()
            
            # Get the user ID
            cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
            user = cursor.fetchone()
            session['user_id'] = user['id']  # Store user ID in session
            session['email'] = user['email']
            cursor.close()
            logging.debug('User %s successfully registered.', email)
            return render_template('loginDone.html')
        except MySQLdb.Error as e:
            logging.error('MySQL error: %s', str(e))
            return render_template('signup.html', error=e)
        except Exception as e:
            logging.error('General error: %s', str(e))
            return render_template('signup.html', error=e)
    else:
        logging.warning('Passwords do not match for user %s.', email)
        error_message = "Password doesn't match for the user", email
        return render_template('signup.html', error=error_message)

search_logger = logging.getLogger('search')
search_logger.setLevel(logging.DEBUG)
search_handler = logging.FileHandler('search.log')
search_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
search_handler.setFormatter(search_formatter)
search_logger.addHandler(search_handler)

@app.route('/search', methods=['POST'])
def search():
    email = request.form['email']
    password = request.form['pass']
    
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('SELECT * FROM users WHERE email = %s AND password = %s', (email, password))
    account = cursor.fetchone()

    if account:
        session['user_id'] = account['id']  # Store user ID in session
        return render_template('search.html')
    else:
        logging.warning('Passwords do not match for user %s.', email)
        return render_template('index.html', error="Incorrect email/password")

def extract_entities(query):
    import pandas as pd
    try:
        custom_nlp = spacy.load("custom_ner_model")
        print("Model loaded")
    # Test the custom model
    except:
        print("Model not loaded")

    entitiesFound = {
        'infra': None,
        'faculty': None,
        'course': None,
        'stream': None,
        'rating': None,
        'rating_comparison': 'eq',  # Default comparison type
        'state': None,
        'andhra': None,
        'district':None,
        'fee': None
    }
    doc = custom_nlp(query)

    district_keywords =[  'Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Kadapa', 'Krishna', 
        'Kurnool', 'Nellore', 'Prakasam', 'Srikakulam', 'Visakhapatnam', 'Vizianagaram', 'West Godavari','Anjaw', 'Changlang', 'East Kameng', 'East Siang', 'Kamle', 'Kra Daadi', 'Kurung Kumey', 'Lepa Rada', 
        'Lohit', 'Longding', 'Lower Dibang Valley', 'Lower Siang', 'Lower Subansiri', 'Namsai', 'Pakke-Kessang', 
        'Papum Pare', 'Shi Yomi', 'Siang', 'Tawang', 'Tirap', 'Upper Dibang Valley', 'Upper Siang', 
        'Upper Subansiri', 'West Kameng', 'West Siang','Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar', 'Charaideo', 'Chirang', 'Darrang', 'Dhemaji', 
        'Dhubri', 'Dibrugarh', 'Dima Hasao', 'Goalpara', 'Golaghat', 'Hailakandi', 'Hojai', 'Jorhat', 'Kamrup', 
        'Kamrup Metropolitan', 'Karbi Anglong', 'Karimganj', 'Kokrajhar', 'Lakhimpur', 'Majuli', 'Morigaon', 
        'Nagaon', 'Nalbari', 'Sivasagar', 'Sonitpur', 'South Salmara-Mankachar', 'Tinsukia', 'Udalguri', 'West Karbi Anglong','Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Buxar', 'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur', 'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur', 'Saran', 'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan', 'Supaul', 'Vaishali', 'West Champaran','Balod', 'Baloda Bazar', 'Balrampur', 'Bastar', 'Bemetara', 'Bijapur', 'Bilaspur', 'Dantewada', 'Dhamtari', 'Durg', 'Gariaband', 'Gaurela Pendra Marwahi', 'Janjgir-Champa', 'Jashpur', 'Kabirdham', 'Kanker', 'Kondagaon', 'Korba', 'Koriya', 'Mahasamund', 'Mungeli', 'Narayanpur', 'Raigarh', 'Raipur', 'Rajnandgaon', 'Sukma', 'Surajpur', 'Surguja','North Goa', 'South Goa','Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka', 'Gandhinagar', 'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar', 'Tapi', 'Vadodara', 'Valsad','Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram', 'Hisar', 'Jhajjar', 'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Mahendragarh', 'Nuh', 'Palwal', 'Panchkula', 'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar','Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu', 'Lahaul and Spiti', 'Mandi', 'Shimla', 'Sirmaur', 'Solan', 'Una','Anantnag', 'Bandipora', 'Baramulla', 'Budgam', 'Doda', 'Ganderbal', 'Jammu', 'Kathua', 'Kishtwar', 'Kulgam', 'Kupwara', 'Poonch', 'Pulwama', 'Rajouri', 'Ramban', 'Reasi', 'Samba', 'Shopian', 'Srinagar', 'Udhampur','Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum', 'Garhwa', 'Giridih', 'Godda', 'Gumla', 'Hazaribagh', 'Jamtara', 'Khunti', 'Koderma', 'Latehar', 'Lohardaga', 'Pakur', 'Palamu', 'Ramgarh', 'Ranchi', 'Sahibganj', 'Seraikela Kharsawan', 'Simdega', 'West Singhbhum','Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar', 'Chamarajanagar', 'Chikballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada', 'Davangere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir','Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad','Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Barwani', 'Betul', 'Bhind', 'Bhopal', 'Burhanpur', 'Chhatarpur', 'Chhindwara', 'Damoh', 'Datia', 'Dewas', 'Dhar', 'Dindori', 'Guna', 'Gwalior', 'Harda', 'Hoshangabad', 'Indore', 'Jabalpur', 'Jhabua', 'Katni', 'Khandwa', 'Khargone', 'Mandla', 'Mandsaur', 'Morena', 'Narsinghpur', 'Neemuch', 'Niwari', 'Panna', 'Raisen', 'Rajgarh', 'Ratlam', 'Rewa', 'Sagar', 'Satna', 'Sehore', 'Seoni', 'Shahdol', 'Shajapur', 'Sheopur', 'Shivpuri', 'Sidhi', 'Singrauli', 'Tikamgarh', 'Ujjain', 'Umaria', 'Vidisha','Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal','Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West', 'Jiribam', 'Kakching', 'Kamjong', 'Kangpokpi','Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam', 'Kumuram Bheem Asifabad', 'Mahabubabad', 'Mahabubnagar', 'Mancherial', 'Medak', 'Medchal-Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal Rural', 'Warangal Urban', 'Yadadri Bhuvanagiri','East Garo Hills', 'East Jaintia Hills', 'East Khasi Hills', 'North Garo Hills', 'Ri Bhoi', 'South Garo Hills', 'South West Garo Hills', 'South West Khasi Hills', 'West Garo Hills', 'West Jaintia Hills', 'West Khasi Hills','Aizawl', 'Champhai', 'Kolasib', 'Lawngtlai', 'Lunglei', 'Mamit', 'Saiha', 'Serchhip', 'Hnahthial', 'Khawzawl', 'Saitual','Dimapur', 'Kiphire', 'Kohima', 'Longleng', 'Mokokchung', 'Mon', 'Noklak', 'Peren', 'Phek', 'Tuensang', 'Wokha', 'Zunheboto','Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh', 'Cuttack', 'Deogarh', 'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur', 'Jajpur', 'Jharsuguda', 'Kalahandi', 'Kandhamal', 'Kendrapara', 'Kendujhar', 'Khordha', 'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh', 'Nuapada', 'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundergarh','Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka', 'Ferozepur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana', 'Mansa', 'Moga', 'Mohali', 'Muktsar', 'Pathankot', 'Patiala', 'Rupnagar', 'Sangrur', 'Shaheed Bhagat Singh Nagar', 'Tarn Taran','Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi', 'Chittorgarh', 'Churu', 'Dausa', 'Dholpur', 'Dungarpur', 'Hanumangarh', 'Jaipur', 'Jaisalmer', 'Jalore', 'Jhalawar', 'Jhunjhunu', 'Jodhpur', 'Karauli', 'Kota', 'Nagaur', 'Pali', 'Pratapgarh', 'Rajsamand', 'Sawai Madhopur', 'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur','East Sikkim', 'North Sikkim', 'South Sikkim', 'West Sikkim','Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Kanyakumari', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupattur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar','Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala', 'South Tripura', 'Unakoti', 'West Tripura','Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun', 'Haridwar', 'Nainital', 'Pauri Garhwal', 'Pithoragarh', 'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi','Agra', 'Aligarh', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya', 'Ayodhya', 'Azamgarh', 'Badaun', 'Baghpat', 'Bahraich', 'Ballia', 'Balrampur', 'Banda', 'Barabanki', 'Bareilly', 'Basti', 'Bhadohi', 'Bijnor', 'Budaun', 'Bulandshahr', 'Chandauli', 'Chitrakoot', 'Deoria', 'Etah', 'Etawah', 'Farrukhabad', 'Fatehpur', 'Firozabad', 'Gautam Buddha Nagar', 'Ghaziabad', 'Ghazipur', 'Gonda', 'Gorakhpur', 'Hamirpur', 'Hapur', 'Hardoi', 'Hathras', 'Jalaun', 'Jaunpur', 'Jhansi', 'Kannauj', 'Kanpur Dehat', 'Kanpur Nagar', 'Kasganj', 'Kaushambi', 'Kushinagar', 'Lakhimpur Kheri', 'Lalitpur', 'Lucknow', 'Maharajganj', 'Mahoba', 'Mainpuri', 'Mathura', 'Mau', 'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Pratapgarh', 'Prayagraj', 'Raebareli', 'Rampur', 'Saharanpur', 'Sambhal', 'Sant Kabir Nagar', 'Shahjahanpur', 'Shamli', 'Shrawasti', 'Siddharthnagar', 'Sitapur', 'Sonbhadra', 'Sultanpur', 'Unnao', 'Varanasi','Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur', 'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram', 'Kalimpong', 'Kolkata', 'Malda', 'Murshidabad', 'Nadia', 'North 24 Parganas', 'Paschim Bardhaman', 'Paschim Medinipur', 'Purba Bardhaman', 'Purba Medinipur', 'Purulia', 'South 24 Parganas', 'Uttar Dinajpur','Nicobar', 'North and Middle Andaman', 'South Andaman','Chandigarh','Dadra and Nagar Haveli','Daman', 'Diu','Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi','Lakshadweep','Karaikal', 'Mahe', 'Pondicherry', 'Yanam']
    andhra_keywords = ['ap','andhra','andra','andra pradesh','andhra pradesh']
    fee_keywords = {
        'vl': ['very low fee', 'vl fee'],
        'l': ['low fee', 'l fee'],
        'm': ['medium fee', 'm fee'],
        'h': ['high fee', 'h fee'],
        'vh': ['very high fee', 'vh fee']
    }
    found = False

    for keyword in andhra_keywords:
        if keyword.lower() in query.lower():
            entitiesFound['andhra'] = 'Andhra Pradesh'
            found = True
            break
    for keyword in district_keywords:
        if keyword.lower() in query.lower():
            entitiesFound['district'] = keyword
            found = True
            break
    
    for category, keywords in fee_keywords.items():
        for keyword in keywords:
            if keyword in query.lower():
                entitiesFound['fee'] = category
                break

    for ent in doc.ents:
        if ent.label_ == 'INFRA':
            try:
                entitiesFound['infra'] = ent.text
                print("inserted")
            except:
                print("Cant insert")
        elif ent.label_ == 'FACULTY':
            try:
                entitiesFound['faculty'] = ent.text
                print("inserted")
            except:
                print("Cant insert")
        elif ent.label_ == 'COURSE':
            try:
                entitiesFound['course'] = ent.text
                print("inserted")
            except:
                print("Cant insert")
        elif ent.label_ == 'STATE':
            try:
                entitiesFound['state'] = ent.text
                print("inserted")
            except:
                print("Cant insert")
        elif ent.label_ == 'STREAM':
            try:
                entitiesFound['stream'] = ent.text
                print("inserted")
            except:
                print("Cant insert")
        print(ent.text, ent.label_)
    print(entitiesFound)

    rating_match = re.findall(r'\d+\.\d+', query)
    if rating_match:
        entitiesFound['rating'] = float(rating_match[0])
        found = True

        # Determine rating comparison type
        if 'or above' in query.lower() or 'at least' in query.lower() or 'greater than' in query.lower():
            entitiesFound['rating_comparison'] = 'gte'
        elif 'or below' in query.lower() or 'at most' in query.lower() or 'less tha n' in query.lower():
            entitiesFound['rating_comparison'] = 'lte'
        elif 'equal to' in query.lower():
            entitiesFound['rating_comparison'] = 'eq'

   
    print('Founded entities',entitiesFound)
    return entitiesFound


def filter_data(data, entities):
    if not entities:
        return pd.DataFrame()  # Return empty DataFrame if no valid criteria

    infra_criteria = 1 if entities['infra'] == 'Good' else 2
    faculty_criteria = 1 if entities['faculty'] == 'Good' else 2
    rating_criteria = entities['rating']
    course_criteria = entities['course']
    state_criteria = entities['state']
    andhra_criteria = entities['andhra']
    fee_criteria = entities['fee']
    district_criteria = entities.get('district')

    stream_criteria = 'E'
    if entities['stream'] in ['btech', 'mtech', 'integrated mtech']:
        stream_criteria = 'E'
    elif entities['stream'] == 'management':
        stream_criteria = 'M'
    elif entities['stream'] == 'pharmacy':
        stream_criteria = 'P'
    elif entities['stream'] in ['arts', 'culture', 'arts and culture']:
        stream_criteria = 'AS'

    if entities['rating_comparison'] == 'gte':
        rating_filter = data['Rating'] >= rating_criteria
    elif entities['rating_comparison'] == 'lte':
        rating_filter = data['Rating'] <= rating_criteria
    else:
        rating_filter = data['Rating'] == rating_criteria

    course_filter = True
    if stream_criteria == 'P':
        course_filter = data['Course'].str.lower().str.contains('b.pharm')
    elif course_criteria is not None:
        course_filter = data['Course'].str.lower().str.contains(course_criteria.lower())

    state_filter = True
    if state_criteria is not None:
        state_filter = data['State'].str.contains(state_criteria)
    andhra_filter = True
    if andhra_criteria is not None:
        andhra_filter = data['State'].str.contains(andhra_criteria)
    district_filter = True
    if district_criteria:
        data = data[data['District'].str.contains(district_criteria, na=False)]

    fee_filter = True
    if fee_criteria is not None:
        fee_filter = data['FeeCategory'].str.lower() == fee_criteria.lower()

    filtered_data = data[
        ((data['Infra'] >= infra_criteria) | (entities['infra'] is None)) &
        ((data['Faculty'] >= faculty_criteria) | (entities['faculty'] is None)) &
        (state_filter | (entities['state'] is None)) &
        (andhra_filter | (entities['andhra'] is None)) &
        (district_filter | (entities['district'] is None)) &    
        (rating_filter | (entities['rating'] is None)) &
        (data['Category'].str.contains(stream_criteria, case=False) | (entities['stream'] is None)) &
        (course_filter | (entities['course'] is None)) &
        (fee_filter | (fee_criteria is None))
    ]

    print("Stream Criteria:", stream_criteria)
    print("Filtered Data after stream filter:\n", filtered_data[['Category', 'Course']])

    filtered_data['Rating'] = pd.to_numeric(filtered_data['Rating'], errors='coerce')
    filtered_data['Infra'] = pd.to_numeric(filtered_data['Infra'], errors='coerce')
    filtered_data['Faculty'] = pd.to_numeric(filtered_data['Faculty'], errors='coerce')

    rating_weight = 0.4
    placements_weight = 0.3
    alp_weight = 0.3

    filtered_data['Combined Score'] = (
        filtered_data['Rating'] * rating_weight +
        filtered_data['Placement %'] * placements_weight +
        filtered_data['ALP'] * alp_weight
    )

    filtered_data['Rank'] = filtered_data['Combined Score'].rank(ascending=False)

    filtered_data = filtered_data.sort_values(by='Rank').reset_index(drop=True)
    filtered_data = filtered_data.drop(columns=['Combined Score'])
    filtered_data = filtered_data.drop(columns=['FeeCategory', 'S links', 'Classified Rating'])
    filtered_data['Comments'] = filtered_data['S.No'].apply(
    lambda x: f"<a href='/comments/{x}'> Comments </a>"
    )

    print("Infra Criteria:", infra_criteria)
    print("Final Filtered Data:\n", filtered_data)

    return filtered_data


def generate_response(filtered_data):
    if filtered_data.empty:
        return "No colleges found matching the criteria."

    response = "Here are some colleges matching your criteria: <br>"
  
    def format_link(x):
        if not str(x).startswith('<a href'):
            return f'<a href="{x}" target="_blank">Visit College</a>'
        return x

    filtered_data['Links'] = filtered_data['Links'].apply(format_link) 
    is_filtered_col = session.get('isFiltered_col', False)
    if is_filtered_col:
        infra_map = {1: 'Good', 2: 'Very Good'}
        faculty_map = {1: 'Good', 2: 'Very Good'}
        
        # Mapping the numerical values back to categorical values
        filtered_data['Infra'] = filtered_data['Infra'].map(infra_map)
        filtered_data['Faculty'] = filtered_data['Faculty'].map(faculty_map)
    print('isFiltered value',isFiltered_col)
    # Converting DataFrame to HTML
    table_html = filtered_data.to_html(classes='table table-bordered', index=False,escape=False)
    return Markup(response + table_html)


@app.route('/recommend', methods=['POST', 'GET'])
def recommend_colleges():
    session['isFiltered_col'] = True
    query = request.form['query']
    user_id = session.get('user_id')
    entities = extract_entities(query)
    if entities is None:
        return render_template('search.html', answer="No valid criteria found in the query.", text=query)
    
    global filtered_colleges
    filtered_colleges = filter_data(data, entities)
    
    show = request.form.get('show', 'default')
    if show == 'default':
        filtered_colleges = filtered_colleges[:10]
    elif show == 'top20':
        filtered_colleges = filtered_colleges[:20]
    elif show == 'top30':
        filtered_colleges = filtered_colleges[:30]
    
    response = generate_response(filtered_colleges)

    top_institutes = filtered_colleges.head(3)
    institute_names = top_institutes['inst_name'].tolist()
    placement_values = top_institutes['Placement %'].tolist()
    message = "My recommendations are " + ", ".join(institute_names)+" because they have high placement percentage "
    
    # Start a new thread for the text-to-speech function
    threading.Thread(target=speak_message, args=(message,)).start()
    
    try:
        # Insert query and response into the database with user_id
        cursor = mysql.connection.cursor()
        cursor.execute('INSERT INTO previous_queries (query, response, user_id) VALUES (%s, %s, %s)', (query, response, user_id))
        mysql.connection.commit()
        cursor.close()
    except MySQLdb.Error as e:
        logging.error('MySQL error: %s', str(e))
        return render_template('search.html', answer="Error saving query and response to database.", text=query)
    except Exception as e:
        logging.error('General error: %s', str(e))
        return render_template('search.html', answer="Error saving query and response to database.", text=query)
    
    print(f"Number of colleges after filtering: {len(filtered_colleges)}")

    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT id FROM previous_queries WHERE query = %s', (query,))
        result = cursor.fetchone()
        cursor.close()
        
        if result:
            q_id = result['id']
            session['q_id'] = q_id
            print('queryid', session.get('q_id'))
        else:
            print("Query ID not found.")
    except MySQLdb.Error as e:
        logging.error('MySQL error: %s', str(e))
        print('Error saving q_id')
    
    return render_template('search.html', colleges=filtered_colleges, answer=response, text=query)
def speak_message(message):
    """Use pyttsx3 for offline TTS to avoid playsound/gTTS build issues on Windows."""
    try:
        # Initialize engine locally to be thread-safe
        eng = pyttsx3.init()
        eng.setProperty('rate', 150)
        eng.say(message)
        eng.runAndWait()
    except Exception as e:
        logging.error('TTS error: %s', str(e))

# Fetch previous queries from the database
# Fetch previous queries from the database
@app.route('/previous')
def display_previous_queries():
    user_id = session.get('user_id')  # Retrieve user_id from session
    if user_id is None:
        return render_template('previous_queries.html', previous_queries=[])

    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT * FROM previous_queries WHERE user_id = %s ORDER BY id DESC LIMIT 10', (user_id,))
        previous_queries = cursor.fetchall()
        cursor.close()
    except MySQLdb.Error as e:
        logging.error('MySQL error: %s', str(e))
        previous_queries = []
    except Exception as e:
        logging.error('General error: %s', str(e))
        previous_queries = []
    
    return render_template('previous_queries.html', previous_queries=previous_queries)


@app.route('/voice_command', methods=['POST']) 
def voice_command():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Speak something...")
        try:
            audio_data = recognizer.listen(source, timeout=2, phrase_time_limit=10)
            text = recognizer.recognize_google(audio_data)
            print("You said: " + text)
        except sr.WaitTimeoutError:
            text = "Listening timed out while waiting for phrase to start"
            print(text)
        except sr.UnknownValueError:
            text = "Sorry, I didn't understand that."
            print(text)
        except sr.RequestError as e:
            text = "Error; {0}".format(e)
            print(text)

    return text
@app.route('/applyFilter', methods=['POST'])
def add_filters():
    # Get the form inputs
    departments = request.form.getlist('department')
    courses = request.form.getlist('course')
    rating = request.form.get('rating')
    state = request.form.get('inputState')
    district = request.form.get('inputDistrict')
    q_id = session.get('q_id')

    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT query FROM previous_queries WHERE id = %s', (q_id,))
        result = cursor.fetchone()
        cursor.close()

        if result:
            text = result['query']
            print('query printed')
        else:
            text = "error printing query"
    except MySQLdb.Error as e:
        logging.error('MySQL error: %s', str(e))
        print("Error getting q_id")

    # Convert rating to float for comparison
    if rating:
        rating = float(rating)

    # Read the CSV file
    df = pd.read_csv('cdatanew.csv')

    # Use df if filtered_colleges is empty
    is_filtered_col = session.get('isFiltered_col', False)
    if is_filtered_col==False:
        filtered_data = df.copy()
    else:
        filtered_data = filtered_colleges.copy()

    # Convert the 'Rating' column to numeric, forcing errors to NaN and then dropping them
    filtered_data['Rating'] = pd.to_numeric(filtered_data['Rating'], errors='coerce')
    filtered_data = filtered_data.dropna(subset=['Rating'])

    # Apply rating filter
    if rating:
        filtered_data = filtered_data[filtered_data['Rating'] >= rating]

    # Map departments to categories
    department_map = {
        'eng': 'E',
        'med': 'P',
        'business': 'M'
    }

    # Apply department filter if any
    if departments:
        department_categories = [department_map[dept] for dept in departments if dept in department_map]
        print(f"Department Categories: {department_categories}")  # Debug statement
        department_filter = filtered_data['Category'].str.contains('|'.join(department_categories), case=False, na=False)
        print(f"Filtered Data After Department Filter: {filtered_data[department_filter].head()}")  # Debug statement
        filtered_data = filtered_data[department_filter]

    # Apply course filter if any
    course_map = {
        'B.Pharmacy': 'B.Pharm',
        'D.Pharmacy': 'D.Pharm',
        'M.Pharmacy': 'M.Pharm'
    }

    if courses:
        course_categories = [course_map[course] for course in courses if course in course_map]
        course_filter = filtered_data['Course'].str.contains('|'.join(course_categories), case=False, na=False)
        filtered_data = filtered_data[course_filter]

    # Apply state filter if provided
    if state and state != "SelectState":
        state_filter = filtered_data['State'].str.contains(state, case=False, na=False)
        filtered_data = filtered_data[state_filter]
        print(f"Filtering data for state {state}. Filtered Data After State Filter: {filtered_data.head()}")  # Debug statement

    # Apply district filter if provided
    if district and district != "--select one--":
        district_filter = filtered_data['District'].str.contains(district, case=False, na=False)
        filtered_data = filtered_data[district_filter]
    dp = pd.read_csv('cdatanew.csv')
    # Create mapping dictionaries for Infra and Faculty based on 'S.No'
    infra_map = dp.set_index('S.No')['Infra'].to_dict()
    faculty_map = dp.set_index('S.No')['Faculty'].to_dict()

    # Map the Infra and Faculty values in filtered_data
    filtered_data['Infra'] = filtered_data['S.No'].map(infra_map)
    filtered_data['Faculty'] = filtered_data['S.No'].map(faculty_map)

    # Check the values in 'Infra' and 'Faculty' columns after mapping
    print(f"Infra values after mapping: {filtered_data['Infra'].unique()}")
    print(f"Faculty values after mapping: {filtered_data['Faculty'].unique()}")

    response = generate_response(filtered_data)
    return render_template('search.html', answer=response, text=text)


@app.route('/sort', methods=['GET'])
def sort():
    print('sort method called')
    q_id = session.get('q_id')
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT query FROM previous_queries WHERE id = %s', (q_id,))
        result = cursor.fetchone()
        cursor.close()

        if result:
            text = result['query']
            print('query printed')
        else:
            text = "error printing query"
    except MySQLdb.Error as e:
        logging.error('MySQL error: %s', str(e))
        print("Error getting q_id")
    global filtered_colleges
    filtered_data = filtered_colleges.copy()
    choice = request.args.get('sort', 'default')

    # Apply necessary transformations
    filtered_data['Placement %'] = filtered_data['Placement %'].apply(lambda x: 'n/a' if pd.isna(x) else x)
    filtered_data['ALP'] = filtered_data['ALP'].apply(lambda x: 'n/a' if pd.isna(x) else x)

    if choice == 'placements' or choice == 'default':
        filtered_data['Placement %'] = pd.to_numeric(filtered_data['Placement %'], errors='coerce')
        filtered_data = filtered_data.sort_values(by='Placement %', ascending=False)
    elif choice == 'alp':
        filtered_data['ALP'] = pd.to_numeric(filtered_data['ALP'], errors='coerce')
        filtered_data = filtered_data.sort_values(by='ALP', ascending=False)

    # Only apply the link formatting once, after sorting
    def format_link(x):
        if not x.startswith('<a href'):
            return f'<a href="{x}" target="_blank">Visit College</a>'
        return x

    filtered_data['Links'] = filtered_data['Links'].apply(format_link)

    response = generate_response(filtered_data)
    return render_template('search.html', answer=response, text=text)

@app.route("/changePassword", methods=['POST'])
def changePassword():
    user_id = session.get('user_id')
    oldp = request.form['oldp']
    newp = request.form['newp']
    
    cursor = mysql.connection.cursor()
    
    # Ensure that user_id is passed as a tuple with a trailing comma
    cursor.execute('SELECT password FROM users WHERE id = %s', (user_id,))
    stored_password_row = cursor.fetchone()
    cursor.close()  # Close the cursor after use

    # Extract the password from the dictionary
    if stored_password_row:
        stored_password = stored_password_row['password']
        if stored_password == oldp:
            cursor = mysql.connection.cursor()
            cursor.execute('UPDATE users SET password = %s WHERE id = %s', (newp, user_id))
            mysql.connection.commit()
            cursor.close()
            text = "Password changed successfully"
        else:
            text = "Your old password is incorrect. Please try again."
    else:
        text = "User not found."
    
    return render_template('myaccount.html', text=text)


if __name__ == '__main__':
    app.run(debug=True)


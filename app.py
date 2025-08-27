from flask import Flask, request, render_template
from flask import Flask, session, redirect, url_for
import pymysql
from config import get_mysql_config
import logging
import pandas as pd
import spacy
import json
import re
from markupsafe import Markup
import speech_recognition as sr
from flask import session
import threading
import os
from flask import jsonify
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = 'crs'
app.config.from_object('config.Config')
import pyttsx3
engine = pyttsx3.init()

# Helper for PyMySQL connection
def get_db_connection():
    cfg = get_mysql_config()
    return pymysql.connect(
        host=cfg['host'],
        user=cfg['user'],
        password=cfg['password'],
        db=cfg['database'],
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )


# --- Enhancement: Cache spaCy model and config lists ---
try:
    nlp = spacy.load('custom_ner_model')
    logging.info("Custom NER model loaded.")
except Exception as e:
    logging.warning(f"Custom NER model not loaded: {e}. Falling back to en_core_web_sm.")
    nlp = spacy.load('en_core_web_sm')

# --- Enhancement: Load keywords, synonyms, etc. from config file ---
def load_config_lists():
    try:
        with open('entity_config.json', 'r', encoding='utf-8') as f:
            config = json.load(f)
        return config
    except Exception as e:
        logging.error(f"Error loading config lists: {e}")
        return {}

config_lists = load_config_lists()

# --- Enhancement: Synonym mapping ---
def get_synonym(entity, value):
    synonyms = config_lists.get('synonyms', {}).get(entity, {})
    return synonyms.get(value.lower(), value)

# --- Enhancement: PhraseMatcher for multi-word entities ---
from spacy.matcher import PhraseMatcher
phrase_matcher = PhraseMatcher(nlp.vocab, attr='LOWER')
for entity_type in ['districts', 'states', 'courses']:
    patterns = [nlp.make_doc(text) for text in config_lists.get(entity_type, [])]
    phrase_matcher.add(entity_type, patterns)

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
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute('SELECT * FROM users WHERE email = %s AND password = %s', (email, password))
        account = cursor.fetchone()
    conn.close()
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
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute('INSERT INTO users (name, email, phno, password) VALUES (%s, %s, %s, %s)', (name, email, phno, password))
            conn.commit()
            cursor.execute('SELECT id, name, email FROM users WHERE email = %s', (email,))
            user = cursor.fetchone()
        conn.close()
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
    filtered = filter_data(data, entities)
    if show == 'default':
        filtered = filtered[:10]
    elif show == 'top20':
        filtered = filtered[:20]
    elif show == 'top30':
        filtered = filtered[:30]
    html_response = str(generate_response(filtered))
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute('INSERT INTO previous_queries (query_text, result_colleges, user_id) VALUES (%s, %s, %s)', (query_text, html_response, user_id))
            conn.commit()
        conn.close()
    except Exception as e:
        logging.error('Error saving previous query: %s', str(e))
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
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute('SELECT user_id, query_text, result_colleges, query_time FROM previous_queries WHERE user_id = %s ORDER BY id DESC LIMIT 10', (user_id,))
            rows = cursor.fetchall()
        conn.close()
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
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute('SELECT name, email, phno FROM users WHERE id = %s', (user_id,))
        user = cursor.fetchone()
    conn.close()
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
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
        account = cursor.fetchone()
        email = account['email']
        msg = request.form['msg']
        try:
            cursor.execute('INSERT INTO feedback (user_id, email, feedback) VALUES (%s, %s, %s)', (user_id, email, msg))
            conn.commit()
            return render_template('myaccount.html')
        except Exception as e:
            logging.error('Feedback error: %s', str(e))
            return render_template('myaccount.html', error=e)
    conn.close()

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
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute('SELECT * FROM databasecdata WHERE `COL 1` = %s LIMIT 0, 25', (s_no,))
            college = cursor.fetchone()
        conn.close()
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
            conn = get_db_connection()
            with conn.cursor() as cursor:
                cursor.execute('INSERT INTO users (name,email,phno, password) VALUES (%s, %s, %s, %s)', (name,email,phno, password))
                conn.commit()
                cursor.execute('SELECT id, email FROM users WHERE email = %s', (email,))
                user = cursor.fetchone()
                session['user_id'] = user['id']  # Store user ID in session
                session['email'] = user['email']
            conn.close()
            logging.debug('User %s successfully registered.', email)
            return render_template('loginDone.html')
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
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute('SELECT * FROM users WHERE email = %s AND password = %s', (email, password))
        account = cursor.fetchone()
    conn.close()
    if account:
        session['user_id'] = account['id']  # Store user ID in session
        return render_template('search.html')
    else:
        logging.warning('Passwords do not match for user %s.', email)
        return render_template('index.html', error="Incorrect email/password")

# ... (all other imports and existing code) ...

def extract_entities(query):
    import pandas as pd
    import logging
    from thefuzz import process
    
    entitiesFound = {
        'infra': [],
        'faculty': [],
        'course': [],
        'stream': [],
        'rating': None,
        'rating_comparison': 'eq',
        'state': [],
        'andhra': None, # This can be removed or ignored in the next steps
        'district': [],
        'fee': None,
        'confidence': {}
    }

    query_lower = query.lower()
    doc = nlp(query)
    
    # --- Fuzzy and Phrase Matching ---
    
    # Check for Andhra Pradesh and normalize it to the state list
    andhra_keywords = config_lists.get('andhra_keywords', ['ap', 'andhra', 'andra', 'andra pradesh', 'andhra pradesh'])
    andhra_match = process.extractOne(query_lower, andhra_keywords, score_cutoff=70)
    if andhra_match:
        # Instead of setting a separate 'andhra' key, append to 'state'
        entitiesFound['state'].append('Andhra Pradesh')
        entitiesFound['confidence']['state'] = andhra_match[1]

    # Use PhraseMatcher for other pre-defined multi-word entities
    matches = phrase_matcher(doc)
    for match_id, start, end in matches:
        label = nlp.vocab.strings[match_id]
        value = doc[start:end].text
        if label in entitiesFound:
            normalized_value = get_synonym(label, value)
            entitiesFound[label].append(normalized_value)
            entitiesFound['confidence'][label] = 100

    # Use fuzzy matching as a fallback for all other entities
    for entity in ['course', 'stream', 'state', 'district', 'infra', 'faculty']:
        keywords = config_lists.get(entity + 's', [])
        match = process.extractOne(query_lower, keywords, score_cutoff=85)
        
        # Check if the entity is already found before adding a fuzzy match
        if match and match[0] not in entitiesFound[entity]:
            normalized_value = get_synonym(entity, match[0])
            entitiesFound[entity].append(normalized_value)
            entitiesFound['confidence'][entity] = match[1]

    # --- Andhra fuzzy normalization (already good) ---
    andhra_keywords = config_lists.get('andhra_keywords', ['ap', 'andhra', 'andra', 'andra pradesh', 'andhra pradesh'])
    andhra_match = process.extractOne(query_lower, andhra_keywords, score_cutoff=70)   # more tolerant threshold
    if andhra_match:
        entitiesFound['andhra'] = 'Andhra Pradesh'
        entitiesFound['confidence']['andhra'] = andhra_match[1]

    # --- Fee keywords ---
    fee_keywords = config_lists.get('fee_keywords', {
        'vl': ['very low fee', 'vl fee'],
        'l': ['low fee', 'l fee'],
        'm': ['medium fee', 'm fee'],
        'h': ['high fee', 'h fee'],
        'vh': ['very high fee', 'vh fee']
    })
    for category, keywords in fee_keywords.items():
        match = process.extractOne(query_lower, keywords, score_cutoff=80)
        if match:
            entitiesFound['fee'] = category
            entitiesFound['confidence']['fee'] = match[1]
            break # Exit loop once a match is found

    # --- Rating extraction ---
    rating_match = re.findall(r'(\d+\.\d+|\d+)', query)
    if rating_match:
        try:
            entitiesFound['rating'] = float(rating_match[0])
        except Exception:
            entitiesFound['rating'] = int(rating_match[0])
        entitiesFound['confidence']['rating'] = 100
        comp_phrases = config_lists.get('comp_phrases', {
            'gte': ['or above', 'at least', 'greater than', 'more than', 'minimum'],
            'lte': ['or below', 'at most', 'less than', 'maximum'],
            'eq': ['equal to', 'exactly', 'equals']
        })
        for comp, phrases in comp_phrases.items():
            for phrase in phrases:
                if phrase in query_lower:
                    entitiesFound['rating_comparison'] = comp
                    break

    star_match = re.search(r'(\d+)\s*star', query_lower)
    if star_match:
        entitiesFound['rating'] = float(star_match.group(1))
        entitiesFound['confidence']['rating'] = 100
        
    # Remove duplicates from the lists
    for key in ['course', 'stream', 'state', 'district', 'infra', 'faculty']:
        entitiesFound[key] = list(set(entitiesFound[key]))

    logging.info(f"Extracted entities: {entitiesFound}")
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

    # --- Stream mapping ---
    stream_criteria = 'E'
    if entities['stream'] in ['btech', 'mtech', 'integrated mtech']:
        stream_criteria = 'E'
    elif entities['stream'] == 'management':
        stream_criteria = 'M'
    elif entities['stream'] == 'pharmacy':
        stream_criteria = 'P'
    elif entities['stream'] in ['arts', 'culture', 'arts and culture']:
        stream_criteria = 'AS'

    # --- Rating filter ---
    if entities['rating_comparison'] == 'gte':
        rating_filter = data['Rating'] >= rating_criteria
    elif entities['rating_comparison'] == 'lte':
        rating_filter = data['Rating'] <= rating_criteria
    else:
        rating_filter = data['Rating'] == rating_criteria

    # --- Course filter ---
    course_filter = True
    if stream_criteria == 'P':
        course_filter = data['Course'].str.lower().str.contains('b.pharm', na=False)
    elif course_criteria:
        course_filter = data['Course'].str.lower().apply(
            lambda x: any(c.lower() in x for c in course_criteria)
        )

    # --- State filter (fix for list issue) ---
    state_filter = True
    if state_criteria:
        pattern = '|'.join(map(re.escape, state_criteria)) if isinstance(state_criteria, list) else re.escape(str(state_criteria))
        state_filter = data['State'].str.contains(pattern, case=False, na=False)

    # --- Andhra filter ---
    andhra_filter = True
    if andhra_criteria:
        andhra_filter = data['State'].str.contains(andhra_criteria, case=False, na=False)

    # --- District filter (fix for list issue) ---
    district_filter = True
    if district_criteria:
        pattern = '|'.join(map(re.escape, district_criteria)) if isinstance(district_criteria, list) else re.escape(str(district_criteria))
        district_filter = data['District'].str.contains(pattern, case=False, na=False)

    # --- Fee filter ---
    fee_filter = True
    if fee_criteria:
        fee_filter = data['FeeCategory'].str.lower() == fee_criteria.lower()

    # --- Apply all filters ---
    filtered_data = data[
        ((data['Infra'] >= infra_criteria) | (entities['infra'] is None)) &
        ((data['Faculty'] >= faculty_criteria) | (entities['faculty'] is None)) &
        (state_filter | (not state_criteria)) &
        (andhra_filter | (not andhra_criteria)) &
        (district_filter | (not district_criteria)) &
        (rating_filter | (entities['rating'] is None)) &
        (data['Category'].str.contains(stream_criteria, case=False, na=False) | (entities['stream'] is None)) &
        (course_filter | (not course_criteria)) &
        (fee_filter | (fee_criteria is None))
    ]

    print("Stream Criteria:", stream_criteria)
    print("Filtered Data after stream filter:\n", filtered_data[['Category', 'Course']])

    # --- Convert numeric fields ---
    filtered_data['Rating'] = pd.to_numeric(filtered_data['Rating'], errors='coerce')
    filtered_data['Infra'] = pd.to_numeric(filtered_data['Infra'], errors='coerce')
    filtered_data['Faculty'] = pd.to_numeric(filtered_data['Faculty'], errors='coerce')

    # --- Ranking calculation ---
    rating_weight = 0.4
    placements_weight = 0.3
    alp_weight = 0.3

    filtered_data['Combined Score'] = (
        filtered_data['Rating'] * rating_weight +
        filtered_data['Placement %'] * placements_weight +
        filtered_data['ALP'] * alp_weight
    )

    filtered_data['Rank'] = filtered_data['Combined Score'].rank(ascending=False)

    # --- Final cleanup ---
    filtered_data = filtered_data.sort_values(by='Rank').reset_index(drop=True)
    filtered_data = filtered_data.drop(columns=['Combined Score'], errors='ignore')
    filtered_data = filtered_data.drop(columns=['FeeCategory', 'S links', 'Classified Rating'], errors='ignore')
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
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                'INSERT INTO previous_queries (query_text, result_colleges, user_id) VALUES (%s, %s, %s)',
                (query, response, user_id)
            )

            conn.commit()
        conn.close()
    except Exception as e:
        logging.error('Error saving query and response to database: %s', str(e))
        return render_template('search.html', answer="Error saving query and response to database.", text=query)
    
    print(f"Number of colleges after filtering: {len(filtered_colleges)}")

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute('SELECT id FROM previous_queries WHERE query_text = %s', (query,))
            result = cursor.fetchone()
        conn.close()
        
        if result:
            q_id = result['id']
            session['q_id'] = q_id
            print('queryid', session.get('q_id'))
        else:
            print("Query ID not found.")
    except Exception as e:
        logging.error('Error saving q_id: %s', str(e))
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
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute('SELECT * FROM previous_queries WHERE user_id = %s ORDER BY id DESC LIMIT 10', (user_id,))
            previous_queries = cursor.fetchall()
        conn.close()
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
    departments = request.form.getlist('department')
    courses = request.form.getlist('course')
    rating = request.form.get('rating')
    state = request.form.get('inputState')
    district = request.form.get('inputDistrict')
    q_id = session.get('q_id')
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute('SELECT query_text FROM previous_queries WHERE id = %s', (q_id,))
            result = cursor.fetchone()
        conn.close()
        if result:
            text = result['query_text']
            print('query printed')
        else:
            text = "error printing query"
    except Exception as e:
        logging.error('Error getting q_id: %s', str(e))
        print("Error getting q_id")
    if rating:
        rating = float(rating)
    df = pd.read_csv('cdatanew.csv')
    is_filtered_col = session.get('isFiltered_col', False)
    if is_filtered_col==False:
        filtered_data = df.copy()
    else:
        filtered_data = filtered_colleges.copy()
    filtered_data['Rating'] = pd.to_numeric(filtered_data['Rating'], errors='coerce')
    filtered_data = filtered_data.dropna(subset=['Rating'])
    if rating:
        filtered_data = filtered_data[filtered_data['Rating'] >= rating]
    department_map = {
        'eng': 'E',
        'med': 'P',
        'business': 'M'
    }
    if departments:
        department_categories = [department_map[dept] for dept in departments if dept in department_map]
        print(f"Department Categories: {department_categories}")
        department_filter = filtered_data['Category'].str.contains('|'.join(department_categories), case=False, na=False)
        print(f"Filtered Data After Department Filter: {filtered_data[department_filter].head()}")
        filtered_data = filtered_data[department_filter]
    course_map = {
        'B.Pharmacy': 'B.Pharm',
        'D.Pharmacy': 'D.Pharm',
        'M.Pharmacy': 'M.Pharm'
    }
    if courses:
        course_categories = [course_map[course] for course in courses if course in course_map]
        course_filter = filtered_data['Course'].str.contains('|'.join(course_categories), case=False, na=False)
        filtered_data = filtered_data[course_filter]
    if state and state != "SelectState":
        state_filter = filtered_data['State'].str.contains(state, case=False, na=False)
        filtered_data = filtered_data[state_filter]
        print(f"Filtering data for state {state}. Filtered Data After State Filter: {filtered_data.head()}")
    if district and district != "--select one--":
        district_filter = filtered_data['District'].str.contains(district, case=False, na=False)
        filtered_data = filtered_data[district_filter]
    dp = pd.read_csv('cdatanew.csv')
    infra_map = dp.set_index('S.No')['Infra'].to_dict()
    faculty_map = dp.set_index('S.No')['Faculty'].to_dict()
    filtered_data['Infra'] = filtered_data['S.No'].map(infra_map)
    filtered_data['Faculty'] = filtered_data['S.No'].map(faculty_map)
    print(f"Infra values after mapping: {filtered_data['Infra'].unique()}")
    print(f"Faculty values after mapping: {filtered_data['Faculty'].unique()}")
    response = generate_response(filtered_data)
    return render_template('search.html', answer=response, text=text)


@app.route('/sort', methods=['GET'])
def sort():
    print('sort method called')
    q_id = session.get('q_id')
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute('SELECT query_text FROM previous_queries WHERE id = %s', (q_id,))
            result = cursor.fetchone()
        conn.close()
        if result:
            text = result['query_text']
            print('query printed')
        else:
            text = "error printing query"
    except Exception as e:
        logging.error('Error getting q_id: %s', str(e))
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
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute('SELECT password FROM users WHERE id = %s', (user_id,))
        stored_password_row = cursor.fetchone()
        if stored_password_row:
            stored_password = stored_password_row['password']
            if stored_password == oldp:
                cursor.execute('UPDATE users SET password = %s WHERE id = %s', (newp, user_id))
                conn.commit()
                text = "Password changed successfully"
            else:
                text = "Your old password is incorrect. Please try again."
        else:
            text = "User not found."
    conn.close()
    return render_template('myaccount.html', text=text)


if __name__ == '__main__':
    app.run(debug=True)


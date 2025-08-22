# College Recommendation System

A modern, AI-powered college recommendation system built with React TypeScript frontend and Flask Python backend. The system provides intelligent college recommendations based on user queries, filters, and historical data.

## Features

- **AI-Powered Search**: Natural language processing for college queries
- **Voice Recognition**: Voice search capability using Web Speech API
- **Smart Filtering**: Advanced filters for course type, location, rating, and more
- **User Authentication**: Secure login/signup system
- **Query History**: Track and repeat previous searches
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Real-time Results**: Instant college recommendations with detailed information

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Router** for navigation
- **Axios** for API communication

### Backend
- **Flask** Python web framework
- **MySQL** database
- **SpaCy** for NLP processing
- **Pandas** for data manipulation
- **Speech Recognition** for voice processing

## Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- MySQL database
- Required Python packages (see requirements.txt)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd college-recommendation-system
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Database Setup

1. Create a MySQL database
2. Update the database configuration in `config.py`
3. Run the database migrations (if any)

#### Environment Configuration

Create a `config.py` file in the root directory:

```python
class Config:
    MYSQL_HOST = 'localhost'
    MYSQL_USER = 'your_username'
    MYSQL_PASSWORD = 'your_password'
    MYSQL_DB = 'college_recommendation'
    SECRET_KEY = 'your_secret_key'
```

### 3. Frontend Setup

#### Install Dependencies

```bash
npm install
```

#### Environment Variables

Create a `.env` file in the `src` directory:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

## Running the Application

### 1. Start the Backend

```bash
# From the root directory
python app.py
```

The Flask server will start on `http://localhost:5000`

### 2. Start the Frontend

```bash
# From the college-recommendation-system directory
npm start
```

The React app will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/signup` - User registration

### College Recommendations
- `POST /api/recommend` - Get college recommendations
- `GET /api/previous` - Get user's previous queries
- `POST /api/applyFilter` - Apply additional filters
- `GET /api/sort` - Sort results by criteria

### Voice Recognition
- `POST /api/voice_command` - Process voice commands

## Project Structure

```
college-recommendation-system/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AuthFlipCard.tsx
│   │   ├── CollegeCard.tsx
│   │   ├── QueryHistory.tsx
│   │   └── RecommendationForm.tsx
│   ├── pages/              # Page components
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   └── QueryHistory.tsx
│   ├── services/           # API services
│   │   └── api.ts
│   ├── hooks/              # Custom React hooks
│   │   └── useVoiceRecognition.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx             # Main application component
│   └── index.tsx           # Application entry point
├── public/                 # Static assets
├── package.json            # Node.js dependencies
└── tsconfig.json          # TypeScript configuration
```

## Usage

### 1. User Registration/Login
- Click the "Login" button in the navigation
- Choose between login or signup
- Fill in the required information

### 2. College Search
- Enter your search query in natural language
- Use voice search by clicking the microphone button
- Apply filters for course type, location, and rating
- Click "Search Colleges" to get recommendations

### 3. Viewing Results
- Browse through college recommendations
- Use pagination to navigate through results
- Apply additional filters or sorting
- Click on college cards for more details

### 4. Query History
- Access your previous searches from the navigation
- Repeat previous queries with one click
- Track your search patterns

## Voice Search

The system supports voice search using the Web Speech API:

1. Click the microphone button in the search bar
2. Speak your college search query clearly
3. The system will transcribe and process your query
4. Results will be displayed automatically

**Note**: Voice search requires HTTPS in production and microphone permissions.

## Customization

### Adding New Filters

1. Update the `SearchFilters` interface in `types/index.ts`
2. Modify the filter components in `RecommendationForm.tsx`
3. Update the backend API to handle new filter parameters

### Styling

The application uses Tailwind CSS for styling. Custom styles can be added to `App.css` or by extending Tailwind classes.

### Database Schema

To modify the college data structure:

1. Update the `College` interface in `types/index.ts`
2. Modify the backend data processing in `app.py`
3. Update the `CollegeCard` component to display new fields

## Troubleshooting

### Common Issues

1. **Voice Recognition Not Working**
   - Ensure you're using a supported browser (Chrome, Edge, Safari)
   - Check microphone permissions
   - Use HTTPS in production

2. **API Connection Errors**
   - Verify the backend server is running
   - Check the API base URL configuration
   - Ensure CORS is properly configured

3. **Database Connection Issues**
   - Verify MySQL server is running
   - Check database credentials in `config.py`
   - Ensure the database exists

### Performance Optimization

1. **Frontend**
   - Use React.memo for expensive components
   - Implement proper loading states
   - Optimize bundle size with code splitting

2. **Backend**
   - Implement database indexing
   - Use connection pooling
   - Cache frequently accessed data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Roadmap

- [ ] Advanced analytics dashboard
- [ ] College comparison tool
- [ ] Student reviews and ratings
- [ ] Mobile app development
- [ ] Machine learning model improvements
- [ ] Multi-language support
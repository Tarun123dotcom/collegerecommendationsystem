# College Recommendation System

This project is a College Recommendation System built with React and TypeScript. It provides a user-friendly interface for users to log in, sign up, and receive college recommendations based on their input criteria. The application also allows users to view their previous queries.

## Features

- **User Authentication**: Users can sign up and log in using a flip model interface.
- **Query History**: After logging in, users can view their previous queries.
- **College Recommendations**: Users can input criteria to receive personalized college recommendations.
- **Responsive Design**: The application is designed to be responsive and user-friendly.

## Project Structure

```
college-recommendation-system
├── public
│   └── index.html
├── src
│   ├── components
│   │   ├── AuthFlipCard.tsx
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   ├── QueryHistory.tsx
│   │   └── RecommendationForm.tsx
│   ├── pages
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   └── NotFound.tsx
│   ├── services
│   │   └── api.ts
│   ├── App.tsx
│   ├── index.tsx
│   └── types
│       └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/college-recommendation-system.git
   ```

2. Navigate to the project directory:
   ```
   cd college-recommendation-system
   ```

3. Install the dependencies:
   ```
   npm install
   ```

## Usage

1. Start the development server:
   ```
   npm start
   ```

2. Open your browser and go to `http://localhost:3000` to view the application.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
import React from 'react';
import QueryHistory from '../components/QueryHistory';
import RecommendationForm from '../components/RecommendationForm';

const Dashboard: React.FC = () => {
    return (
        <div>
            <h1>Dashboard</h1>
            <QueryHistory />
            <RecommendationForm />
        </div>
    );
};

export default Dashboard;
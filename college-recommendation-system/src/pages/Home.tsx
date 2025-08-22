import React from 'react';
import AuthFlipCard from '../components/AuthFlipCard';

const Home: React.FC = () => {
    return (
        <div className="home-container" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)'
        }}>
            <h1 style={{ fontWeight: 700, marginBottom: 8, color: '#2d3a4b' }}>
                Welcome to the College Recommendation System
            </h1>
            <p style={{ marginBottom: 32, color: '#4b5563' }}>
                Your journey to finding the right college starts here.
            </p>
            <AuthFlipCard />
        </div>
    );
};

export default Home;
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import './AuthFlipCard.css'; // Assuming you have some CSS for styling

const AuthFlipCard: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);

    const toggleForm = () => {
        setIsLogin(!isLogin);
    };

    return (
        <div className="auth-flip-card">
            <div className={`card ${isLogin ? 'flipped' : ''}`}>
                <div className="front">
                    <h2>Login</h2>
                    <LoginForm />
                    <p onClick={toggleForm}>Don't have an account? Sign up</p>
                </div>
                <div className="back">
                    <h2>Sign Up</h2>
                    <SignupForm />
                    <p onClick={toggleForm}>Already have an account? Login</p>
                </div>
            </div>
        </div>
    );
};

export default AuthFlipCard;
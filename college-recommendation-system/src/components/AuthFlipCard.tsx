import React, { useState } from 'react';
import { authAPI, setCurrentUser } from '../services/api';
import { User } from '../types';

interface AuthFlipCardProps {
  onAuthSuccess: (user: User) => void;
  onClose: () => void;
}

const AuthFlipCard: React.FC<AuthFlipCardProps> = ({ onAuthSuccess, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phno: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login
        const response = await authAPI.login(formData.email, formData.password);
        if (response.success && response.user) {
          setCurrentUser(response.user);
          onAuthSuccess(response.user);
        } else {
          setError(response.message || 'Login failed');
        }
      } else {
        // Signup
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }

        const response = await authAPI.signup(
          formData.name,
          formData.email,
          formData.phno,
          formData.password
        );
        
        if (response.success && response.user) {
          setCurrentUser(response.user);
          onAuthSuccess(response.user);
        } else {
          setError(response.message || response.error || 'Signup failed');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      name: '',
      email: '',
      phno: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="auth-flip-card-container">
        <div className={`auth-flip-card${isLogin ? '' : ' flipped'}`}> 
          {/* Front Side: Login */}
          <div className="auth-flip-card-face auth-flip-card-front">
            <div className="auth-flip-card-content">
              <button
                onClick={onClose}
                className="auth-flip-close-btn"
              >✕</button>
              <h2 className="auth-flip-title">Login</h2>
              {error && <div className="auth-flip-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="auth-flip-field">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                </div>
                <div className="auth-flip-field">
                  <label>Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
                </div>
                <button type="submit" disabled={isLoading} className="auth-flip-submit-btn">
                  {isLoading ? 'Processing...' : 'Login'}
                </button>
                <div className="auth-flip-switch">
                  Don't have an account?
                  <button type="button" onClick={toggleMode} className="auth-flip-switch-btn">Sign up</button>
                </div>
              </form>
            </div>
          </div>
          {/* Back Side: Signup */}
          <div className="auth-flip-card-face auth-flip-card-back">
            <div className="auth-flip-card-content">
              <button
                onClick={onClose}
                className="auth-flip-close-btn"
              >✕</button>
              <h2 className="auth-flip-title">Sign Up</h2>
              {error && <div className="auth-flip-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="auth-flip-field">
                  <label>Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="auth-flip-field">
                  <label>Phone Number</label>
                  <input type="tel" name="phno" value={formData.phno} onChange={handleInputChange} required />
                </div>
                <div className="auth-flip-field">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                </div>
                <div className="auth-flip-field">
                  <label>Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
                </div>
                <div className="auth-flip-field">
                  <label>Confirm Password</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required />
                </div>
                <button type="submit" disabled={isLoading} className="auth-flip-submit-btn">
                  {isLoading ? 'Processing...' : 'Sign Up'}
                </button>
                <div className="auth-flip-switch">
                  Already have an account?
                  <button type="button" onClick={toggleMode} className="auth-flip-switch-btn">Login</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthFlipCard;
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GraduationCap, Home, History, LogOut, User } from 'lucide-react';
import HomePage from './pages/Home';
import Dashboard from './pages/Dashboard';
import QueryHistoryPage from './pages/QueryHistory';
import AuthFlipCard from './components/AuthFlipCard';
import { User as UserType, College } from './types';
import { getCurrentUser, setCurrentUser, isAuthenticated } from './services/api';
import './App.css';

const App: React.FC = () => {
  const [currentUser, setCurrentUserState] = useState<UserType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard' | 'queries' | 'contact' | 'about'>('home');
  const [searchResults, setSearchResults] = useState<College[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUserState(user);
    }
  }, []);

  const handleAuthSuccess = (user: UserType) => {
    setCurrentUserState(user);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setCurrentUserState(null);
    setCurrentPage('home');
    setSearchResults([]);
    setSearchQuery('');
    // Clear user from localStorage
    localStorage.removeItem('user');
  };

  const handleSearchResults = (colleges: College[], query: string) => {
    setSearchResults(colleges);
    setSearchQuery(query);
    setCurrentPage('dashboard');
  };

  const handleBackToSearch = () => {
    setCurrentPage('home');
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleRepeatSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage('home');
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            colleges={searchResults}
            searchQuery={searchQuery}
            onBackToSearch={handleBackToSearch}
          />
        );
      case 'queries':
        return (
          <QueryHistoryPage
            onRepeatSearch={handleRepeatSearch}
          />
        );
      default:
        return (
          <HomePage
            onSearchResults={handleSearchResults}
            onLoadingChange={setIsLoading}
          />
        );
    }
  };

  // Footer link handlers
  const handleFooterNav = (tab: 'home' | 'queries' | 'contact' | 'about') => {
    setCurrentPage(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // Contact tab component
  const ContactTab = () => (
    <div className="fade-in" style={{maxWidth:'600px',margin:'0 auto',padding:'2rem 1rem'}}>
      <h2 style={{fontSize:'2rem',fontWeight:'800',color:'#4338ca',marginBottom:'1.2rem'}}>Contact Us</h2>
      <p style={{color:'#475569',fontSize:'1.1rem',marginBottom:'1.2rem'}}>Have questions or feedback? Reach out to us below:</p>
      <form style={{display:'flex',flexDirection:'column',gap:'1.2rem'}}>
        <input type="text" placeholder="Your Name" style={{padding:'0.8rem 1rem',borderRadius:'0.7rem',border:'1.5px solid #c7d2fe',fontSize:'1rem'}} />
        <input type="email" placeholder="Your Email" style={{padding:'0.8rem 1rem',borderRadius:'0.7rem',border:'1.5px solid #c7d2fe',fontSize:'1rem'}} />
        <textarea placeholder="Your Message" rows={4} style={{padding:'0.8rem 1rem',borderRadius:'0.7rem',border:'1.5px solid #c7d2fe',fontSize:'1rem'}} />
        <button type="submit" style={{background:'linear-gradient(90deg,#4338ca 60%,#6366f1 100%)',color:'#fff',fontWeight:'700',fontSize:'1.08rem',padding:'0.9rem 0',borderRadius:'1rem',border:'none',boxShadow:'0 2px 8px rgba(67,56,202,0.10)',cursor:'pointer'}}>Send Message</button>
      </form>
    </div>
  );

  // About tab component
  const AboutTab = () => (
    <div className="fade-in" style={{maxWidth:'700px',margin:'0 auto',padding:'2rem 1rem'}}>
      <h2 style={{fontSize:'2rem',fontWeight:'800',color:'#4338ca',marginBottom:'1.2rem'}}>About CollegeFind</h2>
      <p style={{color:'#475569',fontSize:'1.1rem',marginBottom:'1.2rem'}}>CollegeFind is an AI-powered platform designed to help students discover the best colleges for their career goals. Our recommendations are based on placements, ratings, reviews, and real student feedback.</p>
      <ul style={{color:'#475569',fontSize:'1.05rem',marginBottom:'1.2rem',paddingLeft:'1.2rem'}}>
        <li>• Smart Search with natural language queries</li>
        <li>• Data-driven recommendations</li>
        <li>• Community insights from students and alumni</li>
        <li>• Modern, beautiful user experience</li>
      </ul>
      <p style={{color:'#475569',fontSize:'1.05rem'}}>Our mission is to empower students to make informed decisions and find their perfect college match.</p>
    </div>
  );

  // Enhanced search handler for login check
  const handleSearchResultsWithAuth = (colleges: College[], query: string) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    handleSearchResults(colleges, query);
  };

  return (
    <Router>
      <div className="app-bg min-h-screen">
        {/* Navigation */}
        <nav className="nav-bar">
          <div className="nav-container">
            <div className="nav-flex">
              <div className="nav-left">
                <GraduationCap className="nav-icon" />
                <h1 className="nav-title">CollegeFind</h1>
              </div>
              <div className="nav-right">
                <button
                  onClick={() => setCurrentPage('home')}
                  className={`nav-btn ${currentPage === 'home' ? 'nav-btn-active' : ''}`}
                >
                  <Home className="nav-btn-icon" />
                  Home
                </button>
                <button
                  onClick={() => setCurrentPage('queries')}
                  className={`nav-btn ${currentPage === 'queries' ? 'nav-btn-active' : ''}`}
                >
                  <History className="nav-btn-icon" />
                  Previous Queries
                </button>
                <button
                  onClick={() => setCurrentPage('contact')}
                  className={`nav-btn ${currentPage === 'contact' ? 'nav-btn-active' : ''}`}
                >
                  Contact
                </button>
                <button
                  onClick={() => setCurrentPage('about')}
                  className={`nav-btn ${currentPage === 'about' ? 'nav-btn-active' : ''}`}
                >
                  About
                </button>
                {currentUser ? (
                  <div className="nav-user-flex">
                    <div className="nav-user-info">
                      <User className="user-icon" />
                      <span className="user-name">{currentUser.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="logout-btn"
                    >
                      <LogOut className="logout-icon" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="login-btn"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          {currentPage === 'home' ? (
            <HomePage
              onSearchResults={handleSearchResultsWithAuth}
              onLoadingChange={setIsLoading}
            />
          ) : currentPage === 'queries' ? (
            <QueryHistoryPage
              onRepeatSearch={(query) => {
                setCurrentPage('home');
                setSearchQuery(query);
              }}
            />
          ) : currentPage === 'contact' ? (
            <ContactTab />
          ) : currentPage === 'about' ? (
            <AboutTab />
          ) : renderContent()}
        </main>

        {/* Footer Section */}
        <footer className="footer">
          <div className="footer-container">
            <div className="footer-brand">
              <GraduationCap className="footer-icon" />
              <span className="footer-title">CollegeFind</span>
            </div>
            <div className="footer-links">
              <button className="footer-link" onClick={() => handleFooterNav('home')}>Home</button>
              <button className="footer-link" onClick={() => handleFooterNav('queries')}>Previous Queries</button>
              <button className="footer-link" onClick={() => handleFooterNav('contact')}>Contact</button>
              <button className="footer-link" onClick={() => handleFooterNav('about')}>About</button>
            </div>
            <div className="footer-copy">
              &copy; {new Date().getFullYear()} CollegeFind. All rights reserved.
            </div>
          </div>
        </footer>

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthFlipCard
            onAuthSuccess={handleAuthSuccess}
            onClose={() => setShowAuthModal(false)}
          />
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-modal">
              <div className="loading-spinner"></div>
              <p className="loading-text">Processing your request...</p>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
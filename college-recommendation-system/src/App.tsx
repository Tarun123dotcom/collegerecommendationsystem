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
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard' | 'queries'>('home');
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

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation */}
        <nav className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-8 h-8 text-indigo-600" />
                <h1 className="text-xl font-bold text-gray-900">CollegeFind</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentPage('home')}
                  className={`flex items-center px-3 py-2 rounded-md font-medium transition-colors ${
                    currentPage === 'home'
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </button>
                
                <button
                  onClick={() => setCurrentPage('queries')}
                  className={`flex items-center px-3 py-2 rounded-md font-medium transition-colors ${
                    currentPage === 'queries'
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  <History className="w-4 h-4 mr-2" />
                  Previous Queries
                </button>
                
                {currentUser ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">{currentUser.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthFlipCard
            onAuthSuccess={handleAuthSuccess}
            onClose={() => setShowAuthModal(false)}
          />
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing your request...</p>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
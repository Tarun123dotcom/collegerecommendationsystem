import React from 'react';
import { GraduationCap, Search, TrendingUp, Users, Award } from 'lucide-react';
import RecommendationForm from '../components/RecommendationForm';
import { College } from '../types';

interface HomeProps {
  onSearchResults: (colleges: College[], query: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

const Home: React.FC<HomeProps> = ({ onSearchResults, onLoadingChange }) => {
  return (
    <div className="fade-in home-page">
      <div className="home-header">
        <h1 className="home-title">Find Your Perfect College</h1>
        <p className="home-desc">Discover the best colleges for your career with AI-powered recommendations based on placements, ratings, and reviews.</p>
      </div>

      {/* Search Section */}
      <RecommendationForm 
        onSearchResults={onSearchResults}
        onLoadingChange={onLoadingChange}
      />

      {/* Quick Stats */}
      <div className="stats-row">
        <div className="stats-card">
          <div className="stats-value stats-blue">2,500+</div>
          <div className="stats-label">Colleges Listed</div>
        </div>
        <div className="stats-card">
          <div className="stats-value stats-green">95%</div>
          <div className="stats-label">Accuracy Rate</div>
        </div>
        <div className="stats-card">
          <div className="stats-value stats-purple">50K+</div>
          <div className="stats-label">Students Helped</div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Why Choose Our System?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Smart Search
            </h3>
            <p className="text-gray-600">
              Use natural language queries to find colleges that match your exact requirements.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Data-Driven
            </h3>
            <p className="text-gray-600">
              Get recommendations based on real data including placements, ratings, and infrastructure.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Community Insights
            </h3>
            <p className="text-gray-600">
              Access reviews and comments from students and alumni for authentic perspectives.
            </p>
          </div>
        </div>
      </div>

      {/* Popular Courses */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Popular Courses
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: 'B.Tech', icon: '⚡', color: 'bg-blue-100 text-blue-800' },
            { name: 'B.Pharmacy', icon: '💊', color: 'bg-green-100 text-green-800' },
            { name: 'MBA', icon: '📊', color: 'bg-purple-100 text-purple-800' },
            { name: 'BBA', icon: '💼', color: 'bg-orange-100 text-orange-800' },
          ].map((course) => (
            <div
              key={course.name}
              className={`${course.color} rounded-lg p-6 text-center hover:scale-105 transition-transform cursor-pointer`}
            >
              <div className="text-3xl mb-2">{course.icon}</div>
              <div className="font-semibold">{course.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
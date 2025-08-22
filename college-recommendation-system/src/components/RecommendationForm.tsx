import React, { useState } from 'react';
import { Search, Mic, MicOff } from 'lucide-react';
import { collegeAPI } from '../services/api';
import { College, SearchFilters } from '../types';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

interface RecommendationFormProps {
  onSearchResults: (colleges: College[], query: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

const RecommendationForm: React.FC<RecommendationFormProps> = ({ 
  onSearchResults, 
  onLoadingChange 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    courseType: '',
    location: '',
    ratingFilter: 'all'
  });

  const [error, setError] = useState<string>('');

  const handleVoiceResult = (transcript: string) => {
    setSearchQuery(transcript);
    setError('');
  };

  const handleVoiceError = (error: string) => {
    setError(error);
  };

  const {
    isListening,
    isSupported,
    toggleListening,
    clearError: clearVoiceError
  } = useVoiceRecognition({
    onResult: handleVoiceResult,
    onError: handleVoiceError
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setError('');
    onLoadingChange(true);

    try {
      const response = await collegeAPI.search(searchQuery, filters);
      
      if (response.success && response.colleges) {
        onSearchResults(response.colleges, searchQuery);
      } else {
        setError(response.message || 'No results found');
        onSearchResults([], searchQuery);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Search failed');
      onSearchResults([], searchQuery);
    } finally {
      onLoadingChange(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Query
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Top B.Pharmacy colleges in Telangana with good placements"
            className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
          />
          
          {isSupported && (
            <button
              onClick={toggleListening}
              className={`absolute right-12 top-2.5 p-1 rounded-full transition-colors ${
                isListening 
                  ? 'bg-red-500 text-white' 
                  : 'hover:bg-gray-100 text-gray-400'
              }`}
              title={isListening ? 'Stop listening' : 'Voice Search'}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}
          
          <Search className="absolute right-4 top-3.5 w-5 h-5 text-gray-400" />
        </div>
        
        {error && (
          <div className="mt-2 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Type
          </label>
          <select
            value={filters.courseType}
            onChange={(e) => handleFilterChange('courseType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Courses</option>
            <option value="B.Pharmacy">B.Pharmacy</option>
            <option value="D.Pharmacy">D.Pharmacy</option>
            <option value="M.Pharmacy">M.Pharmacy</option>
            <option value="B.Tech">B.Tech</option>
            <option value="MBA">MBA</option>
            <option value="BBA">BBA</option>
            <option value="B.Sc">B.Sc</option>
            <option value="M.Tech">M.Tech</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <select
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Locations</option>
            <option value="Telangana">Telangana</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Delhi">Delhi</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Hyderabad">Hyderabad</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating Filter
          </label>
          <select
            value={filters.ratingFilter}
            onChange={(e) => handleFilterChange('ratingFilter', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Colleges</option>
            <option value="top10">Top 10</option>
            <option value="top20">Top 20</option>
            <option value="top50">Top 50</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSearch}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors text-lg font-medium"
      >
        <Search className="w-5 h-5 inline mr-2" />
        Search Colleges
      </button>
    </div>
  );
};

export default RecommendationForm;
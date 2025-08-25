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
    <div className="recommendation-form">
      <label className="search-label">Search Query</label>
      <div className="search-input-row">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g., Top B.Pharmacy colleges in Telangana with good placements"
          className="search-input"
        />
        {isSupported && (
          <button
            onClick={toggleListening}
            className="search-voice-btn"
            title={isListening ? 'Stop listening' : 'Voice Search'}
            style={isListening ? { background: 'linear-gradient(90deg,#ef4444 60%,#dc2626 100%)' } : {}}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}
        <Search className="search-icon" />
      </div>
      {error && (
        <div className="search-error">{error}</div>
      )}
      <div className="search-filters-row">
        <div className="search-filter">
          <label className="search-filter-label">Course Type</label>
          <select
            value={filters.courseType}
            onChange={(e) => handleFilterChange('courseType', e.target.value)}
            className="search-filter-select"
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
        <div className="search-filter">
          <label className="search-filter-label">Location</label>
          <select
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="search-filter-select"
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
        <div className="search-filter">
          <label className="search-filter-label">Rating Filter</label>
          <select
            value={filters.ratingFilter}
            onChange={(e) => handleFilterChange('ratingFilter', e.target.value)}
            className="search-filter-select"
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
        className="search-btn"
      >
        <Search className="w-5 h-5 inline mr-2" />
        Search Colleges
      </button>
    </div>
  );
};

export default RecommendationForm;
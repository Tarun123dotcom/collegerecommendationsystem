import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Filter, SortAsc } from 'lucide-react';
import CollegeCard from '../components/CollegeCard';
import { College, SearchFilters } from '../types';
import { collegeAPI } from '../services/api';

interface DashboardProps {
  colleges: College[];
  searchQuery: string;
  onBackToSearch: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ colleges, searchQuery, onBackToSearch }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [collegesPerPage] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<string>('default');

  const totalPages = Math.ceil(colleges.length / collegesPerPage);
  const startIndex = (currentPage - 1) * collegesPerPage;
  const endIndex = startIndex + collegesPerPage;
  const currentColleges = colleges.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSort = async (sortType: string) => {
    setSortBy(sortType);
    setLoading(true);
    setError('');

    try {
      // This would need to be implemented based on your backend
      // For now, we'll just sort the existing data
      let sortedColleges = [...colleges];
      
      if (sortType === 'placements') {
        sortedColleges.sort((a, b) => (b['Placement %'] || 0) - (a['Placement %'] || 0));
      } else if (sortType === 'alp') {
        sortedColleges.sort((a, b) => (b.ALP || 0) - (a.ALP || 0));
      } else if (sortType === 'rating') {
        sortedColleges.sort((a, b) => b.Rating - a.Rating);
      }
      
      // Update the colleges array (this would need to be handled by parent component)
      // For now, we'll just show a message
      setError('Sorting functionality will be implemented with backend integration');
    } catch (err: any) {
      setError(err.message || 'Failed to sort results');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (college: College) => {
    // Handle viewing college details
    console.log('Viewing details for:', college.inst_name);
  };

  const generatePagination = () => {
    const pages = [];
    
    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      );
    }

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-4 py-2 rounded-lg ${
            i === currentPage
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-gray-300 hover:bg-gray-50 transition-colors'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Search Results</h2>
          <p className="text-gray-600 mt-1">
            Found {colleges.length} colleges • Page {currentPage} of {totalPages}
          </p>
          <p className="text-sm text-gray-500 mt-1">Query: "{searchQuery}"</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors appearance-none pr-8"
            >
              <option value="default">Sort by</option>
              <option value="rating">Rating</option>
              <option value="placements">Placements</option>
              <option value="alp">ALP Score</option>
            </select>
            <SortAsc className="absolute right-2 top-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          
          <button
            onClick={onBackToSearch}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course Type</label>
              <select
                value={filters.courseType || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, courseType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Courses</option>
                <option value="B.Pharmacy">B.Pharmacy</option>
                <option value="D.Pharmacy">D.Pharmacy</option>
                <option value="M.Pharmacy">M.Pharmacy</option>
                <option value="B.Tech">B.Tech</option>
                <option value="MBA">MBA</option>
                <option value="BBA">BBA</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <select
                value={filters.state || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All States</option>
                <option value="Telangana">Telangana</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Maharashtra">Maharashtra</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
              <select
                value={filters.rating || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, rating: parseFloat(e.target.value) || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Any Rating</option>
                <option value="3.0">3.0+</option>
                <option value="3.5">3.5+</option>
                <option value="4.0">4.0+</option>
                <option value="4.5">4.5+</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your request...</p>
        </div>
      )}

      {/* Results Grid */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {currentColleges.map((college) => (
              <CollegeCard
                key={college['S.No']}
                college={college}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              {generatePagination()}
            </div>
          )}
        </>
      )}

      {/* No Results */}
      {!loading && colleges.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 text-gray-300 mx-auto mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Colleges Found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or filters to find more results.
          </p>
          <button
            onClick={onBackToSearch}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Modify Search
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
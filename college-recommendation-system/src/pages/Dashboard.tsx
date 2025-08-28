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
  const [sortedColleges, setSortedColleges] = useState<College[]>([...colleges]);

  useEffect(() => {
    let sorted = [...colleges];
    if (sortBy === 'placements') {
      sorted.sort((a, b) => (b['Placement %'] || 0) - (a['Placement %'] || 0));
    } else if (sortBy === 'alp') {
      sorted.sort((a, b) => (b.ALP || 0) - (a.ALP || 0));
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => b.Rating - a.Rating);
    }
    setSortedColleges(sorted);
    setCurrentPage(1); // Reset to first page on sort
  }, [colleges, sortBy]);

  const totalPages = Math.ceil(sortedColleges.length / collegesPerPage);
  const startIndex = (currentPage - 1) * collegesPerPage;
  const endIndex = startIndex + collegesPerPage;
  const currentColleges = sortedColleges.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSort = (sortType: string) => {
    setSortBy(sortType);
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
      <div className="results-header-row">
        <div>
          <h2 className="results-title">Search Results</h2>
          <p className="results-info">
            Found {sortedColleges.length} colleges • Page {currentPage} of {totalPages}
          </p>
          <p className="results-query">Query: "{searchQuery}"</p>
        </div>
        <div className="results-actions-row">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="results-filters-btn"
          >
            <Filter style={{width: '1.1rem', height: '1.1rem', marginRight: '0.5rem'}} />
            Filters
          </button>
          <div style={{position: 'relative'}}>
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className="results-sort-select"
            >
              <option value="default">Sort by</option>
              <option value="rating">Rating</option>
              <option value="placements">Placements</option>
              <option value="alp">ALP Score</option>
            </select>
            <SortAsc style={{position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', width: '1.1rem', height: '1.1rem', color: '#64748b', pointerEvents: 'none'}} />
          </div>
          <button
            onClick={onBackToSearch}
            className="results-back-btn"
          >
            <ArrowLeft style={{width: '1.1rem', height: '1.1rem', marginRight: '0.5rem'}} />
            Back to Search
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="college-card" style={{marginBottom: '2rem'}}>
          <h3 className="college-card-title" style={{marginBottom: '1.2rem'}}>Advanced Filters</h3>
          <div className="college-card-info-row">
            <div>
              <label className="college-card-info-label">Course Type</label>
              <select
                value={filters.courseType || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, courseType: e.target.value }))}
                className="search-filter-select"
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
              <label className="college-card-info-label">State</label>
              <select
                value={filters.state || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                className="search-filter-select"
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
              <label className="college-card-info-label">Min Rating</label>
              <select
                value={filters.rating || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, rating: parseFloat(e.target.value) || undefined }))}
                className="search-filter-select"
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
        <div className="college-card" style={{background:'#fee2e2', color:'#b91c1c', border:'1.5px solid #fca5a5', marginBottom:'2rem'}}>
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

      {/* Sorting Dropdown */}
      <div style={{marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'1rem'}}>
        <label htmlFor="sort-select" style={{fontWeight:'bold'}}>Sort by:</label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={e => handleSort(e.target.value)}
          style={{padding:'0.5rem', borderRadius:'0.5rem', border:'1px solid #ddd'}}
        >
          <option value="default">Default</option>
          <option value="placements">Placements</option>
          <option value="alp">Average LPA</option>
        </select>
      </div>

      {/* Results Grid */}
      {!loading && (
        <>
          <div className="results-grid">
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
            <div className="results-pagination-row">
              {generatePagination()}
            </div>
          )}
        </>
      )}

      {/* No Results */}
  {!loading && sortedColleges.length === 0 && (
        <div className="college-card" style={{textAlign:'center', padding:'2.5rem 1.5rem', marginTop:'2rem'}}>
          <div style={{fontSize:'2.5rem', color:'#64748b', marginBottom:'1rem'}}>🔍</div>
          <h3 style={{fontSize:'1.2rem', fontWeight:'700', color:'#1e293b', marginBottom:'0.7rem'}}>No Colleges Found</h3>
          <p style={{color:'#64748b', marginBottom:'1.2rem'}}>
            Try adjusting your search criteria or filters to find more results.
          </p>
          <button
            onClick={onBackToSearch}
            className="results-filters-btn"
          >
            Modify Search
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
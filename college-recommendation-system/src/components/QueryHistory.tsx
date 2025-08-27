import React, { useState, useEffect } from 'react';
import { Clock, Search, RefreshCw } from 'lucide-react';
import { collegeAPI } from '../services/api';
import { SearchQuery } from '../types';

interface QueryHistoryProps {
  onRepeatSearch: (query: string) => void;
}

const QueryHistory: React.FC<QueryHistoryProps> = ({ onRepeatSearch }) => {
  const [queries, setQueries] = useState<SearchQuery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadQueryHistory();
  }, []);

  const loadQueryHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await collegeAPI.getPreviousQueries();
      setQueries(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load query history');
    } finally {
      setLoading(false);
    }
  };

  const handleRepeatSearch = (query: string) => {
    onRepeatSearch(query);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-spin" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Query History</h3>
        <p className="text-gray-600">Please wait while we fetch your previous searches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 text-red-300 mx-auto mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Queries</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadQueryHistory}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Previous Queries</h3>
        <p className="text-gray-600">Start searching for colleges to see your query history here.</p>
      </div>
    );
  }

  return (
    <div className="queries-list">
      {queries.map((query) => (
        <div
          key={query.id}
          className="queries-card"
        >
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3 className="queries-card-title">{query.query_text}</h3>
            <span className="queries-card-results">{query.resultsCount || 0} results</span>
          </div>
          <div className="queries-card-footer">
            <p className="queries-card-time">
              <Clock style={{width: '1.1rem', height: '1.1rem', marginRight: '0.3rem'}} />
              {formatTimestamp(query.timestamp)}
            </p>
            <button
              onClick={() => handleRepeatSearch(query.query_text)}
              className="queries-search-btn"
            >
              <Search style={{width: '1rem', height: '1rem', marginRight: '0.4rem'}} />
              Search Again
            </button>
          </div>
        </div>
      ))}
      <div style={{textAlign: 'center'}}>
        <button
          onClick={loadQueryHistory}
          className="queries-refresh-btn"
        >
          <RefreshCw style={{width: '1rem', height: '1rem', marginRight: '0.4rem'}} />
          Refresh History
        </button>
      </div>
    </div>
  );
};

export default QueryHistory;
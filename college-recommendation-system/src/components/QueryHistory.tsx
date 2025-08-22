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
    <div className="space-y-4">
      {queries.map((query) => (
        <div
          key={query.id}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-medium text-gray-900 flex-1">
              {query.query}
            </h3>
            <span className="text-sm text-gray-500 ml-4">
              {query.resultsCount || 0} results
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              <Clock className="w-4 h-4 inline mr-1" />
              {formatTimestamp(query.timestamp)}
            </p>
            
            <button
              onClick={() => handleRepeatSearch(query.query)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              <Search className="w-4 h-4 inline mr-2" />
              Search Again
            </button>
          </div>
        </div>
      ))}
      
      <div className="text-center pt-4">
        <button
          onClick={loadQueryHistory}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Refresh History
        </button>
      </div>
    </div>
  );
};

export default QueryHistory;
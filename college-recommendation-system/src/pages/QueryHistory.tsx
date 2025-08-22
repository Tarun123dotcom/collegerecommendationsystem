import React from 'react';
import { ArrowLeft } from 'lucide-react';
import QueryHistory from '../components/QueryHistory';

interface QueryHistoryPageProps {
  onRepeatSearch: (query: string) => void;
}

const QueryHistoryPage: React.FC<QueryHistoryPageProps> = ({ onRepeatSearch }) => {
  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Previous Queries</h2>
        <button
          onClick={() => onRepeatSearch('')}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </button>
      </div>

      <QueryHistory onRepeatSearch={onRepeatSearch} />
    </div>
  );
};

export default QueryHistoryPage;

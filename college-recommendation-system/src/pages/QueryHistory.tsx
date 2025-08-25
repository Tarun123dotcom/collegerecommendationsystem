import React from 'react';
import { ArrowLeft } from 'lucide-react';
import QueryHistory from '../components/QueryHistory';

interface QueryHistoryPageProps {
  onRepeatSearch: (query: string) => void;
}

const QueryHistoryPage: React.FC<QueryHistoryPageProps> = ({ onRepeatSearch }) => {
  return (
    <div className="fade-in">
      <div className="queries-header-row">
        <h2 className="queries-title">Previous Queries</h2>
        <button
          onClick={() => onRepeatSearch('')}
          className="queries-back-btn"
        >
          <ArrowLeft style={{marginRight: '0.5rem'}} />
          Back to Search
        </button>
      </div>
      <QueryHistory onRepeatSearch={onRepeatSearch} />
    </div>
  );
};

export default QueryHistoryPage;

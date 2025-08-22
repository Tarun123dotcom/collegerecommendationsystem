import React, { useEffect, useState } from 'react';
import { fetchQueryHistory } from '../services/api';

const QueryHistory: React.FC = () => {
    const [queries, setQueries] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getQueryHistory = async () => {
            try {
                const data = await fetchQueryHistory();
                setQueries(data);
            } catch (err) {
                setError('Failed to fetch query history');
            } finally {
                setLoading(false);
            }
        };

        getQueryHistory();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h2>Your Previous Queries</h2>
            <ul>
                {queries.map((query, index) => (
                    <li key={index}>{query}</li>
                ))}
            </ul>
        </div>
    );
};

export default QueryHistory;
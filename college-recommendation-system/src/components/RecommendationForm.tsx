import React, { useState } from 'react';
import { submitRecommendation } from '../services/api';

const RecommendationForm: React.FC = () => {
    const [criteria, setCriteria] = useState({
        major: '',
        location: '',
        budget: '',
        preferences: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCriteria({ ...criteria, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await submitRecommendation(criteria);
            setSuccess('Recommendation submitted successfully!');
            setCriteria({ major: '', location: '', budget: '', preferences: '' });
        } catch (err) {
            setError('Failed to submit recommendation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>College Recommendation Form</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Major:</label>
                    <input type="text" name="major" value={criteria.major} onChange={handleChange} required />
                </div>
                <div>
                    <label>Location:</label>
                    <input type="text" name="location" value={criteria.location} onChange={handleChange} required />
                </div>
                <div>
                    <label>Budget:</label>
                    <input type="text" name="budget" value={criteria.budget} onChange={handleChange} required />
                </div>
                <div>
                    <label>Preferences:</label>
                    <textarea name="preferences" value={criteria.preferences} onChange={handleChange} required />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Recommendation'}
                </button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {success && <p style={{ color: 'green' }}>{success}</p>}
            </form>
        </div>
    );
};

export default RecommendationForm;
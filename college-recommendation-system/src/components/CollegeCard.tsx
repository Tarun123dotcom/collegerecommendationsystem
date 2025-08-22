import React from 'react';
import { MapPin, Star, StarHalf, Building, Users, Calendar, ExternalLink } from 'lucide-react';
import { College } from '../types';

interface CollegeCardProps {
  college: College;
  onViewDetails?: (college: College) => void;
}

const CollegeCard: React.FC<CollegeCardProps> = ({ college, onViewDetails }) => {
  const generateStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  const formatInfraFaculty = (value: number | string) => {
    if (typeof value === 'number') {
      return value === 1 ? 'Good' : 'Very Good';
    }
    return value;
  };

  const formatPlacement = (placement: number) => {
    if (isNaN(placement) || placement === 0) return 'N/A';
    return `${placement}%`;
  };

  const formatALP = (alp: number) => {
    if (isNaN(alp) || alp === 0) return 'N/A';
    return alp.toFixed(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {college.inst_name}
          </h3>
          <p className="text-gray-600 flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {college.District}, {college.State}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center mb-1">
            <span className="text-2xl font-bold text-indigo-600">
              {college.Rating}
            </span>
            <div className="flex ml-2">
              {generateStars(college.Rating)}
            </div>
          </div>
          <p className="text-sm text-gray-500">Overall Rating</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Course</p>
          <p className="font-medium">{college.Course}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Placement Rate</p>
          <p className="font-medium text-green-600">
            {formatPlacement(college['Placement %'])}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">ALP Score</p>
          <p className="font-medium text-blue-600">
            {formatALP(college.ALP)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Category</p>
          <p className="font-medium">{college.Category}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Infrastructure</p>
          <p className="font-medium text-purple-600">
            {formatInfraFaculty(college.Infra)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Faculty Quality</p>
          <p className="font-medium text-purple-600">
            {formatInfraFaculty(college.Faculty)}
          </p>
        </div>
      </div>

      {college.Fees && (
        <div className="mb-4">
          <p className="text-sm text-gray-500">Fees</p>
          <p className="font-medium">{college.Fees}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {college.Links && (
          <a
            href={college.Links}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Visit College
          </a>
        )}
        {college.Comments && (
          <a
            href={`/comments/${college['S.No']}`}
            className="inline-flex items-center bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full hover:bg-indigo-200 transition-colors"
          >
            <Users className="w-3 h-3 mr-1" />
            View Comments
          </a>
        )}
      </div>

      <button
        onClick={() => onViewDetails?.(college)}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        View Details
      </button>
    </div>
  );
};

export default CollegeCard;

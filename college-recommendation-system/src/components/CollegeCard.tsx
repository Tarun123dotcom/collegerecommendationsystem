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
    <div className="college-card">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.2rem'}}>
        <div style={{flex:1}}>
          <h3 className="college-card-title">{college.inst_name}</h3>
          <p className="college-card-location">
            <MapPin style={{width:'1.1rem', height:'1.1rem', marginRight:'0.3rem'}} />
            {college.District}, {college.State}
          </p>
        </div>
        <div style={{textAlign:'right'}}>
          <div className="college-card-rating-row">
            <span className="college-card-rating">{college.Rating}</span>
            <div className="college-card-stars">{generateStars(college.Rating)}</div>
          </div>
          <p className="college-card-label">Overall Rating</p>
        </div>
      </div>
      <div className="college-card-info-row">
        <div>
          <p className="college-card-info-label">Course</p>
          <p className="college-card-info-value">{college.Course}</p>
        </div>
        <div>
          <p className="college-card-info-label">Placement Rate</p>
          <p className="college-card-info-value green">{formatPlacement(college['Placement %'])}</p>
        </div>
        <div>
          <p className="college-card-info-label">ALP Score</p>
          <p className="college-card-info-value blue">{formatALP(college.ALP)}</p>
        </div>
        <div>
          <p className="college-card-info-label">Category</p>
          <p className="college-card-info-value">{college.Category}</p>
        </div>
      </div>
      <div className="college-card-info-row">
        <div>
          <p className="college-card-info-label">Infrastructure</p>
          <p className="college-card-info-value purple">{formatInfraFaculty(college.Infra)}</p>
        </div>
        <div>
          <p className="college-card-info-label">Faculty Quality</p>
          <p className="college-card-info-value purple">{formatInfraFaculty(college.Faculty)}</p>
        </div>
      </div>
      {college.Fees && (
        <div style={{marginBottom:'1rem'}}>
          <p className="college-card-info-label">Fees</p>
          <p className="college-card-info-value">{college.Fees}</p>
        </div>
      )}
      <div className="college-card-links-row">
        {college.Links && (
          <a
            href={college.Links}
            target="_blank"
            rel="noopener noreferrer"
            className="college-card-link"
          >
            <ExternalLink style={{width:'1rem', height:'1rem', marginRight:'0.3rem'}} />
            Visit College
          </a>
        )}
        {college.Comments && (
          <a
            href={`/comments/${college['S.No']}`}
            className="college-card-link"
          >
            <Users style={{width:'1rem', height:'1rem', marginRight:'0.3rem'}} />
            View Comments
          </a>
        )}
      </div>
      <button
        onClick={() => onViewDetails?.(college)}
        className="college-card-details-btn"
      >
        View Details
      </button>
    </div>
  );
};

export default CollegeCard;

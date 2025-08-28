import React from 'react';
import { MapPin,  Building, Users, Calendar, ExternalLink } from 'lucide-react';
import { College } from '../types';
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";

interface CollegeCardProps {
  college: College;
  onViewDetails?: (college: College) => void;
}

const CollegeCard: React.FC<CollegeCardProps> = ({ college, onViewDetails }) => {
  const generateStars = (rating: number) => {
    // Always show 5 stars, with support for half stars
    const stars = [];
    const rounded = Math.round(rating * 2) / 2; // round to nearest 0.5
    for (let i = 1; i <= 5; i++) {
      if (rounded >= i) {
        stars.push(<StarSolid key={`full-${i}`} className="w-5 h-5 text-yellow-400" />);
      } else if (rounded >= i - 0.5) {
        // visually represent half star by overlaying solid and outline
        stars.push(
          <span key={`half-${i}`} style={{position:'relative', display:'inline-block', width:'1.25rem', height:'1.25rem'}}>
            <StarOutline className="w-5 h-5 text-yellow-400" style={{position:'absolute', left:0, top:0}} />
            <StarSolid className="w-5 h-5 text-yellow-400" style={{position:'absolute', left:0, top:0, width:'50%', overflow:'hidden', clipPath:'inset(0 50% 0 0)'}} />
          </span>
        );
      } else {
        stars.push(<StarOutline key={`empty-${i}`} className="w-5 h-5 text-gray-300" />);
      }
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

import React from 'react';
import '../../styles/EnterpriseDashboard.css';

interface MatchScoreBadgeProps {
  score: number;
}

const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({ score }) => {
  const getScoreConfig = (score: number) => {
    if (score >= 80) {
      return {
        label: 'STRONG MATCH',
        className: 'enterprise-match-badge--high'
      };
    } else if (score >= 60) {
      return {
        label: 'GOOD FIT',
        className: 'enterprise-match-badge--medium'
      };
    } else {
      return {
        label: 'POTENTIAL FIT',
        className: 'enterprise-match-badge--low'
      };
    }
  };

  const config = getScoreConfig(score);

  return (
    <div className={`enterprise-match-badge ${config.className}`}>
      <span className="enterprise-match-badge__score">{score}%</span>
      <span className="enterprise-match-badge__label">{config.label}</span>
    </div>
  );
};

export default MatchScoreBadge;

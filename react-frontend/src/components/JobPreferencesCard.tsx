import React from 'react';
import '../styles/JobPreferences.css';

interface JobPreferenceCardProps {
  preference: any;
  onEdit: (preference: any) => void;
  onDelete: (preferenceId: number) => void;
}

export const JobPreferenceCard: React.FC<JobPreferenceCardProps> = ({
  preference,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="preference-card">
      <div className="preference-header">
        <div className="preference-title">
          <h4>{preference.preference_name}</h4>
          <p className="preference-subtitle">
            {preference.product && <span>{preference.product}</span>}
            {preference.primary_role && <span> • {preference.primary_role}</span>}
          </p>
        </div>
        <div className="preference-actions">
          <button className="btn-edit" onClick={() => onEdit(preference)} title="Edit">
            Edit
          </button>
          <button
            className="btn-delete"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this profile?')) {
                onDelete(preference.id);
              }
            }}
            title="Delete"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="preference-details">
        {preference.years_experience && (
          <div className="detail-item">
            <span className="detail-label">Experience:</span>
            <span className="detail-value">{preference.years_experience} years</span>
          </div>
        )}
        {(preference.rate_min || preference.rate_max) && (
          <div className="detail-item">
            <span className="detail-label">Rate:</span>
            <span className="detail-value">
              ${preference.rate_min || '0'}
              {preference.rate_max && `–$${preference.rate_max}`}/hr
            </span>
          </div>
        )}
        {preference.work_type && (
          <div className="detail-item">
            <span className="detail-label">Work Type:</span>
            <span className="detail-value">{preference.work_type}</span>
          </div>
        )}
        {preference.location && (
          <div className="detail-item">
            <span className="detail-label">Location:</span>
            <span className="detail-value">{preference.location}</span>
          </div>
        )}
        {preference.availability && (
          <div className="detail-item">
            <span className="detail-label">Availability:</span>
            <span className="detail-value">{preference.availability}</span>
          </div>
        )}
      </div>

      {preference.required_skills && (
        <div className="preference-skills">
          <span className="detail-label">Required Skills:</span>
          <div className="skills-list">
            {typeof preference.required_skills === 'string' 
              ? JSON.parse(preference.required_skills).map((skill: any, idx: number) => (
                  <span key={idx} className="skill-badge">{skill.name || skill}</span>
                ))
              : (Array.isArray(preference.required_skills) 
                ? preference.required_skills.map((skill: any, idx: number) => (
                    <span key={idx} className="skill-badge">{skill.name || skill}</span>
                  ))
                : null)
            }
          </div>
        </div>
      )}

      {preference.summary && (
        <div className="preference-summary">
          <p>{preference.summary}</p>
        </div>
      )}
    </div>
  );
};

interface JobPreferencesListProps {
  preferences: any[];
  onEdit: (preference: any) => void;
  onDelete: (preferenceId: number) => void;
  onAddNew: () => void;
}

export const JobPreferencesList: React.FC<JobPreferencesListProps> = ({
  preferences,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  return (
    <div className="preferences-container">
      <div className="preferences-header">
        <h3>Your Job Role Profiles</h3>
        <p className="preferences-subtitle">
          Create and manage different role profiles for various opportunities
        </p>
      </div>

      {preferences && preferences.length > 0 ? (
        <div className="preferences-grid">
          {preferences.map((pref) => (
            <JobPreferenceCard
              key={pref.id}
              preference={pref}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="no-preferences">
          <p>No role profiles created yet</p>
          <p className="subtitle">Create your first profile to get started</p>
        </div>
      )}

      <button className="btn btn-primary btn-add-profile" onClick={onAddNew}>
        + Add Another Role Profile
      </button>
    </div>
  );
};

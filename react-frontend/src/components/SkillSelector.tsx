import React, { useState } from 'react';
import '../styles/SkillSelector.css';

interface Skill {
  name: string;
  rating: number; // 1-5
}

interface SkillSelectorProps {
  selectedSkills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
  availableSkills?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  category?: string;
}

export const SkillSelector: React.FC<SkillSelectorProps> = ({
  selectedSkills,
  onSkillsChange,
  availableSkills = [],
  technicalSkills = [],
  softSkills = [],
  category = 'Technical'
}) => {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [currentRating, setCurrentRating] = useState(3);

  // Combine available skills from both sources
  const allAvailableSkills = [...availableSkills, ...technicalSkills, ...softSkills];
  
  // Determine category label
  const displayCategory = technicalSkills.length > 0 && softSkills.length > 0 
    ? 'Skill' 
    : category;

  const handleAddSkill = () => {
    if (!selectedSkill) {
      alert('Please select a skill');
      return;
    }

    // Check if skill already exists
    if (selectedSkills.find(s => s.name === selectedSkill)) {
      alert('Skill already added');
      return;
    }

    const newSkills = [...selectedSkills, { name: selectedSkill, rating: currentRating }];
    onSkillsChange(newSkills);
    setSelectedSkill('');
    setCurrentRating(3);
  };

  const handleRemoveSkill = (skillName: string) => {
    const newSkills = selectedSkills.filter(s => s.name !== skillName);
    onSkillsChange(newSkills);
  };

  const handleUpdateRating = (skillName: string, newRating: number) => {
    const newSkills = selectedSkills.map(s =>
      s.name === skillName ? { ...s, rating: newRating } : s
    );
    onSkillsChange(newSkills);
  };

  const renderStars = (rating: number, skillName: string, isPreview: boolean = false) => {
    return (
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={() => !isPreview && handleUpdateRating(skillName, star)}
            disabled={isPreview}
            style={{ cursor: isPreview ? 'default' : 'pointer' }}
            title={`${star} star${star > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="skill-selector-container">
      <div className="skill-add-section">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
              {displayCategory}
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">Select a skill...</option>
              {allAvailableSkills
                .filter(skill => !selectedSkills.find(s => s.name === skill))
                .map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
            </select>
          </div>

          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
              Rating
            </label>
            <div className="rating-stars-preview">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  className={`star ${star <= currentRating ? 'filled' : ''}`}
                  onClick={() => setCurrentRating(star)}
                  title={`${star} star${star > 1 ? 's' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAddSkill}
            className="btn btn-add-skill"
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            Add Skill
          </button>
        </div>
      </div>

      {selectedSkills.length > 0 && (
        <div className="selected-skills-list">
          <h4 style={{ marginTop: '24px', marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
            Selected Skills ({selectedSkills.length})
          </h4>
          <div className="skills-grid">
            {selectedSkills.map(skill => (
              <div key={skill.name} className="skill-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{skill.name}</span>
                  <button
                    onClick={() => handleRemoveSkill(skill.name)}
                    className="btn-remove-skill"
                    style={{
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    Remove
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>Proficiency:</span>
                  {renderStars(skill.rating, skill.name)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

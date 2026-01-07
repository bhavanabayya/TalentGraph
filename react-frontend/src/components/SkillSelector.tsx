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
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #ddd',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#333',
                  borderRight: '1px solid #ddd'
                }}>
                  Skill Name
                </th>
                <th style={{
                  padding: '12px',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#333',
                  borderRight: '1px solid #ddd',
                  width: '200px'
                }}>
                  Proficiency Rating (1-5)
                </th>
                <th style={{
                  padding: '12px',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#333',
                  width: '100px'
                }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedSkills.map((skill, idx) => (
                <tr key={skill.name} style={{
                  borderBottom: idx < selectedSkills.length - 1 ? '1px solid #eee' : 'none',
                  backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff'
                }}>
                  <td style={{
                    padding: '12px',
                    fontSize: '14px',
                    color: '#333',
                    fontWeight: 500,
                    borderRight: '1px solid #ddd'
                  }}>
                    {skill.name}
                  </td>
                  <td style={{
                    padding: '12px',
                    textAlign: 'center',
                    borderRight: '1px solid #ddd'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                      {renderStars(skill.rating, skill.name, false)}
                    </div>
                    <span style={{ fontSize: '11px', color: '#999', marginTop: '4px', display: 'block' }}>
                      {skill.rating}/5
                    </span>
                  </td>
                  <td style={{
                    padding: '12px',
                    textAlign: 'center'
                  }}>
                    <button
                      onClick={() => handleRemoveSkill(skill.name)}
                      style={{
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d32f2f')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f44336')}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

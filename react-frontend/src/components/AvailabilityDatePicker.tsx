import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/AvailabilityDatePicker.css';

interface AvailabilityDatePickerProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Availability Date Picker Component
 * Allows users to select a date when they become available
 * Converts selected date to ISO format string (YYYY-MM-DD)
 */
const AvailabilityDatePicker: React.FC<AvailabilityDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select availability date',
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [showDropdown, setShowDropdown] = useState(false);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      // Convert to ISO format (YYYY-MM-DD)
      const isoString = date.toISOString().split('T')[0];
      onChange(isoString);
      setShowDropdown(false);
    }
  };

  const handleClear = () => {
    setSelectedDate(null);
    onChange('');
  };

  const formatDisplayDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="availability-picker-wrapper">
      <div className="availability-picker-input-group">
        <input
          type="text"
          value={selectedDate ? formatDisplayDate(selectedDate) : ''}
          placeholder={placeholder}
          readOnly
          onClick={() => setShowDropdown(!showDropdown)}
          className="availability-picker-display"
        />
        {selectedDate && (
          <button
            type="button"
            onClick={handleClear}
            className="availability-picker-clear"
            aria-label="Clear date"
          >
            ✕
          </button>
        )}
        <span className="availability-picker-icon">📅</span>
      </div>

      {showDropdown && (
        <div className="availability-picker-dropdown">
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            inline
            minDate={new Date()}
            monthsShown={2}
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
          />
          <div className="availability-picker-quick-select">
            <p className="quick-select-label">Quick Options:</p>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                handleDateChange(today);
              }}
              className="quick-option-btn"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                handleDateChange(tomorrow);
              }}
              className="quick-option-btn"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => {
                const twoWeeks = new Date();
                twoWeeks.setDate(twoWeeks.getDate() + 14);
                handleDateChange(twoWeeks);
              }}
              className="quick-option-btn"
            >
              2 Weeks
            </button>
            <button
              type="button"
              onClick={() => {
                const oneMonth = new Date();
                oneMonth.setDate(oneMonth.getDate() + 30);
                handleDateChange(oneMonth);
              }}
              className="quick-option-btn"
            >
              1 Month
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityDatePicker;

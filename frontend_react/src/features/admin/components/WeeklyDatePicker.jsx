import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import './WeeklyDatePicker.css';

const WeeklyDatePicker = ({ selectedDate, onDateChange }) => {
  // Get start of week (Monday)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Get all days in the week
  const getWeekDays = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const startOfWeek = getStartOfWeek(selectedDate);
  const weekDays = getWeekDays(startOfWeek);

  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatDayName = (date) => {
    return date.toLocaleDateString('vi-VN', { weekday: 'short' });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    onDateChange(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    onDateChange(newDate);
  };

  const goToCurrentWeek = () => {
    onDateChange(new Date());
  };

  return (
    <div className="weekly-date-picker">
      <div className="week-navigation">
        <button 
          className="nav-button" 
          onClick={goToPreviousWeek}
          title="Tuần trước"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="week-info">
          <h3 className="week-title">
            Tuần {startOfWeek.getDate()}/{startOfWeek.getMonth() + 1} - {weekDays[6].getDate()}/{weekDays[6].getMonth() + 1}/{weekDays[6].getFullYear()}
          </h3>
          <button 
            className="today-button" 
            onClick={goToCurrentWeek}
            title="Về tuần hiện tại"
          >
            <Calendar size={16} />
            Hôm nay
          </button>
        </div>
        
        <button 
          className="nav-button" 
          onClick={goToNextWeek}
          title="Tuần sau"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="week-days">
        {weekDays.map((day, index) => (
          <button
            key={index}
            className={`day-button-weekly-date-picker ${isSelected(day) ? 'selected' : ''} ${isToday(day) ? 'today' : ''}`}
            onClick={() => onDateChange(day)}
          >
            <div className="day-name-weekly-date-picker">{formatDayName(day)}</div>
            <div className="day-number-weekly-date-picker">{formatDate(day)}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WeeklyDatePicker;

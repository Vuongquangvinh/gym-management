import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import styles from './WeeklyDatePicker.module.css';

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
    <div className={styles.weeklyDatePicker}>
      <div className={styles.weekNavigation}>
        <button
          className={styles.navButton}
          onClick={goToPreviousWeek}
          title="Tuần trước"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className={styles.weekInfo}>
          <h3 className={styles.weekTitle}>
            Tuần {startOfWeek.getDate()}/{startOfWeek.getMonth() + 1} - {weekDays[6].getDate()}/{weekDays[6].getMonth() + 1}/{weekDays[6].getFullYear()}
          </h3>
          <button
            className={styles.todayButton}
            onClick={goToCurrentWeek}
            title="Về tuần hiện tại"
          >
            <Calendar size={16} />
            Hôm nay
          </button>
        </div>
        
        <button 
          className={styles.navButton} 
          onClick={goToNextWeek}
          title="Tuần sau"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className={styles.weekDays}>
        {weekDays.map((day, index) => (
          <button
            key={index}
            className={`${styles.dayButton} ${isSelected(day) ? styles.selected : ''} ${isToday(day) ? styles.today : ''}`}
            onClick={() => onDateChange(day)}
          >
            <div className={styles.dayName}>{formatDayName(day)}</div>
            <div className={styles.dayNumber}>{formatDate(day)}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WeeklyDatePicker;

import React, { useState, useEffect } from 'react';
import { EmployeeProvider, useEmployees } from '../../../firebase/lib/features/employee/employee.provider.jsx';
import { ScheduleProvider, useSchedule } from '../../../firebase/lib/features/schedule/schedule.provider.jsx';
import WeeklyDatePicker from '../components/WeeklyDatePicker';
import WeeklyScheduleTable from '../components/WeeklyScheduleTable';
import ScheduleModal from '../components/ScheduleModal';
import { toast } from 'react-toastify';
import styles from './SchedulePage.module.css';

const SchedulePageContent = () => {
  const { employees, loading: employeesLoading } = useEmployees();
  const { 
    schedules, 
    checkins, 
    loading: scheduleLoading, 
    error, 
    selectedDate, 
    viewMode,
    stats,
    addSchedule,
    changeDate,
    setViewMode,
    getCheckinInfo,
    getWorkingEmployees,
    getCurrentWeekDays,
    getDateString
  } = useSchedule();

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(null);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);

  // Get week days for current view
  const weekDays = getCurrentWeekDays();

  // Handle schedule click
  const handleScheduleClick = (employee, date) => {
    setSelectedEmployee(employee);
    setSelectedScheduleDate(date);
    setShowScheduleModal(true);
  };

  // Handle add schedule button click
  const handleAddSchedule = () => {
    setShowAddScheduleModal(true);
  };


  const loading = employeesLoading || scheduleLoading;

  // Calculate employee stats (only active employees)
  const activeEmployees = employees.filter(emp => emp.status === 'active');
  const fulltimeEmployees = activeEmployees.filter(emp => emp.shift === 'fulltime');
  const parttimeEmployees = activeEmployees.filter(emp => emp.shift === 'parttime');

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className={styles.schedulePage}>
      <div className={styles.scheduleHeader}>
        <h1>📅 Quản lý lịch làm việc</h1>
        <div className={styles.viewModeToggle}>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'day' ? styles.active : ''}`}
            onClick={() => setViewMode('day')}
          >
            📅 Ngày
          </button>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'week' ? styles.active : ''}`}
            onClick={() => setViewMode('week')}
          >
            📆 Tuần
          </button>
        </div>
      </div>

      {/* Weekly Date Picker */}
      <WeeklyDatePicker 
        selectedDate={selectedDate}
        onDateChange={changeDate}
      />

      <div className={styles.scheduleContent}>
        <div className={styles.scheduleStats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statInfo}>
              <h3>{activeEmployees.length}</h3>
              <p>Nhân viên đang làm việc</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏰</div>
            <div className={styles.statInfo}>
              <h3>{fulltimeEmployees.length}</h3>
              <p>Fulltime</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🕐</div>
            <div className={styles.statInfo}>
              <h3>{parttimeEmployees.length}</h3>
              <p>Partime</p>
            </div>
          </div>
        </div>

        {/* Weekly Schedule Table */}
        <WeeklyScheduleTable 
          weekDays={getCurrentWeekDays()}
          employees={employees}
          schedules={schedules}
          checkins={checkins}
          onScheduleClick={handleScheduleClick}
          onAddSchedule={handleAddSchedule}
          getCheckinInfo={getCheckinInfo}
        />
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedEmployee(null);
            setSelectedScheduleDate(null);
          }}
          employee={selectedEmployee}
          employees={employees}
          selectedDate={selectedScheduleDate || selectedDate}
          schedules={schedules}
        />
      )}

      {/* Add Schedule Modal */}
      {showAddScheduleModal && (
        <ScheduleModal
          isOpen={showAddScheduleModal}
          onClose={() => {
            setShowAddScheduleModal(false);
            setSelectedEmployee(null);
          }}
          employee={null}
          employees={employees}
          selectedDate={selectedDate}
          schedules={schedules}
        />
      )}
    </div>
  );
};


export default function SchedulePage() {
  return (
    <EmployeeProvider>
      <ScheduleProvider>
        <SchedulePageContent />
      </ScheduleProvider>
    </EmployeeProvider>
  );
}


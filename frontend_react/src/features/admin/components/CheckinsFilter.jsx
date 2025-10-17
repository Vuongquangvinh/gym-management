import React, { memo } from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';

const CheckinsFilter = memo(function CheckinsFilter({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  onlyQR,
  onQRFilterChange,
  selectedDate,
  onDateChange,
  totalToday
}) {
  return (
    <div className="checkins-controls">
      <div className="controls-left">
        <input 
          className="input-search" 
          placeholder="Tìm kiếm theo tên hoặc gói" 
          value={searchQuery} 
          onChange={(e) => onSearchChange(e.target.value)} 
        />
        
        <select 
          className="select-range" 
          value={dateRange} 
          onChange={(e) => onDateRangeChange(e.target.value)}
        >
          <option value="today">Hôm nay</option>
          <option value="7d">7 ngày</option>
          <option value="all">Tất cả</option>
        </select>
        
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={onlyQR} 
            onChange={(e) => onQRFilterChange(e.target.checked)} 
          /> 
          Chỉ QR
        </label>
        
        <DatePicker
          selected={selectedDate}
          onChange={onDateChange}
          className="input-date"
          placeholderText="Chọn ngày"
        />
      </div>

      <div className="controls-right">
        <div className="muted">Check-ins hôm nay</div>
        <div className="today-count">{totalToday}</div>
      </div>
    </div>
  );
});

CheckinsFilter.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  dateRange: PropTypes.string.isRequired,
  onDateRangeChange: PropTypes.func.isRequired,
  onlyQR: PropTypes.bool.isRequired,
  onQRFilterChange: PropTypes.func.isRequired,
  selectedDate: PropTypes.instanceOf(Date),
  onDateChange: PropTypes.func.isRequired,
  totalToday: PropTypes.number.isRequired
};

export default CheckinsFilter;
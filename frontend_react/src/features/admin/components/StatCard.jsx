import React from 'react';
import './StatCard.css';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  subtitle, 
  trend,
  loading = false 
}) => {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-header">
        <div className="stat-card-icon">
          {icon}
        </div>
        <div className="stat-card-title">
          {title}
        </div>
      </div>
      
      <div className="stat-card-content">
        <div className="stat-card-value">
          {loading ? (
            <div className="stat-loading">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            value?.toLocaleString() || '0'
          )}
        </div>
        
        {subtitle && (
          <div className="stat-card-subtitle">
            {subtitle}
          </div>
        )}
        
        {trend && (
          <div className={`stat-card-trend ${trend.direction}`}>
            <span className="trend-icon">
              {trend.direction === 'up' ? '📈' : trend.direction === 'down' ? '📉' : '➡️'}
            </span>
            <span className="trend-text">
              {trend.text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
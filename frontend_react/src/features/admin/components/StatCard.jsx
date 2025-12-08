import React from 'react';
import styles from './StatCard.module.css';

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
    <div className={`${styles.statCard} ${styles[`statCard${color.charAt(0).toUpperCase() + color.slice(1)}`]}`}>
      <div className={styles.statCardHeader}>
        <div className={styles.statCardIcon}>
          {icon}
        </div>
        <div className={styles.statCardTitle}>
          {title}
        </div>
      </div>
      
      <div className={styles.statCardContent}>
        <div className={styles.statCardValue}>
          {loading ? (
            <div className={styles.statLoading}>
              <div className={styles.loadingSpinner}></div>
            </div>
          ) : (
            value?.toLocaleString() || '0'
          )}
        </div>
        
        {subtitle && (
          <div className={styles.statCardSubtitle}>
            {subtitle}
          </div>
        )}
        
        {trend && (
          <div className={`${styles.statCardTrend} ${styles[trend.direction]}`}>
            <span className={styles.trendIcon}>
              {trend.direction === 'up' ? '📈' : trend.direction === 'down' ? '📉' : '➡️'}
            </span>
            <span className={styles.trendText}>
              {trend.text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

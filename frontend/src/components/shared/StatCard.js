// src/components/shared/StatCard.js
import React from 'react';

/**
 * StatCard Component
 * Reusable statistics card for dashboards
 */
const StatCard = ({ 
  icon = '📊', 
  title, 
  value, 
  subtitle = null,
  trend = null, // { direction: 'up' | 'down', value: '12%' }
  color = 'var(--primary-black)',
  onClick = null
}) => {
  return (
    <div 
      className="card" 
      style={{
        textAlign: 'center',
        padding: '24px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
      <div className="label" style={{ marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase' }}>
        {title}
      </div>
      <div style={{ 
        fontSize: '32px', 
        fontWeight: 'bold', 
        color: color,
        marginBottom: '8px'
      }}>
        {value}
      </div>
      {subtitle && (
        <div className="label" style={{ fontSize: '12px' }}>
          {subtitle}
        </div>
      )}
      {trend && (
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: trend.direction === 'up' ? '#10b981' : '#ef4444',
          fontWeight: 600
        }}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
        </div>
      )}
    </div>
  );
};

export default StatCard;

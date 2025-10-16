// src/components/shared/EmptyState.js
import React from 'react';

/**
 * EmptyState Component
 * Display when no data is available
 */
const EmptyState = ({ 
  icon = '📭', 
  title = 'No Data', 
  message = 'No items to display',
  actionLabel = null,
  onAction = null
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center',
      background: '#f8f9fa',
      borderRadius: '12px',
      border: '2px dashed #dee2e6'
    }}>
      <div style={{
        fontSize: '64px',
        marginBottom: '16px',
        opacity: 0.7
      }}>
        {icon}
      </div>
      <h3 style={{ 
        margin: 0, 
        marginBottom: '8px',
        color: '#1a2332',
        fontSize: '20px'
      }}>
        {title}
      </h3>
      <p style={{ 
        color: '#64748b', 
        fontSize: '15px',
        marginBottom: actionLabel ? '20px' : 0,
        maxWidth: '400px'
      }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <button className="btn primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

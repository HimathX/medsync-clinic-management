// src/components/shared/ErrorMessage.js
import React from 'react';

/**
 * ErrorMessage Component
 * Reusable error display with retry functionality
 */
const ErrorMessage = ({ 
  title = 'Error', 
  message = 'Something went wrong', 
  onRetry = null,
  type = 'error' // 'error', 'warning', 'info'
}) => {
  const styles = {
    error: {
      background: '#fee',
      border: '1px solid #fcc',
      color: '#c33',
      icon: '⚠️'
    },
    warning: {
      background: '#fff3cd',
      border: '1px solid #ffc107',
      color: '#856404',
      icon: '⚡'
    },
    info: {
      background: '#e7f3ff',
      border: '1px solid #2196F3',
      color: '#0c5460',
      icon: 'ℹ️'
    }
  };

  const currentStyle = styles[type] || styles.error;

  return (
    <div style={{
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '20px'
      }}>
        {currentStyle.icon}
      </div>
      <h2 style={{ color: currentStyle.color, marginBottom: '8px' }}>{title}</h2>
      <p style={{ color: '#64748b', marginBottom: '20px' }}>{message}</p>
      {onRetry && (
        <button className="btn primary" onClick={onRetry}>
          🔄 Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;

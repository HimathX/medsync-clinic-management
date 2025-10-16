// src/components/shared/LoadingSpinner.js
import React from 'react';

/**
 * LoadingSpinner Component
 * Reusable loading indicator
 */
const LoadingSpinner = ({ message = 'Loading...', size = 'large' }) => {
  const sizeMap = {
    small: '24px',
    medium: '36px',
    large: '48px'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: sizeMap[size],
        marginBottom: '20px',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}>
        ⏳
      </div>
      <h3 style={{ margin: 0, marginBottom: '8px' }}>{message}</h3>
      <p style={{ color: '#64748b', fontSize: '14px' }}>Please wait...</p>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;

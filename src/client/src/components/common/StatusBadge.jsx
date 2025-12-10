import React from 'react';
import PropTypes from 'prop-types';
import { STATUS_CONFIG } from '../../utils/constants';

function StatusBadge({ status, size = 'md' }) {
  const { bg, text, label } = STATUS_CONFIG[status] || STATUS_CONFIG.offline;

  const sizeStyles = size === 'sm'
    ? { padding: '2px 8px', fontSize: '0.7rem' }
    : { padding: '4px 12px', fontSize: '0.75rem' };

  return (
    <span style={{
      background: bg,
      color: text,
      borderRadius: '9999px',
      fontWeight: 500,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      ...sizeStyles
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: text,
        opacity: 0.8
      }} />
      {label}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['normal', 'warning', 'critical', 'offline', 'pending', 'acknowledged', 'resolved']),
  size: PropTypes.oneOf(['sm', 'md'])
};

export default StatusBadge;

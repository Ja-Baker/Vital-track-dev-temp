import React from 'react';
import PropTypes from 'prop-types';

function StatCard({ icon, label, value, color, subValue, onClick }) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s'
      }}
      onClick={onClick}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: `${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem'
      }}>
        {icon}
      </div>
      <div>
        <div className="text-sm text-gray">{label}</div>
        <div className="text-2xl font-bold" style={{ color }}>{value}</div>
        {subValue && <div className="text-xs text-gray">{subValue}</div>}
      </div>
    </div>
  );
}

StatCard.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string.isRequired,
  subValue: PropTypes.string,
  onClick: PropTypes.func
};

export default StatCard;

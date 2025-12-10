import React from 'react';
import PropTypes from 'prop-types';
import StatusBadge from './StatusBadge';
import { STATUS_COLORS, TREND_ICONS } from '../../utils/constants';

function VitalCard({ icon, label, value, unit, status, range, trend }) {
  const borderColor = STATUS_COLORS[status] || 'var(--border)';

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'var(--critical)';
      case 'down': return 'var(--warning)';
      default: return 'var(--success)';
    }
  };

  return (
    <div className="card" style={{ borderLeft: `4px solid ${borderColor}` }}>
      <div className="flex-between mb-2">
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
        <StatusBadge status={status} size="sm" />
      </div>
      <div className="text-sm text-gray mb-1">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>
          {value || '--'}
        </span>
        <span className="text-sm text-gray">{unit}</span>
        {trend && (
          <span style={{ color: getTrendColor() }}>
            {TREND_ICONS[trend]}
          </span>
        )}
      </div>
      {range && <div className="text-xs text-gray mt-1">Range: {range}</div>}
    </div>
  );
}

VitalCard.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  unit: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['normal', 'warning', 'critical']),
  range: PropTypes.string,
  trend: PropTypes.oneOf(['up', 'down', 'stable'])
};

export default VitalCard;

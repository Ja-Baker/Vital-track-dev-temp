import React, { memo } from 'react';
import PropTypes from 'prop-types';
import StatusBadge from '../common/StatusBadge';
import { ALERT_TYPE_CONFIG } from '../../utils/constants';
import { timeSince } from '../../utils/helpers';

function AlertItem({ alert, onAcknowledge, onResolve }) {
  const typeConfig = ALERT_TYPE_CONFIG[alert.type] || ALERT_TYPE_CONFIG.info;

  return (
    <div
      className="card"
      style={{
        borderLeft: `4px solid ${typeConfig.color}`,
        marginBottom: '1rem',
        background: alert.status === 'pending' ? `${typeConfig.color}08` : 'white'
      }}
    >
      <div className="flex-between">
        <div className="flex gap-3" style={{ alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.5rem' }}>{typeConfig.icon}</span>
          <div>
            <div className="flex gap-2" style={{ alignItems: 'center' }}>
              <span className="font-semibold">{alert.title}</span>
              <StatusBadge status={alert.status} size="sm" />
            </div>
            <div className="text-sm text-gray">
              {alert.residentName} - Room {alert.roomNumber}
            </div>
            <div className="text-xs text-gray mt-1">{timeSince(alert.createdAt)}</div>
          </div>
        </div>
        <div className="flex gap-2">
          {alert.status === 'pending' && onAcknowledge && (
            <button
              className="btn btn-primary"
              style={{ padding: '0.5rem 1rem' }}
              onClick={() => onAcknowledge(alert.id)}
            >
              Acknowledge
            </button>
          )}
          {alert.status === 'acknowledged' && onResolve && (
            <button
              className="btn btn-success"
              style={{ padding: '0.5rem 1rem' }}
              onClick={() => onResolve(alert.id)}
            >
              Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

AlertItem.propTypes = {
  alert: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.oneOf(['critical', 'warning', 'info']).isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['pending', 'acknowledged', 'resolved', 'false_alarm']).isRequired,
    residentName: PropTypes.string.isRequired,
    roomNumber: PropTypes.string,
    createdAt: PropTypes.string.isRequired
  }).isRequired,
  onAcknowledge: PropTypes.func,
  onResolve: PropTypes.func
};

export default memo(AlertItem);

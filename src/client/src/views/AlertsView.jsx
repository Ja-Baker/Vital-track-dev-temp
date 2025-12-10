import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { AlertItem } from '../components/alerts';
import { ALERT_FILTERS } from '../utils/constants';

function AlertsView({ alerts, onAcknowledge, onResolve }) {
  const [filter, setFilter] = useState('pending');

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a =>
      a.status === filter || (filter === 'resolved' && a.status === 'false_alarm')
    );
  }, [alerts, filter]);

  const pendingCount = alerts.filter(a => a.status === 'pending').length;

  return (
    <>
      <div className="flex-between mb-4">
        <h2>Alerts</h2>
      </div>

      <div className="flex gap-2 mb-4">
        {ALERT_FILTERS.map(f => (
          <button
            key={f.value}
            className={`btn ${filter === f.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            {f.value === 'pending' && pendingCount > 0 && (
              <span style={{
                marginLeft: '8px',
                background: 'var(--critical)',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '0.75rem'
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredAlerts.length > 0 ? (
        filteredAlerts.map(alert => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onAcknowledge={onAcknowledge}
            onResolve={onResolve}
          />
        ))
      ) : (
        <div className="empty-state card">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h3>No {filter === 'pending' ? 'Active' : filter} Alerts</h3>
          <p className="text-gray">
            {filter === 'pending'
              ? 'All residents are doing well.'
              : 'No alerts in this category.'}
          </p>
        </div>
      )}
    </>
  );
}

AlertsView.propTypes = {
  alerts: PropTypes.array.isRequired,
  onAcknowledge: PropTypes.func.isRequired,
  onResolve: PropTypes.func.isRequired
};

export default AlertsView;

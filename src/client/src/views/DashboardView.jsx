import React from 'react';
import PropTypes from 'prop-types';
import { StatCard } from '../components/common';
import { ResidentCard } from '../components/residents';
import { AlertItem } from '../components/alerts';

function DashboardView({ residents, alerts, onResidentClick, onAcknowledge, onResolve }) {
  const pendingAlerts = alerts.filter(a => a.status === 'pending');
  const criticalCount = residents.filter(r => r.currentStatus === 'critical').length;
  const warningCount = residents.filter(r => r.currentStatus === 'warning').length;
  const normalCount = residents.filter(r => r.currentStatus === 'normal').length;

  return (
    <>
      <div className="grid grid-4 mb-4">
        <StatCard icon="👥" label="Total Residents" value={residents.length} color="var(--primary)" />
        <StatCard icon="🟢" label="Normal" value={normalCount} color="var(--success)" />
        <StatCard icon="🟡" label="Warning" value={warningCount} color="var(--warning)" />
        <StatCard icon="🔴" label="Critical" value={criticalCount} color="var(--critical)" />
      </div>

      {pendingAlerts.length > 0 && (
        <div className="card mb-4" style={{ borderLeft: '4px solid var(--critical)', background: '#FEF2F2' }}>
          <div className="flex-between">
            <div>
              <div className="font-semibold" style={{ color: 'var(--critical)' }}>
                🚨 {pendingAlerts.length} Active Alert{pendingAlerts.length > 1 ? 's' : ''} Requiring Attention
              </div>
              <div className="text-sm text-gray">Click to view and acknowledge</div>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {pendingAlerts.slice(0, 3).map(alert => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onAcknowledge={onAcknowledge}
                onResolve={onResolve}
              />
            ))}
          </div>
        </div>
      )}

      <h3 className="mb-3">Resident Overview</h3>
      <div className="grid grid-3">
        {residents.slice(0, 6).map(resident => (
          <ResidentCard
            key={resident.id}
            resident={resident}
            onClick={() => onResidentClick(resident)}
          />
        ))}
      </div>
    </>
  );
}

DashboardView.propTypes = {
  residents: PropTypes.array.isRequired,
  alerts: PropTypes.array.isRequired,
  onResidentClick: PropTypes.func.isRequired,
  onAcknowledge: PropTypes.func.isRequired,
  onResolve: PropTypes.func.isRequired
};

export default DashboardView;

import React from 'react';
import PropTypes from 'prop-types';

function AnalyticsView({ residents, alerts }) {
  const criticalCount = residents.filter(r => r.currentStatus === 'critical').length;
  const warningCount = residents.filter(r => r.currentStatus === 'warning').length;
  const normalCount = residents.filter(r => r.currentStatus === 'normal').length;

  const pendingAlerts = alerts.filter(a => a.status === 'pending').length;
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length;

  const statusCircleStyle = (color) => ({
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: color,
    margin: '0 auto 0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: 'bold'
  });

  return (
    <>
      <h2 className="mb-4">Analytics</h2>

      <div className="grid grid-2 gap-4 mb-4">
        <div className="card">
          <h4 className="mb-3">Resident Status Distribution</h4>
          <div className="flex gap-4">
            <div className="text-center" style={{ flex: 1 }}>
              <div style={statusCircleStyle('var(--success)')}>{normalCount}</div>
              <div className="text-sm text-gray">Normal</div>
            </div>
            <div className="text-center" style={{ flex: 1 }}>
              <div style={statusCircleStyle('var(--warning)')}>{warningCount}</div>
              <div className="text-sm text-gray">Warning</div>
            </div>
            <div className="text-center" style={{ flex: 1 }}>
              <div style={statusCircleStyle('var(--critical)')}>{criticalCount}</div>
              <div className="text-sm text-gray">Critical</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h4 className="mb-3">Alert Statistics (Today)</h4>
          <div className="grid grid-2 gap-4">
            <div>
              <div className="text-sm text-gray">Total Alerts</div>
              <div className="text-2xl font-bold">{alerts.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray">Pending</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--critical)' }}>
                {pendingAlerts}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray">Resolved</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
                {resolvedAlerts}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray">Avg Response</div>
              <div className="text-2xl font-bold">--</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h4 className="mb-3">Coming Soon</h4>
        <p className="text-gray">
          Advanced analytics including trend analysis, predictive risk indicators,
          and exportable reports will be available in a future update.
        </p>
      </div>
    </>
  );
}

AnalyticsView.propTypes = {
  residents: PropTypes.array.isRequired,
  alerts: PropTypes.array.isRequired
};

export default AnalyticsView;

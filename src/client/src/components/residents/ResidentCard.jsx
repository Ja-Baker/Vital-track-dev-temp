import React, { memo } from 'react';
import PropTypes from 'prop-types';
import StatusBadge from '../common/StatusBadge';
import { STATUS_COLORS } from '../../utils/constants';
import { getInitials, formatBloodPressure } from '../../utils/helpers';

function ResidentCard({ resident, onClick, isSelected }) {
  const statusColor = STATUS_COLORS[resident.currentStatus] || 'var(--gray)';

  const handleMouseEnter = (e) => {
    if (!isSelected) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    }
  };

  const handleMouseLeave = (e) => {
    if (!isSelected) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '';
    }
  };

  return (
    <div
      className="card"
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)'
      }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex-between mb-3">
        <div className="flex gap-3" style={{ alignItems: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: `${statusColor}15`,
            border: `2px solid ${statusColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            fontWeight: '600',
            color: statusColor
          }}>
            {getInitials(resident.firstName, resident.lastName)}
          </div>
          <div>
            <div className="font-semibold">{resident.firstName} {resident.lastName}</div>
            <div className="text-sm text-gray">Room {resident.roomNumber}</div>
          </div>
        </div>
        <StatusBadge status={resident.currentStatus} size="sm" />
      </div>

      {resident.latestVitals && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.5rem',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border)'
        }}>
          <div className="flex gap-2" style={{ alignItems: 'center' }}>
            <span>❤️</span>
            <span className="font-semibold">{resident.latestVitals.heartRate || '--'}</span>
            <span className="text-xs text-gray">bpm</span>
          </div>
          <div className="flex gap-2" style={{ alignItems: 'center' }}>
            <span>🫁</span>
            <span className="font-semibold">
              {resident.latestVitals.spo2 ? `${resident.latestVitals.spo2}%` : '--'}
            </span>
          </div>
          <div className="flex gap-2" style={{ alignItems: 'center' }}>
            <span>🩸</span>
            <span className="font-semibold">
              {formatBloodPressure(resident.latestVitals.bloodPressure)}
            </span>
          </div>
          <div className="flex gap-2" style={{ alignItems: 'center' }}>
            <span>🌡️</span>
            <span className="font-semibold">{resident.latestVitals.temperature || '--'}°F</span>
          </div>
        </div>
      )}

      <div className="flex-between mt-3 text-xs text-gray">
        {resident.device ? (
          <>
            <span>🔋 {resident.device.batteryLevel}%</span>
            <span>📍 {resident.latestVitals?.locationDescription || 'Unknown'}</span>
          </>
        ) : (
          <span>No device paired</span>
        )}
      </div>

      {resident.activeAlerts > 0 && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.5rem',
          background: '#FEE2E2',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: '#991B1B',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ animation: 'pulse 2s infinite' }}>⚠️</span>
          {resident.activeAlerts} active alert{resident.activeAlerts > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

ResidentCard.propTypes = {
  resident: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    roomNumber: PropTypes.string,
    currentStatus: PropTypes.oneOf(['normal', 'warning', 'critical']),
    latestVitals: PropTypes.shape({
      heartRate: PropTypes.number,
      spo2: PropTypes.number,
      bloodPressure: PropTypes.shape({
        systolic: PropTypes.number,
        diastolic: PropTypes.number
      }),
      temperature: PropTypes.number,
      locationDescription: PropTypes.string
    }),
    device: PropTypes.shape({
      batteryLevel: PropTypes.number
    }),
    activeAlerts: PropTypes.number
  }).isRequired,
  onClick: PropTypes.func,
  isSelected: PropTypes.bool
};

export default memo(ResidentCard);

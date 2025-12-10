import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { StatusBadge, LoadingSpinner, VitalCard, VitalChart } from '../common';
import { RESIDENT_TABS, VITAL_RANGES } from '../../utils/constants';
import { getInitials } from '../../utils/helpers';
import { api } from '../../services/api';

function ResidentDetail({ resident, onClose }) {
  const [activeTab, setActiveTab] = useState('vitals');
  const [vitalHistory, setVitalHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get(`/residents/${resident.id}/vitals/history?hours=24`);
        const vitals = data.vitals || [];
        setVitalHistory(vitals.map(v => ({
          time: v.recordedAt,
          heartRate: v.heartRate,
          spo2: v.spo2,
          temperature: v.temperature
        })));
      } catch (err) {
        console.error('Failed to load vital history:', err);
        setError('Failed to load vital history');
        setVitalHistory([]);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [resident.id]);

  const getVitalStatus = (type) => {
    const vitals = resident.latestVitals;
    if (!vitals) return 'normal';

    switch (type) {
      case 'heartRate':
        return vitals.heartRate > 100 ? 'warning' : 'normal';
      case 'spo2':
        return vitals.spo2 < 95 ? 'warning' : 'normal';
      case 'temperature':
        return vitals.temperature > 99.5 ? 'warning' : 'normal';
      default:
        return 'normal';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-between mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div className="flex gap-4" style={{ alignItems: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--bg-light)',
              border: '3px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: '600',
              color: 'var(--primary)'
            }}>
              {getInitials(resident.firstName, resident.lastName)}
            </div>
            <div>
              <h2 style={{ margin: 0 }}>{resident.firstName} {resident.lastName}</h2>
              <div className="text-gray">Room {resident.roomNumber} | Age {resident.age || 'N/A'}</div>
              <StatusBadge status={resident.currentStatus} />
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          {RESIDENT_TABS.map(tab => (
            <button
              key={tab.id}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1rem' }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ overflow: 'auto', flex: 1, padding: '0.5rem 0' }}>
          {activeTab === 'vitals' && (
            <>
              <div className="grid grid-4 gap-4 mb-4">
                <VitalCard
                  icon="❤️"
                  label="Heart Rate"
                  value={resident.latestVitals?.heartRate}
                  unit="BPM"
                  status={getVitalStatus('heartRate')}
                  range={VITAL_RANGES.heartRate}
                  trend="stable"
                />
                <VitalCard
                  icon="🫁"
                  label="Blood Oxygen"
                  value={resident.latestVitals?.spo2}
                  unit="%"
                  status={getVitalStatus('spo2')}
                  range={VITAL_RANGES.spo2}
                />
                <VitalCard
                  icon="🩸"
                  label="Blood Pressure"
                  value={resident.latestVitals?.bloodPressure
                    ? `${resident.latestVitals.bloodPressure.systolic}/${resident.latestVitals.bloodPressure.diastolic}`
                    : null}
                  unit="mmHg"
                  status="normal"
                  range={VITAL_RANGES.bloodPressure}
                />
                <VitalCard
                  icon="🌡️"
                  label="Temperature"
                  value={resident.latestVitals?.temperature}
                  unit="°F"
                  status={getVitalStatus('temperature')}
                  range={VITAL_RANGES.temperature}
                />
              </div>

              {loading ? (
                <div className="flex-center" style={{ padding: '2rem' }}>
                  <LoadingSpinner />
                </div>
              ) : error ? (
                <div className="card" style={{ background: '#FEF2F2', textAlign: 'center', padding: '2rem' }}>
                  <p className="text-gray">{error}</p>
                </div>
              ) : (
                <div className="grid grid-2 gap-4">
                  <VitalChart
                    data={vitalHistory.map(v => ({ time: v.time, value: v.heartRate }))}
                    dataKey="value"
                    color="var(--critical)"
                    label="Heart Rate (24h)"
                  />
                  <VitalChart
                    data={vitalHistory.map(v => ({ time: v.time, value: v.spo2 }))}
                    dataKey="value"
                    color="var(--info)"
                    label="Blood Oxygen (24h)"
                  />
                </div>
              )}

              {resident.device && (
                <div className="card mt-4" style={{ background: 'var(--bg-light)' }}>
                  <h4 className="mb-3">Device Status</h4>
                  <div className="flex gap-6">
                    <div>
                      <span className="text-gray text-sm">Device:</span>
                      <div className="font-semibold">{resident.device.model || 'Unknown'}</div>
                    </div>
                    <div>
                      <span className="text-gray text-sm">Battery:</span>
                      <div className="font-semibold">🔋 {resident.device.batteryLevel}%</div>
                    </div>
                    <div>
                      <span className="text-gray text-sm">Signal:</span>
                      <div className="font-semibold">📶 {resident.device.signalStrength || 'Good'}</div>
                    </div>
                    <div>
                      <span className="text-gray text-sm">Last Sync:</span>
                      <div className="font-semibold">
                        {resident.device.lastSyncAt
                          ? new Date(resident.device.lastSyncAt).toLocaleTimeString()
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'activity' && (
            <div className="card">
              <h4 className="mb-3">Daily Activity</h4>
              <div className="grid grid-3 gap-4">
                <div className="text-center">
                  <div style={{ fontSize: '2rem' }}>👣</div>
                  <div className="text-2xl font-bold">2,340</div>
                  <div className="text-sm text-gray">Steps Today</div>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: '2rem' }}>😴</div>
                  <div className="text-2xl font-bold">7.5h</div>
                  <div className="text-sm text-gray">Sleep Last Night</div>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: '2rem' }}>🚶</div>
                  <div className="text-2xl font-bold">3h</div>
                  <div className="text-sm text-gray">Active Time</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="card">
              <h4 className="mb-3">Recent Alerts</h4>
              <p className="text-gray">No recent alerts for this resident.</p>
            </div>
          )}

          {activeTab === 'log' && (
            <div className="card">
              <h4 className="mb-3">Care Log</h4>
              <p className="text-gray">Care log entries will appear here.</p>
            </div>
          )}

          {(resident.medicalConditions?.length > 0 || resident.allergies?.length > 0) && (
            <div className="grid grid-2 gap-4 mt-4">
              {resident.medicalConditions?.length > 0 && (
                <div className="card" style={{ background: 'var(--bg-light)' }}>
                  <h4 className="mb-3">Medical Conditions</h4>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {resident.medicalConditions.map((condition, index) => (
                      <span key={index} className="badge badge-info">{condition}</span>
                    ))}
                  </div>
                </div>
              )}
              {resident.allergies?.length > 0 && (
                <div className="card" style={{ background: '#FEF2F2' }}>
                  <h4 className="mb-3">⚠️ Allergies</h4>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {resident.allergies.map((allergy, index) => (
                      <span key={index} className="badge badge-critical">{allergy}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ResidentDetail.propTypes = {
  resident: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    roomNumber: PropTypes.string,
    age: PropTypes.number,
    currentStatus: PropTypes.string,
    latestVitals: PropTypes.object,
    device: PropTypes.object,
    medicalConditions: PropTypes.arrayOf(PropTypes.string),
    allergies: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

export default ResidentDetail;

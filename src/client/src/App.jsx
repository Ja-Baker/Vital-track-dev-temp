import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const API_BASE = '/api';

const AuthContext = createContext(null);
const SocketContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
export const useSocket = () => useContext(SocketContext);

const api = {
  token: localStorage.getItem('token'),
  
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data;
  },

  get(endpoint) {
    return this.request(endpoint);
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }
};

function StatusBadge({ status, size = 'md' }) {
  const config = {
    normal: { bg: 'var(--success)', text: 'white', label: 'Normal' },
    warning: { bg: 'var(--warning)', text: '#1F2937', label: 'Warning' },
    critical: { bg: 'var(--critical)', text: 'white', label: 'Critical' },
    offline: { bg: 'var(--gray)', text: 'white', label: 'Offline' },
    pending: { bg: 'var(--warning)', text: '#1F2937', label: 'Pending' },
    acknowledged: { bg: 'var(--info)', text: 'white', label: 'Acknowledged' },
    resolved: { bg: 'var(--success)', text: 'white', label: 'Resolved' }
  };

  const { bg, text, label } = config[status] || config.offline;
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

function LoadingSpinner({ size = 'md' }) {
  const sizeMap = { sm: '24px', md: '40px', lg: '60px' };
  return (
    <div className="loading-spinner" style={{ width: sizeMap[size], height: sizeMap[size] }} />
  );
}

function VitalCard({ icon, label, value, unit, status, range, trend }) {
  const statusColors = {
    normal: 'var(--success)',
    warning: 'var(--warning)',
    critical: 'var(--critical)'
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→'
  };

  return (
    <div className="card" style={{ 
      borderLeft: `4px solid ${statusColors[status] || 'var(--border)'}`
    }}>
      <div className="flex-between mb-2">
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
        <StatusBadge status={status} size="sm" />
      </div>
      <div className="text-sm text-gray mb-1">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{value || '--'}</span>
        <span className="text-sm text-gray">{unit}</span>
        {trend && <span style={{ color: trend === 'up' ? 'var(--critical)' : trend === 'down' ? 'var(--warning)' : 'var(--success)' }}>{trendIcons[trend]}</span>}
      </div>
      {range && <div className="text-xs text-gray mt-1">Range: {range}</div>}
    </div>
  );
}

function ResidentCard({ resident, onClick, isSelected }) {
  const statusColors = {
    normal: 'var(--success)',
    warning: 'var(--warning)',
    critical: 'var(--critical)'
  };

  const statusColor = statusColors[resident.currentStatus] || 'var(--gray)';

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
      onMouseEnter={(e) => { 
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(-2px)'; 
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; 
        }
      }}
      onMouseLeave={(e) => { 
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(0)'; 
          e.currentTarget.style.boxShadow = ''; 
        }
      }}
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
            {resident.firstName?.[0]}{resident.lastName?.[0]}
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
            <span className="font-semibold">{resident.latestVitals.spo2 ? `${resident.latestVitals.spo2}%` : '--'}</span>
          </div>
          <div className="flex gap-2" style={{ alignItems: 'center' }}>
            <span>🩸</span>
            <span className="font-semibold">
              {resident.latestVitals.bloodPressure 
                ? `${resident.latestVitals.bloodPressure.systolic}/${resident.latestVitals.bloodPressure.diastolic}` 
                : '--'}
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

function AlertItem({ alert, onAcknowledge, onResolve }) {
  const typeColors = {
    critical: 'var(--critical)',
    warning: 'var(--warning)',
    info: 'var(--info)'
  };

  const typeIcons = {
    critical: '🚨',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const timeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="card" style={{ 
      borderLeft: `4px solid ${typeColors[alert.type]}`, 
      marginBottom: '1rem',
      background: alert.status === 'pending' ? `${typeColors[alert.type]}08` : 'white'
    }}>
      <div className="flex-between">
        <div className="flex gap-3" style={{ alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.5rem' }}>{typeIcons[alert.type]}</span>
          <div>
            <div className="flex gap-2" style={{ alignItems: 'center' }}>
              <span className="font-semibold">{alert.title}</span>
              <StatusBadge status={alert.status} size="sm" />
            </div>
            <div className="text-sm text-gray">{alert.residentName} - Room {alert.roomNumber}</div>
            <div className="text-xs text-gray mt-1">{timeSince(alert.createdAt)}</div>
          </div>
        </div>
        <div className="flex gap-2">
          {alert.status === 'pending' && (
            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => onAcknowledge(alert.id)}>
              Acknowledge
            </button>
          )}
          {alert.status === 'acknowledged' && (
            <button className="btn btn-success" style={{ padding: '0.5rem 1rem' }} onClick={() => onResolve(alert.id)}>
              Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchFilter({ value, onChange, placeholder, filters, activeFilter, onFilterChange }) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '1rem', 
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
        <input
          type="text"
          className="input"
          style={{ paddingLeft: '36px' }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {filters && (
        <div className="flex gap-2">
          {filters.map(filter => (
            <button
              key={filter.value}
              className={`btn ${activeFilter === filter.value ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1rem' }}
              onClick={() => onFilterChange(filter.value)}
            >
              {filter.icon && <span style={{ marginRight: '4px' }}>{filter.icon}</span>}
              {filter.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

function VitalChart({ data, dataKey, color, label }) {
  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-gray">No data available</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h4 className="mb-3">{label}</h4>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
            tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
          <Tooltip 
            contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}
            labelFormatter={(value) => new Date(value).toLocaleString()}
          />
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            fill={`${color}20`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ResidentDetail({ resident, onClose }) {
  const [activeTab, setActiveTab] = useState('vitals');
  const [vitalHistory, setVitalHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
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
        setVitalHistory([]);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [resident.id]);

  const tabs = [
    { id: 'vitals', label: 'Vitals', icon: '❤️' },
    { id: 'activity', label: 'Activity', icon: '🚶' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' },
    { id: 'log', label: 'Care Log', icon: '📝' }
  ];

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0,0,0,0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 1000,
      padding: '1rem'
    }} onClick={onClose}>
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
              {resident.firstName?.[0]}{resident.lastName?.[0]}
            </div>
            <div>
              <h2 style={{ margin: 0 }}>{resident.firstName} {resident.lastName}</h2>
              <div className="text-gray">Room {resident.roomNumber} | Age {resident.age || 'N/A'}</div>
              <StatusBadge status={resident.currentStatus} />
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose}>✕</button>
        </div>

        <div className="flex gap-2 mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          {tabs.map(tab => (
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

        <div style={{ overflow: 'auto', flex: 1, padding: '0.5rem 0' }}>
          {activeTab === 'vitals' && (
            <>
              <div className="grid grid-4 gap-4 mb-4">
                <VitalCard 
                  icon="❤️" 
                  label="Heart Rate" 
                  value={resident.latestVitals?.heartRate} 
                  unit="BPM"
                  status={resident.latestVitals?.heartRate > 100 ? 'warning' : 'normal'}
                  range="60-100"
                  trend="stable"
                />
                <VitalCard 
                  icon="🫁" 
                  label="Blood Oxygen" 
                  value={resident.latestVitals?.spo2} 
                  unit="%"
                  status={resident.latestVitals?.spo2 < 95 ? 'warning' : 'normal'}
                  range=">95%"
                />
                <VitalCard 
                  icon="🩸" 
                  label="Blood Pressure" 
                  value={resident.latestVitals?.bloodPressure ? `${resident.latestVitals.bloodPressure.systolic}/${resident.latestVitals.bloodPressure.diastolic}` : null} 
                  unit="mmHg"
                  status="normal"
                  range="120/80"
                />
                <VitalCard 
                  icon="🌡️" 
                  label="Temperature" 
                  value={resident.latestVitals?.temperature} 
                  unit="°F"
                  status={resident.latestVitals?.temperature > 99.5 ? 'warning' : 'normal'}
                  range="97.8-99.1"
                />
              </div>

              {loading ? (
                <div className="flex-center" style={{ padding: '2rem' }}><LoadingSpinner /></div>
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
                      <div className="font-semibold">{resident.device.lastSyncAt ? new Date(resident.device.lastSyncAt).toLocaleTimeString() : 'N/A'}</div>
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
                    {resident.medicalConditions.map((c, i) => (
                      <span key={i} className="badge badge-info">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {resident.allergies?.length > 0 && (
                <div className="card" style={{ background: '#FEF2F2' }}>
                  <h4 className="mb-3">⚠️ Allergies</h4>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {resident.allergies.map((a, i) => (
                      <span key={i} className="badge badge-critical">{a}</span>
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

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (isRegister) {
        data = await api.post('/auth/register', { email, password, firstName, lastName });
      } else {
        data = await api.post('/auth/login', { email, password });
      }
      
      api.setToken(data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💓</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--primary)' }}>VitalTrack</h1>
          <p className="text-gray">Senior Health Monitoring</p>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">First Name</label>
                <input type="text" className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Last Name</label>
                <input type="text" className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@facility.com" required />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button type="button" onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({ user, onLogout, activeNav, onNavChange }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'residents', label: 'Residents', icon: '👥' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <header style={{ background: 'white', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container flex-between" style={{ padding: '1rem' }}>
        <div className="flex gap-3" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem' }}>💓</span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>VitalTrack</h1>
          {user.facility && <span className="badge badge-info">{user.facility.name}</span>}
        </div>
        <div className="flex gap-3" style={{ alignItems: 'center' }}>
          <span className="text-sm text-gray">{user.firstName} {user.lastName}</span>
          <span className="badge badge-gray">{user.role}</span>
          <button onClick={onLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Logout</button>
        </div>
      </div>
      <nav style={{ borderTop: '1px solid var(--border)' }}>
        <div className="container flex gap-1" style={{ padding: '0.5rem 1rem' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              style={{
                padding: '0.75rem 1.25rem',
                background: activeNav === item.id ? 'var(--primary)' : 'transparent',
                color: activeNav === item.id ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: activeNav === item.id ? 600 : 400,
                transition: 'all 0.2s'
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}

function DashboardView({ residents, alerts, stats, onResidentClick, onAcknowledge, onResolve }) {
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
              <AlertItem key={alert.id} alert={alert} onAcknowledge={onAcknowledge} onResolve={onResolve} />
            ))}
          </div>
        </div>
      )}

      <h3 className="mb-3">Resident Overview</h3>
      <div className="grid grid-3">
        {residents.slice(0, 6).map(resident => (
          <ResidentCard key={resident.id} resident={resident} onClick={() => onResidentClick(resident)} />
        ))}
      </div>
    </>
  );
}

function ResidentsView({ residents, onResidentClick }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'critical', label: 'Critical', icon: '🔴' },
    { value: 'warning', label: 'Warning', icon: '🟡' },
    { value: 'normal', label: 'Normal', icon: '🟢' }
  ];

  const filteredResidents = useMemo(() => {
    return residents.filter(r => {
      const matchesSearch = search === '' || 
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        r.roomNumber?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || r.currentStatus === filter;
      return matchesSearch && matchesFilter;
    });
  }, [residents, search, filter]);

  return (
    <>
      <div className="flex-between mb-4">
        <h2>Residents ({filteredResidents.length})</h2>
      </div>

      <SearchFilter 
        value={search}
        onChange={setSearch}
        placeholder="Search by name or room..."
        filters={filters}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      <div className="grid grid-3">
        {filteredResidents.map(resident => (
          <ResidentCard key={resident.id} resident={resident} onClick={() => onResidentClick(resident)} />
        ))}
      </div>

      {filteredResidents.length === 0 && (
        <div className="empty-state card">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3>No Residents Found</h3>
          <p className="text-gray">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </>
  );
}

function AlertsView({ alerts, onAcknowledge, onResolve }) {
  const [filter, setFilter] = useState('pending');

  const filters = [
    { value: 'pending', label: 'Active' },
    { value: 'acknowledged', label: 'Acknowledged' },
    { value: 'resolved', label: 'Resolved' }
  ];

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => a.status === filter || (filter === 'resolved' && a.status === 'false_alarm'));
  }, [alerts, filter]);

  return (
    <>
      <div className="flex-between mb-4">
        <h2>Alerts</h2>
      </div>

      <div className="flex gap-2 mb-4">
        {filters.map(f => (
          <button
            key={f.value}
            className={`btn ${filter === f.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            {f.value === 'pending' && alerts.filter(a => a.status === 'pending').length > 0 && (
              <span style={{ marginLeft: '8px', background: 'var(--critical)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.75rem' }}>
                {alerts.filter(a => a.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredAlerts.length > 0 ? (
        filteredAlerts.map(alert => (
          <AlertItem key={alert.id} alert={alert} onAcknowledge={onAcknowledge} onResolve={onResolve} />
        ))
      ) : (
        <div className="empty-state card">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h3>No {filter === 'pending' ? 'Active' : filter} Alerts</h3>
          <p className="text-gray">{filter === 'pending' ? 'All residents are doing well.' : 'No alerts in this category.'}</p>
        </div>
      )}
    </>
  );
}

function AnalyticsView({ residents, alerts }) {
  const criticalCount = residents.filter(r => r.currentStatus === 'critical').length;
  const warningCount = residents.filter(r => r.currentStatus === 'warning').length;
  const normalCount = residents.filter(r => r.currentStatus === 'normal').length;

  return (
    <>
      <h2 className="mb-4">Analytics</h2>
      
      <div className="grid grid-2 gap-4 mb-4">
        <div className="card">
          <h4 className="mb-3">Resident Status Distribution</h4>
          <div className="flex gap-4">
            <div className="text-center" style={{ flex: 1 }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                background: 'var(--success)', 
                margin: '0 auto 0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>{normalCount}</div>
              <div className="text-sm text-gray">Normal</div>
            </div>
            <div className="text-center" style={{ flex: 1 }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                background: 'var(--warning)', 
                margin: '0 auto 0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>{warningCount}</div>
              <div className="text-sm text-gray">Warning</div>
            </div>
            <div className="text-center" style={{ flex: 1 }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                background: 'var(--critical)', 
                margin: '0 auto 0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>{criticalCount}</div>
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
                {alerts.filter(a => a.status === 'pending').length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray">Resolved</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
                {alerts.filter(a => a.status === 'resolved').length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray">Avg Response</div>
              <div className="text-2xl font-bold">2.3 min</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h4 className="mb-3">Coming Soon</h4>
        <p className="text-gray">Advanced analytics including trend analysis, predictive risk indicators, and exportable reports will be available in a future update.</p>
      </div>
    </>
  );
}

function SettingsView({ user }) {
  return (
    <>
      <h2 className="mb-4">Settings</h2>
      
      <div className="card mb-4">
        <h4 className="mb-3">Profile</h4>
        <div className="grid grid-2 gap-4">
          <div>
            <div className="text-sm text-gray">Name</div>
            <div className="font-semibold">{user.firstName} {user.lastName}</div>
          </div>
          <div>
            <div className="text-sm text-gray">Email</div>
            <div className="font-semibold">{user.email}</div>
          </div>
          <div>
            <div className="text-sm text-gray">Role</div>
            <span className="badge badge-info">{user.role}</span>
          </div>
          <div>
            <div className="text-sm text-gray">Facility</div>
            <div className="font-semibold">{user.facility?.name || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h4 className="mb-3">Notification Preferences</h4>
        <p className="text-gray">Notification settings will be available in a future update.</p>
      </div>
    </>
  );
}

function MainApp({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [residents, setResidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedResident, setSelectedResident] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io({ 
      path: '/socket.io',
      auth: { token: api.token }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      if (user.facilityId) {
        newSocket.emit('join-facility', user.facilityId);
      }
    });

    newSocket.on('vital-update', (data) => {
      setResidents(prev => prev.map(r => 
        r.id === data.residentId ? { ...r, latestVitals: data.vitals } : r
      ));
    });

    newSocket.on('new-alert', (alert) => {
      setAlerts(prev => [alert, ...prev]);
    });

    newSocket.on('alert-update', (updatedAlert) => {
      setAlerts(prev => prev.map(a => a.id === updatedAlert.id ? updatedAlert : a));
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [user.facilityId]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [residentsData, alertsData, facilityStats] = await Promise.all([
        api.get('/residents'),
        api.get('/alerts'),
        user.facilityId ? api.get(`/facilities/${user.facilityId}/stats`) : Promise.resolve(null)
      ]);
      
      setResidents(residentsData.residents || []);
      setAlerts(alertsData.alerts || []);
      setStats(facilityStats);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await api.post(`/alerts/${alertId}/acknowledge`);
      loadData();
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await api.post(`/alerts/${alertId}/resolve`, { outcome: 'resolved', notes: 'Resolved via dashboard' });
      loadData();
    } catch (err) {
      console.error('Failed to resolve:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '50vh' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <SocketContext.Provider value={socket}>
      <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
        <Header user={user} onLogout={onLogout} activeNav={activeNav} onNavChange={setActiveNav} />
        
        <main className="container" style={{ padding: '2rem 1rem' }}>
          {activeNav === 'dashboard' && (
            <DashboardView 
              residents={residents} 
              alerts={alerts} 
              stats={stats}
              onResidentClick={setSelectedResident}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
            />
          )}
          {activeNav === 'residents' && (
            <ResidentsView residents={residents} onResidentClick={setSelectedResident} />
          )}
          {activeNav === 'alerts' && (
            <AlertsView alerts={alerts} onAcknowledge={handleAcknowledge} onResolve={handleResolve} />
          )}
          {activeNav === 'analytics' && (
            <AnalyticsView residents={residents} alerts={alerts} />
          )}
          {activeNav === 'settings' && (
            <SettingsView user={user} />
          )}
        </main>

        {selectedResident && (
          <ResidentDetail resident={selectedResident} onClose={() => setSelectedResident(null)} />
        )}
      </div>
    </SocketContext.Provider>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.setToken(token);
      api.get('/auth/me')
        .then(data => setUser(data.user))
        .catch(() => {
          api.setToken(null);
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    }
    api.setToken(null);
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <MainApp user={user} onLogout={handleLogout} />
    </AuthContext.Provider>
  );
}

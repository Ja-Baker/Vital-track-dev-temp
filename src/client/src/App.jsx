import React, { useState, useEffect, createContext, useContext } from 'react';

const API_BASE = '/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

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
                <input
                  type="text"
                  className="input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Last Name</label>
                <input
                  type="text"
                  className="input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@facility.com"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({ user, onLogout }) {
  return (
    <header style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '1rem 0', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container flex-between">
        <div className="flex gap-3" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem' }}>💓</span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>VitalTrack</h1>
          {user.facility && (
            <span className="badge badge-info">{user.facility.name}</span>
          )}
        </div>
        <div className="flex gap-3" style={{ alignItems: 'center' }}>
          <span className="text-sm text-gray">{user.firstName} {user.lastName}</span>
          <span className="badge badge-gray">{user.role}</span>
          <button onClick={onLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function StatCard({ icon, label, value, color, subValue }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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

function ResidentCard({ resident, onClick }) {
  const statusColors = {
    normal: 'var(--success)',
    warning: 'var(--warning)',
    critical: 'var(--critical)'
  };

  const statusColor = statusColors[resident.currentStatus] || 'var(--gray)';

  return (
    <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
      <div className="flex-between mb-3">
        <div className="flex gap-3" style={{ alignItems: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            background: 'var(--bg-light)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--text-secondary)'
          }}>
            {resident.firstName[0]}{resident.lastName[0]}
          </div>
          <div>
            <div className="font-semibold">{resident.firstName} {resident.lastName}</div>
            <div className="text-sm text-gray">Room {resident.roomNumber}</div>
          </div>
        </div>
        <div style={{ 
          width: '12px', 
          height: '12px', 
          borderRadius: '50%', 
          background: statusColor,
          boxShadow: `0 0 8px ${statusColor}`
        }} />
      </div>

      {resident.latestVitals && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <div className="text-center">
            <div className="text-xs text-gray">❤️ HR</div>
            <div className="font-semibold">{resident.latestVitals.heartRate || '--'}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray">🫁 SpO2</div>
            <div className="font-semibold">{resident.latestVitals.spo2 ? `${resident.latestVitals.spo2}%` : '--'}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray">🩸 BP</div>
            <div className="font-semibold">
              {resident.latestVitals.bloodPressure 
                ? `${resident.latestVitals.bloodPressure.systolic}/${resident.latestVitals.bloodPressure.diastolic}` 
                : '--'}
            </div>
          </div>
        </div>
      )}

      {resident.device && (
        <div className="flex-between mt-3 text-xs text-gray">
          <span>🔋 {resident.device.batteryLevel}%</span>
          <span>📍 {resident.latestVitals?.locationDescription || 'Unknown'}</span>
        </div>
      )}

      {resident.activeAlerts > 0 && (
        <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#FEE2E2', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#991B1B' }}>
          ⚠️ {resident.activeAlerts} active alert{resident.activeAlerts > 1 ? 's' : ''}
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

  return (
    <div className="card" style={{ borderLeft: `4px solid ${typeColors[alert.type]}`, marginBottom: '1rem' }}>
      <div className="flex-between">
        <div className="flex gap-3" style={{ alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.5rem' }}>{typeIcons[alert.type]}</span>
          <div>
            <div className="font-semibold">{alert.title}</div>
            <div className="text-sm text-gray">{alert.residentName} - Room {alert.roomNumber}</div>
            <div className="text-xs text-gray mt-1">{new Date(alert.createdAt).toLocaleString()}</div>
          </div>
        </div>
        <div className="flex gap-2">
          {alert.status === 'pending' && (
            <>
              <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => onAcknowledge(alert.id)}>
                Acknowledge
              </button>
            </>
          )}
          {alert.status === 'acknowledged' && (
            <button className="btn btn-success" style={{ padding: '0.5rem 1rem' }} onClick={() => onResolve(alert.id)}>
              Resolve
            </button>
          )}
          {(alert.status === 'resolved' || alert.status === 'false_alarm') && (
            <span className="badge badge-success">✓ Resolved</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user }) {
  const [residents, setResidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('residents');
  const [selectedResident, setSelectedResident] = useState(null);

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
      
      setResidents(residentsData.residents);
      setAlerts(alertsData.alerts);
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
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const pendingAlerts = alerts.filter(a => a.status === 'pending');
  const criticalCount = residents.filter(r => r.currentStatus === 'critical').length;
  const warningCount = residents.filter(r => r.currentStatus === 'warning').length;
  const normalCount = residents.filter(r => r.currentStatus === 'normal').length;

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
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
              <div className="font-semibold text-critical">🚨 {pendingAlerts.length} Active Alert{pendingAlerts.length > 1 ? 's' : ''}</div>
              <div className="text-sm text-gray">Requires immediate attention</div>
            </div>
            <button className="btn btn-danger" onClick={() => setActiveTab('alerts')}>
              View Alerts
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <button 
          className={`btn ${activeTab === 'residents' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('residents')}
        >
          👥 Residents
        </button>
        <button 
          className={`btn ${activeTab === 'alerts' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('alerts')}
        >
          🔔 Alerts {pendingAlerts.length > 0 && `(${pendingAlerts.length})`}
        </button>
      </div>

      {activeTab === 'residents' && (
        <>
          <div className="grid grid-3">
            {residents.map(resident => (
              <ResidentCard 
                key={resident.id} 
                resident={resident} 
                onClick={() => setSelectedResident(resident)}
              />
            ))}
          </div>

          {residents.length === 0 && (
            <div className="empty-state card">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
              <h3>No Residents</h3>
              <p className="text-gray">No residents have been added to this facility yet.</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'alerts' && (
        <>
          {alerts.length > 0 ? (
            alerts.map(alert => (
              <AlertItem 
                key={alert.id} 
                alert={alert} 
                onAcknowledge={handleAcknowledge}
                onResolve={handleResolve}
              />
            ))
          ) : (
            <div className="empty-state card">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h3>No Alerts</h3>
              <p className="text-gray">All residents are doing well. No alerts at this time.</p>
            </div>
          )}
        </>
      )}

      {selectedResident && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setSelectedResident(null)}>
          <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex-between mb-4">
              <h2>{selectedResident.firstName} {selectedResident.lastName}</h2>
              <button className="btn btn-secondary" onClick={() => setSelectedResident(null)}>✕</button>
            </div>
            
            <div className="grid grid-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray">Room</div>
                <div className="font-semibold">{selectedResident.roomNumber}</div>
              </div>
              <div>
                <div className="text-sm text-gray">Status</div>
                <span className={`badge badge-${selectedResident.currentStatus === 'normal' ? 'success' : selectedResident.currentStatus}`}>
                  {selectedResident.currentStatus}
                </span>
              </div>
            </div>

            {selectedResident.latestVitals && (
              <>
                <h3 className="mb-3">Current Vitals</h3>
                <div className="grid grid-2 gap-4 mb-4">
                  <div className="card" style={{ background: 'var(--bg-light)' }}>
                    <div className="text-sm text-gray">❤️ Heart Rate</div>
                    <div className="text-2xl font-bold">{selectedResident.latestVitals.heartRate || '--'} <span className="text-sm font-normal">BPM</span></div>
                  </div>
                  <div className="card" style={{ background: 'var(--bg-light)' }}>
                    <div className="text-sm text-gray">🫁 Blood Oxygen</div>
                    <div className="text-2xl font-bold">{selectedResident.latestVitals.spo2 || '--'}<span className="text-sm font-normal">%</span></div>
                  </div>
                  <div className="card" style={{ background: 'var(--bg-light)' }}>
                    <div className="text-sm text-gray">🩸 Blood Pressure</div>
                    <div className="text-2xl font-bold">
                      {selectedResident.latestVitals.bloodPressure 
                        ? `${selectedResident.latestVitals.bloodPressure.systolic}/${selectedResident.latestVitals.bloodPressure.diastolic}` 
                        : '--'}
                    </div>
                  </div>
                  <div className="card" style={{ background: 'var(--bg-light)' }}>
                    <div className="text-sm text-gray">🌡️ Temperature</div>
                    <div className="text-2xl font-bold">{selectedResident.latestVitals.temperature || '--'}<span className="text-sm font-normal">°F</span></div>
                  </div>
                </div>
              </>
            )}

            {selectedResident.medicalConditions?.length > 0 && (
              <>
                <h3 className="mb-3">Medical Conditions</h3>
                <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
                  {selectedResident.medicalConditions.map((c, i) => (
                    <span key={i} className="badge badge-info">{c}</span>
                  ))}
                </div>
              </>
            )}

            {selectedResident.allergies?.length > 0 && (
              <>
                <h3 className="mb-3">Allergies</h3>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {selectedResident.allergies.map((a, i) => (
                    <span key={i} className="badge badge-critical">{a}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
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
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
        <Header user={user} onLogout={handleLogout} />
        <Dashboard user={user} />
      </div>
    </AuthContext.Provider>
  );
}

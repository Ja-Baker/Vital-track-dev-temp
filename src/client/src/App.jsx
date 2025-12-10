import React, { useState, useEffect, useCallback } from 'react';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider, useSocket } from './contexts/SocketContext';

// Components
import { LoadingSpinner, ErrorBoundary } from './components/common';
import { Header, LoginPage } from './components/layout';
import { ResidentDetail } from './components/residents';

// Views
import {
  DashboardView,
  ResidentsView,
  AlertsView,
  AnalyticsView,
  SettingsView
} from './views';

// Services
import { api } from './services/api';

function MainApp() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();

  const [activeNav, setActiveNav] = useState('dashboard');
  const [residents, setResidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResident, setSelectedResident] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [residentsData, alertsData] = await Promise.all([
        api.get('/residents'),
        api.get('/alerts')
      ]);

      setResidents(residentsData.residents || []);
      setAlerts(alertsData.alerts || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!socket) return;

    const handleVitalUpdate = (data) => {
      setResidents(prev => prev.map(r =>
        r.id === data.residentId ? { ...r, latestVitals: data.vitals } : r
      ));
    };

    const handleNewAlert = (alert) => {
      setAlerts(prev => [alert, ...prev]);
    };

    const handleAlertUpdate = (updatedAlert) => {
      setAlerts(prev => prev.map(a => a.id === updatedAlert.id ? updatedAlert : a));
    };

    socket.on('vital-update', handleVitalUpdate);
    socket.on('new-alert', handleNewAlert);
    socket.on('alert-update', handleAlertUpdate);

    return () => {
      socket.off('vital-update', handleVitalUpdate);
      socket.off('new-alert', handleNewAlert);
      socket.off('alert-update', handleAlertUpdate);
    };
  }, [socket]);

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
      await api.post(`/alerts/${alertId}/resolve`, {
        outcome: 'resolved',
        notes: 'Resolved via dashboard'
      });
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

  if (error) {
    return (
      <div className="flex-center" style={{ minHeight: '50vh' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--critical)', marginBottom: '1rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={loadData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeNav) {
      case 'dashboard':
        return (
          <DashboardView
            residents={residents}
            alerts={alerts}
            onResidentClick={setSelectedResident}
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
          />
        );
      case 'residents':
        return (
          <ResidentsView
            residents={residents}
            onResidentClick={setSelectedResident}
          />
        );
      case 'alerts':
        return (
          <AlertsView
            alerts={alerts}
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
          />
        );
      case 'analytics':
        return <AnalyticsView residents={residents} alerts={alerts} />;
      case 'settings':
        return <SettingsView user={user} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
      <Header
        user={user}
        onLogout={logout}
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />

      <main className="container" style={{ padding: '2rem 1rem' }}>
        <ErrorBoundary>
          {renderView()}
        </ErrorBoundary>
      </main>

      {selectedResident && (
        <ResidentDetail
          resident={selectedResident}
          onClose={() => setSelectedResident(null)}
        />
      )}
    </div>
  );
}

function AuthenticatedApp() {
  const { user } = useAuth();

  return (
    <SocketProvider facilityId={user?.facilityId}>
      <MainApp />
    </SocketProvider>
  );
}

function AppContent() {
  const { user, loading, login, register } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} onRegister={register} />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

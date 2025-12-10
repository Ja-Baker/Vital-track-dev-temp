import React from 'react';
import PropTypes from 'prop-types';
import { NAV_ITEMS } from '../../utils/constants';

function Header({ user, onLogout, activeNav, onNavChange }) {
  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container flex-between" style={{ padding: '1rem' }}>
        <div className="flex gap-3" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem' }}>💓</span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>
            VitalTrack
          </h1>
          {user.facility && (
            <span className="badge badge-info">{user.facility.name}</span>
          )}
        </div>
        <div className="flex gap-3" style={{ alignItems: 'center' }}>
          <span className="text-sm text-gray">{user.firstName} {user.lastName}</span>
          <span className="badge badge-gray">{user.role}</span>
          <button
            onClick={onLogout}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            Logout
          </button>
        </div>
      </div>
      <nav style={{ borderTop: '1px solid var(--border)' }}>
        <div className="container flex gap-1" style={{ padding: '0.5rem 1rem' }}>
          {NAV_ITEMS.map(item => (
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

Header.propTypes = {
  user: PropTypes.shape({
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    facility: PropTypes.shape({
      name: PropTypes.string
    })
  }).isRequired,
  onLogout: PropTypes.func.isRequired,
  activeNav: PropTypes.string.isRequired,
  onNavChange: PropTypes.func.isRequired
};

export default Header;

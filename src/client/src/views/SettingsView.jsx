import React from 'react';
import PropTypes from 'prop-types';

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

SettingsView.propTypes = {
  user: PropTypes.shape({
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    facility: PropTypes.shape({
      name: PropTypes.string
    })
  }).isRequired
};

export default SettingsView;

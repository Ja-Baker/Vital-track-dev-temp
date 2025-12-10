import React from 'react';
import PropTypes from 'prop-types';

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
        <span style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-secondary)'
        }}>
          🔍
        </span>
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

SearchFilter.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  filters: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string
  })),
  activeFilter: PropTypes.string,
  onFilterChange: PropTypes.func
};

export default SearchFilter;

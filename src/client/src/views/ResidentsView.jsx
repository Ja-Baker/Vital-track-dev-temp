import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { SearchFilter } from '../components/common';
import { ResidentCard } from '../components/residents';
import { RESIDENT_FILTERS } from '../utils/constants';

function ResidentsView({ residents, onResidentClick }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

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
        filters={RESIDENT_FILTERS}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      <div className="grid grid-3">
        {filteredResidents.map(resident => (
          <ResidentCard
            key={resident.id}
            resident={resident}
            onClick={() => onResidentClick(resident)}
          />
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

ResidentsView.propTypes = {
  residents: PropTypes.array.isRequired,
  onResidentClick: PropTypes.func.isRequired
};

export default ResidentsView;

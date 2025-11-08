import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchResidents } from '../store/slices/residentsSlice';
import { fetchAlertStats } from '../store/slices/alertsSlice';
import { ResidentWithStatus } from '../types';
import { colors, spacing } from '../theme/theme';
import ResidentCard from '../components/dashboard/ResidentCard';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const { residents, isLoading, isRefreshing, error } = useAppSelector(
    (state) => state.residents
  );
  const { stats: alertStats } = useAppSelector((state) => state.alerts);
  const { user, facility } = useAppSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'alerts' | 'normal' | 'no_data'
  >('all');

  // Fetch residents on mount
  useEffect(() => {
    dispatch(fetchResidents());
    dispatch(fetchAlertStats());
  }, [dispatch]);

  // Handle pull to refresh
  const handleRefresh = useCallback(() => {
    dispatch(fetchResidents());
    dispatch(fetchAlertStats());
  }, [dispatch]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Filter residents
  const filteredResidents = residents.filter((resident) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      resident.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    switch (selectedFilter) {
      case 'alerts':
        return (resident.activeAlerts ?? 0) > 0;
      case 'normal':
        return (
          resident.latestVital &&
          resident.lastVitalTimestamp &&
          (resident.activeAlerts ?? 0) === 0
        );
      case 'no_data':
        return !resident.latestVital || !resident.lastVitalTimestamp;
      default:
        return true;
    }
  });

  // Handle resident press
  const handleResidentPress = (residentId: string) => {
    navigation.navigate('ResidentDetail', { residentId });
  };

  // Get filter counts
  const getFilterCount = (filter: typeof selectedFilter): number => {
    switch (filter) {
      case 'alerts':
        return residents.filter((r) => (r.activeAlerts ?? 0) > 0).length;
      case 'normal':
        return residents.filter(
          (r) =>
            r.latestVital &&
            r.lastVitalTimestamp &&
            (r.activeAlerts ?? 0) === 0
        ).length;
      case 'no_data':
        return residents.filter((r) => !r.latestVital || !r.lastVitalTimestamp)
          .length;
      default:
        return residents.length;
    }
  };

  // Render resident item
  const renderResident = ({ item }: { item: ResidentWithStatus }) => (
    <ResidentCard
      resident={item}
      onPress={() => handleResidentPress(item.id)}
    />
  );

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return null;
    }

    if (error) {
      return (
        <EmptyState
          icon="alert-circle"
          title="Error Loading Residents"
          message={error}
          actionLabel="Try Again"
          onAction={handleRefresh}
        />
      );
    }

    if (searchQuery) {
      return (
        <EmptyState
          icon="magnify"
          title="No Results Found"
          message={`No residents match "${searchQuery}"`}
          actionLabel="Clear Search"
          onAction={() => setSearchQuery('')}
        />
      );
    }

    if (selectedFilter !== 'all') {
      return (
        <EmptyState
          icon="filter-off"
          title="No Residents Found"
          message="No residents match the selected filter"
          actionLabel="Show All"
          onAction={() => setSelectedFilter('all')}
        />
      );
    }

    return (
      <EmptyState
        icon="account-group"
        title="No Residents"
        message="There are no residents in your facility yet"
      />
    );
  };

  // Render list header
  const renderListHeader = () => (
    <View style={styles.header}>
      {/* Facility Info */}
      <View style={styles.facilityInfo}>
        <Text style={styles.greeting}>
          Welcome back, {user?.firstName} 👋
        </Text>
        <Text style={styles.facilityName}>{facility?.name}</Text>
      </View>

      {/* Alert Summary */}
      {alertStats && alertStats.active > 0 && (
        <View style={styles.alertSummary}>
          <Badge text={alertStats.active} type="error" size="medium" />
          <Text style={styles.alertSummaryText}>
            Active Alert{alertStats.active > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Search Bar */}
      <Searchbar
        placeholder="Search residents by name or room"
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={colors.primary}
      />

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Chip
          selected={selectedFilter === 'all'}
          onPress={() => setSelectedFilter('all')}
          style={styles.filterChip}
          selectedColor={colors.primary}
        >
          All ({getFilterCount('all')})
        </Chip>
        <Chip
          selected={selectedFilter === 'alerts'}
          onPress={() => setSelectedFilter('alerts')}
          style={styles.filterChip}
          selectedColor={colors.error}
          icon="alert"
        >
          Alerts ({getFilterCount('alerts')})
        </Chip>
        <Chip
          selected={selectedFilter === 'normal'}
          onPress={() => setSelectedFilter('normal')}
          style={styles.filterChip}
          selectedColor={colors.success}
          icon="check-circle"
        >
          Normal ({getFilterCount('normal')})
        </Chip>
        <Chip
          selected={selectedFilter === 'no_data'}
          onPress={() => setSelectedFilter('no_data')}
          style={styles.filterChip}
          selectedColor={colors.textSecondary}
          icon="help-circle"
        >
          No Data ({getFilterCount('no_data')})
        </Chip>
      </View>

      {/* Results Count */}
      <Text style={styles.resultsCount}>
        {filteredResidents.length} resident
        {filteredResidents.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading residents...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredResidents}
          renderItem={renderResident}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  facilityInfo: {
    marginBottom: spacing.md,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  facilityName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  alertSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  alertSummaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    marginLeft: spacing.sm,
  },
  searchBar: {
    marginBottom: spacing.md,
    elevation: 0,
    backgroundColor: '#FFFFFF',
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
});

export default DashboardScreen;

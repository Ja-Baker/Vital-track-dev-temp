import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchAlerts,
  fetchAlertStats,
  acknowledgeAlert,
  resolveAlert,
  escalateAlert,
} from '../store/slices/alertsSlice';
import { Alert, AlertStatus, AlertType } from '../types';
import { colors, spacing } from '../theme/theme';
import AlertCard from '../components/alerts/AlertCard';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';

const AlertsScreen: React.FC = () => {
  const layout = useWindowDimensions();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const { alerts, stats, isLoading, error } = useAppSelector((state) => state.alerts);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'active', title: 'Active' },
    { key: 'acknowledged', title: 'Acknowledged' },
    { key: 'resolved', title: 'Resolved' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<AlertType | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch alerts on mount
  useEffect(() => {
    dispatch(fetchAlerts({}));
    dispatch(fetchAlertStats());
  }, [dispatch]);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchAlerts({})).unwrap(),
      dispatch(fetchAlertStats()).unwrap(),
    ]);
    setRefreshing(false);
  }, [dispatch]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle type filter
  const handleTypeFilter = useCallback((type: AlertType | 'all') => {
    setSelectedType(type);
  }, []);

  // Handle acknowledge
  const handleAcknowledge = useCallback(
    async (alertId: string) => {
      try {
        setActionLoading(alertId);
        await dispatch(acknowledgeAlert(alertId)).unwrap();
        await dispatch(fetchAlertStats()).unwrap();
      } catch (error) {
        console.error('Failed to acknowledge alert:', error);
      } finally {
        setActionLoading(null);
      }
    },
    [dispatch]
  );

  // Handle resolve
  const handleResolve = useCallback(
    async (alertId: string, notes?: string) => {
      try {
        setActionLoading(alertId);
        await dispatch(resolveAlert({ alertId, notes })).unwrap();
        await dispatch(fetchAlertStats()).unwrap();
      } catch (error) {
        console.error('Failed to resolve alert:', error);
      } finally {
        setActionLoading(null);
      }
    },
    [dispatch]
  );

  // Handle escalate
  const handleEscalate = useCallback(
    async (alertId: string) => {
      try {
        setActionLoading(alertId);
        await dispatch(escalateAlert(alertId)).unwrap();
        await dispatch(fetchAlertStats()).unwrap();
      } catch (error) {
        console.error('Failed to escalate alert:', error);
      } finally {
        setActionLoading(null);
      }
    },
    [dispatch]
  );

  // Handle alert press - navigate to resident detail
  const handleAlertPress = useCallback(
    (alertId: string) => {
      const alert = alerts.find((a) => a.id === alertId);
      if (alert?.residentId) {
        navigation.navigate('Dashboard', {
          screen: 'ResidentDetail',
          params: { residentId: alert.residentId },
        });
      }
    },
    [alerts, navigation]
  );

  // Filter alerts by status and search/type
  const getFilteredAlerts = useCallback(
    (status: AlertStatus): Alert[] => {
      return alerts.filter((alert) => {
        // Status filter
        if (alert.status !== status) return false;

        // Type filter
        if (selectedType !== 'all' && alert.alertType !== selectedType) {
          return false;
        }

        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const residentName = alert.resident
            ? `${alert.resident.firstName} ${alert.resident.lastName}`.toLowerCase()
            : '';
          const roomNumber = alert.resident?.roomNumber?.toLowerCase() || '';
          const message = alert.message.toLowerCase();

          return (
            residentName.includes(query) ||
            roomNumber.includes(query) ||
            message.includes(query)
          );
        }

        return true;
      });
    },
    [alerts, selectedType, searchQuery]
  );

  // Render alert list
  const renderAlertList = (status: AlertStatus) => {
    const filteredAlerts = getFilteredAlerts(status);

    const renderAlert = ({ item }: { item: Alert }) => (
      <AlertCard
        alert={item}
        onAcknowledge={status === 'active' ? handleAcknowledge : undefined}
        onResolve={status === 'acknowledged' ? handleResolve : undefined}
        onEscalate={status === 'active' ? handleEscalate : undefined}
        onPress={handleAlertPress}
        isLoading={actionLoading === item.id}
      />
    );

    const renderEmptyState = () => {
      if (isLoading && !refreshing) {
        return null;
      }

      if (error) {
        return (
          <EmptyState
            icon="alert-circle"
            title="Error Loading Alerts"
            message={error}
            actionLabel="Try Again"
            onAction={handleRefresh}
          />
        );
      }

      if (searchQuery || selectedType !== 'all') {
        return (
          <EmptyState
            icon="filter-off"
            title="No Alerts Found"
            message="No alerts match your search or filter criteria"
            actionLabel="Clear Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedType('all');
            }}
          />
        );
      }

      // Empty state messages based on status
      const emptyMessages = {
        active: {
          icon: 'check-circle',
          title: 'No Active Alerts',
          message: 'All clear! No active alerts at this time.',
        },
        acknowledged: {
          icon: 'check-circle',
          title: 'No Acknowledged Alerts',
          message: 'No alerts are currently awaiting resolution.',
        },
        resolved: {
          icon: 'check-circle',
          title: 'No Resolved Alerts',
          message: 'No alerts have been resolved yet.',
        },
      };

      const emptyConfig = emptyMessages[status];

      return (
        <EmptyState
          icon={emptyConfig.icon}
          title={emptyConfig.title}
          message={emptyConfig.message}
        />
      );
    };

    return (
      <View style={styles.tabContent}>
        <FlatList
          data={filteredAlerts}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  // Render scene for tab view
  const renderScene = SceneMap({
    active: () => renderAlertList('active'),
    acknowledged: () => renderAlertList('acknowledged'),
    resolved: () => renderAlertList('resolved'),
  });

  // Render tab bar
  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      activeColor={colors.primary}
      inactiveColor={colors.textSecondary}
      renderLabel={({ route, focused }) => {
        const count =
          route.key === 'active'
            ? stats?.active || 0
            : route.key === 'acknowledged'
            ? stats?.acknowledged || 0
            : stats?.resolved || 0;

        return (
          <View style={styles.tabLabelContainer}>
            <Text
              style={[
                styles.tabLabelText,
                { color: focused ? colors.primary : colors.textSecondary },
              ]}
            >
              {route.title}
            </Text>
            {count > 0 && (
              <Badge
                text={count}
                type={route.key === 'active' ? 'error' : 'default'}
                size="small"
              />
            )}
          </View>
        );
      }}
    />
  );

  return (
    <View style={styles.container}>
      {/* Header with Search and Filters */}
      <View style={styles.header}>
        {/* Search Bar */}
        <Searchbar
          placeholder="Search alerts by resident or message"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={colors.primary}
        />

        {/* Type Filters */}
        <View style={styles.filtersContainer}>
          <Chip
            selected={selectedType === 'all'}
            onPress={() => handleTypeFilter('all')}
            style={styles.filterChip}
            selectedColor={colors.primary}
          >
            All
          </Chip>
          <Chip
            selected={selectedType === 'critical'}
            onPress={() => handleTypeFilter('critical')}
            style={styles.filterChip}
            selectedColor={colors.error}
            icon="alert-octagon"
          >
            Critical
          </Chip>
          <Chip
            selected={selectedType === 'warning'}
            onPress={() => handleTypeFilter('warning')}
            style={styles.filterChip}
            selectedColor={colors.warning}
            icon="alert"
          >
            Warning
          </Chip>
          <Chip
            selected={selectedType === 'info'}
            onPress={() => handleTypeFilter('info')}
            style={styles.filterChip}
            selectedColor={colors.info}
            icon="information"
          >
            Info
          </Chip>
        </View>
      </View>

      {/* Loading State */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      ) : (
        /* Tab View */
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          renderTabBar={renderTabBar}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    marginBottom: spacing.md,
    elevation: 0,
    backgroundColor: colors.background,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
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
  tabBar: {
    backgroundColor: '#FFFFFF',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabIndicator: {
    backgroundColor: colors.primary,
    height: 3,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'none',
  },
  tabLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tabLabelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
});

export default AlertsScreen;

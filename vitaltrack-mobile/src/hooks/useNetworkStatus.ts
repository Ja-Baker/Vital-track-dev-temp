import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: NetInfoStateType;
  isWifi: boolean;
  isCellular: boolean;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: NetInfoStateType.unknown,
    isWifi: false,
    isCellular: false,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === NetInfoStateType.wifi,
        isCellular: state.type === NetInfoStateType.cellular,
      });
    });

    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === NetInfoStateType.wifi,
        isCellular: state.type === NetInfoStateType.cellular,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkStatus;
};

export default useNetworkStatus;

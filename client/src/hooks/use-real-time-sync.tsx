import { createContext, ReactNode, useContext, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { invalidateAllQueries, invalidateObjectiveQueries } from "@/lib/query-invalidation";

type RealTimeSyncContextType = {
  isConnected: boolean;
  refreshAllData: () => void;
  refreshObjectiveData: () => void;
  refreshTeamData: () => void;
  refreshUserData: () => void;
};

const RealTimeSyncContext = createContext<RealTimeSyncContextType | undefined>(undefined);

export function useRealTimeSync() {
  const context = useContext(RealTimeSyncContext);
  if (!context) {
    throw new Error("useRealTimeSync must be used within a RealTimeSyncProvider");
  }
  return context;
}

export function RealTimeSyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentTenant } = useTenantContext();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnected = wsRef.current?.readyState === WebSocket.OPEN;

  const getCurrentTenantId = useCallback(() => {
    if (currentTenant && currentTenant.id) {
      return currentTenant.id;
    }
    
    const directUlidMatch = window.location.pathname.match(/^\/([A-Z0-9]{26})/);
    if (directUlidMatch) {
      return directUlidMatch[1];
    }
    
    const legacyUlidMatch = window.location.pathname.match(/\/ulid\/([A-Z0-9]{26})/);
    if (legacyUlidMatch) {
      return legacyUlidMatch[1];
    }
    
    const tenantUlidMatch = window.location.pathname.match(/\/tenants\/([A-Z0-9]{26})/);
    if (tenantUlidMatch) {
      return tenantUlidMatch[1];
    }
    
    return sessionStorage.getItem('currentTenantId') || currentTenant?.id;
  }, [currentTenant]);

  const refreshAllData = useCallback(() => {
    console.log('🔄 Refreshing all application data...');
    invalidateAllQueries(queryClient);
  }, [queryClient]);

  const refreshObjectiveData = useCallback(() => {
    console.log('🎯 Refreshing objective-related data...');
    invalidateObjectiveQueries(queryClient);
  }, [queryClient]);

  const refreshTeamData = useCallback(() => {
    console.log('👥 Refreshing team data...');
    queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    queryClient.invalidateQueries({ queryKey: ["/api/teams-performance"] });
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  }, [queryClient]);

  const refreshUserData = useCallback(() => {
    console.log('👤 Refreshing user data...');
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/user/role"] });
    queryClient.invalidateQueries({ queryKey: ["/api/user/is-team-leader"] });
  }, [queryClient]);

  const setupWebSocket = useCallback(() => {
    // Temporarily disable WebSocket connections to fix connectivity issues
    console.log('🔌 WebSocket real-time sync temporarily disabled');
    return;

    ws.onopen = () => {
      console.log('✅ Real-time sync connected');
      
      // Join tenant-wide sync room for data updates
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'join_sync_room',
          tenantId: tenantId
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Real-time sync message received:', data.type);

        switch (data.type) {
          case 'objective_updated':
          case 'objective_created':
          case 'objective_deleted':
          case 'key_result_updated':
          case 'key_result_created':
          case 'key_result_deleted':
            refreshObjectiveData();
            break;

          case 'team_updated':
          case 'team_created':
          case 'team_deleted':
          case 'team_member_added':
          case 'team_member_removed':
            refreshTeamData();
            break;

          case 'user_updated':
          case 'user_created':
          case 'user_role_changed':
            refreshUserData();
            break;

          case 'timeframe_updated':
          case 'timeframe_created':
          case 'timeframe_deleted':
            queryClient.invalidateQueries({ queryKey: ["/api/timeframes"] });
            break;

          case 'check_in_created':
          case 'check_in_updated':
            queryClient.invalidateQueries({ queryKey: ["/api/check-ins"] });
            refreshObjectiveData();
            break;

          case 'strategic_direction_updated':
          case 'mission_updated':
            queryClient.invalidateQueries({ queryKey: ["/api/strategic-directions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/mission"] });
            break;

          case 'bulk_data_update':
            // For large operations like CSV imports
            setTimeout(() => refreshAllData(), 1000);
            break;

          case 'sync_all':
            // Manual trigger for full refresh
            refreshAllData();
            break;

          default:
            console.log('🔔 Unknown sync message type:', data.type);
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse real-time sync message:', error);
      }
    };

    ws.onclose = () => {
      console.log('❌ Real-time sync disconnected');
      
      // Attempt to reconnect after 3 seconds
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Attempting to reconnect real-time sync...');
        setupWebSocket();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.warn('⚠️ Real-time sync WebSocket error:', error);
    };

  }, [user, getCurrentTenantId, refreshAllData, refreshObjectiveData, refreshTeamData, refreshUserData, queryClient]);

  useEffect(() => {
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [setupWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const value: RealTimeSyncContextType = {
    isConnected,
    refreshAllData,
    refreshObjectiveData,
    refreshTeamData,
    refreshUserData
  };

  return (
    <RealTimeSyncContext.Provider value={value}>
      {children}
    </RealTimeSyncContext.Provider>
  );
}
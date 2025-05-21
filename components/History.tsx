import { useAuth } from '@/contexts/AuthContext';
import { useGet } from '@/hooks/useApi';
import { ApiResponse } from '@/types/authContext';
import { CallHistoryItem, GroupItem, LIST_CONFIG } from '@/types/report.type';
import { formatDateTime } from '@/utils/formatDateTime';
import { router } from 'expo-router'; // Use router instead of useNavigation
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { EmptyState } from './EmptyState';
import { StatusBadge } from './StatusBadge';

const History = () => {
  const [selectedView, setSelectedView] = useState<'All' | 'Groups'>('Groups');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const stableUserId = useMemo(() => (user?.id != null ? String(user.id) : undefined), [user?.id]);
  type HistoryData = CallHistoryItem[] | GroupItem[];

  const {
    data: historyData,
    refetch: historyRefetch,
    isFetching: isHistoryFetching,
    error: historyError,
  } = useGet<ApiResponse<HistoryData>, { userId: string | undefined; selectedView: string }>(
    'report/history',
    { selectedView, userId: stableUserId },
    { showErrorToast: true, showSuccessToast: false, showLoader: false }
  );
  const renderTabContent = () => {
    const analyticsData = {
      overview: {
        totalCalls: 29,
        callsChangePercent: 12,
        totalRecipients: 143,
        recipientsChangePercent: 8,
      },
      weeklyActivity: [
        { label: 'Mon', value: 45, color: '#6C5CE7' },
        { label: 'Tue', value: 87, color: '#6C5CE7' },
        { label: 'Wed', value: 32, color: '#6C5CE7' },
        { label: 'Thu', value: 76, color: '#6C5CE7' },
        { label: 'Fri', value: 24, color: '#6C5CE7' },
        { label: 'Sat', value: 11, color: '#6C5CE7' },
        { label: 'Sun', value: 38, color: '#6C5CE7' },
      ],
      callStatus: {
        answered: 65,
        voicemail: 25,
        missed: 10,
      },
      activity: {
        avgCallDuration: 42,
        durationChangePercent: 5,
        busiestTimeOfDay: '2-4 PM',
      },
      callVolumeByHour: [
        { label: '8am', value: 12, color: '#6C5CE7' },
        { label: '10am', value: 28, color: '#6C5CE7' },
        { label: '12pm', value: 18, color: '#6C5CE7' },
        { label: '2pm', value: 48, color: '#6C5CE7' },
        { label: '4pm', value: 36, color: '#6C5CE7' },
        { label: '6pm', value: 14, color: '#6C5CE7' },
      ],
      dayOfWeekPerformance: [
        { label: 'Mon', value: 62, color: '#6C5CE7' },
        { label: 'Tue', value: 78, color: '#6C5CE7' },
        { label: 'Wed', value: 54, color: '#6C5CE7' },
        { label: 'Thu', value: 69, color: '#6C5CE7' },
        { label: 'Fri', value: 42, color: '#6C5CE7' },
        { label: 'Sat', value: 18, color: '#6C5CE7' },
        { label: 'Sun', value: 25, color: '#6C5CE7' },
      ],
      engagement: {
        overallRate: 72,
        rateChangePercent: 4,
        keypressRate: '56%',
        keypressChangePercent: 7,
      },
      topGroups: [
        { id: 1, name: 'Sales Leads', engagementRate: 84, callCount: 56 },
        { id: 2, name: 'Support Team', engagementRate: 76, callCount: 42 },
        { id: 3, name: 'Marketing', engagementRate: 68, callCount: 37 },
      ],
      responseDistribution: {
        pressed1: 56,
        pressed2: 32,
        other: 12,
      },
    };
  };
  // Handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await historyRefetch();
    setIsRefreshing(false);
  }, [historyRefetch]);

  const handleGroupPress = useCallback((group: GroupItem) => {
    router.push(`/sessions/${group.id}`);
  }, []);

  const formatDuration = useCallback((duration: number | undefined) => {
    if (!duration) return 'N/A';
    return `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
  }, []);
  // Render Functions
  const renderItem = useCallback(
    ({ item }: { item: CallHistoryItem | GroupItem }) => {
      if (selectedView === 'Groups') {
        const group = item as GroupItem;
        return (
          <TouchableOpacity
            onPress={() => handleGroupPress(group)}
            className="bg-background-secondary rounded-xl my-2 p-4 shadow-sm"
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`View group ${group.group_name}`}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-1 pr-3">
                <Text className="text-lg font-semibold text-text-primary">{group.group_name}</Text>
                <Text className="text-sm text-gray-500 mt-1">
                  {group.description || 'No description'}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Created at: {formatDateTime(group.created_at)}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#aaa" />
            </View>
          </TouchableOpacity>
        );
      }

      const history = item as CallHistoryItem;
      return (
        <View className="bg-background-secondary rounded-xl my-2 p-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Icon name="user-circle" size={24} color="#1E3A8A" />
              <Text className="text-base font-semibold text-text-primary ml-2">
                {history.contact_phone}
              </Text>
            </View>
            <StatusBadge status={history.status} />
          </View>
          <View className="border-t border-gray-200 pt-3">
            <Text className="text-sm text-text-primary">
              Called At: {formatDateTime(history.called_at)}
            </Text>
            <Text className="text-sm text-text-primary">
              Duration: {formatDuration(history.duration || 0)}
            </Text>
            {history.error_message && (
              <Text className="text-sm text-danger mt-1">Error: {history.error_message}</Text>
            )}
            <Text className="text-sm text-text-primary mt-1">
              Message: {history.message_content || 'N/A'}
            </Text>
          </View>
        </View>
      );
    },
    [selectedView, handleGroupPress, formatDuration]
  );

  return (
    <SafeAreaView className="flex-1 bg-background-primary">
      <View className="flex-row justify-between items-center pt-4 px-4 pb-2 bg-background-primary border-b border-gray-200">
        <Text className="text-2xl font-bold text-text-primary">{selectedView} History</Text>
        <View className="flex-row items-center">
          <Text className="font-medium text-text-primary capitalize mr-2">{selectedView}</Text>
          <Switch
            value={selectedView === 'Groups'}
            onValueChange={() => setSelectedView(selectedView === 'Groups' ? 'All' : 'Groups')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={selectedView === 'Groups' ? '#1E3A8A' : '#f4f3f4'}
          />
        </View>
      </View>

      <FlatList
        data={historyData?.data}
        {...LIST_CONFIG}
        keyExtractor={item => `${selectedView}-${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <EmptyState
            isLoading={isHistoryFetching}
            error={historyError}
            emptyMessage="No data available"
          />
        }
        accessibilityLabel={`${selectedView} history list`}
      />
    </SafeAreaView>
  );
};

export default History;

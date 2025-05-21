import { useAuth } from '@/contexts/AuthContext';
import { useGet } from '@/hooks/useApi';
import { ApiResponse } from '@/types/authContext';
import { CallHistoryItem, GroupItem } from '@/types/report.type';
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

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    historyRefetch().then(() => {
      setIsRefreshing(false);
    });
  }, [historyRefetch]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusStyle = (status: string) => {
    let statusString = status ? status.toUpperCase() : 'IN_PROGRESS';

    switch (statusString) {
      case 'ACCEPTED':
        return { color: 'text-success', bgColor: 'bg-success/20', icon: 'phone' };
      case 'FAILED':
      case 'MISSED':
        return { color: 'text-danger', bgColor: 'bg-success/20', icon: 'times-circle' };
      case 'IN_PROGRESS':
        return { color: 'text-warning', bgColor: 'bg-warning/20', icon: 'clock' };
      case 'VOICEMAIL':
        return { color: 'text-info', bgColor: 'bg-info/20', icon: 'envelope' };
      default:
        return { color: 'text-gray', bgColor: 'bg-gray/20', icon: 'question-circle' };
    }
  };

  const handleGroupPress = (group: GroupItem) => {
    router.push(`/sessions/${group.id}`);
  };

  const renderItem = useCallback(
    ({ item }: { item: CallHistoryItem | GroupItem }) => {
      if (selectedView === 'Groups') {
        const group = item as GroupItem;
        return (
          <TouchableOpacity
            onPress={() => handleGroupPress(group)}
            className="bg-background-secondary rounded-xl my-2 p-4 shadow-sm"
            activeOpacity={0.8}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-1 pr-3">
                <Text className="text-lg font-semibold text-text-primary">{group.group_name}</Text>
                <Text className="text-sm text-gray mt-1">{group.description}</Text>
                <Text className="text-xs text-gray mt-1">
                  Created at: {formatDateTime(group.created_at)}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#aaa" />
            </View>
          </TouchableOpacity>
        );
      }

      const history = item as CallHistoryItem;
      const { color, bgColor, icon } = getStatusStyle(history.status);
      const callTime = formatDateTime(history.called_at);
      const duration = history.duration
        ? `${Math.floor(history.duration / 60)}:${(history.duration % 60)
            .toString()
            .padStart(2, '0')}`
        : 'N/A';

      return (
        <View className="bg-background-secondary rounded-xl my-2 p-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Icon name="user-circle" size={24} />
              <Text className="text-base font-semibold text-text-primary ml-2">
                {history.contact_phone}
              </Text>
            </View>
            <View className={`flex-row items-center px-2 py-1 rounded-full ${bgColor}`}>
              <Icon name={icon} size={16} />
              <Text className={`text-sm font-medium uppercase ml-2 ${color}`}>
                {history.status}
              </Text>
            </View>
          </View>
          <View className="border-t border-gray-200 pt-3">
            <Text className="text-sm text-text-primary">Called At: {callTime}</Text>
            <Text className="text-sm text-text-primary">Duration: {duration}</Text>
            {history.error_message && (
              <Text className="text-sm text-danger mt-1">Error: {history.error_message}</Text>
            )}
            <Text className="text-sm text-text-primary mt-1">
              Message: {history.message_content}
            </Text>
          </View>
        </View>
      );
    },
    [selectedView]
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
        data={historyData?.data || []}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        keyExtractor={item => `${selectedView}-${(item as any).id}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          isHistoryFetching ? (
            <Text className="text-center text-gray mt-5 text-base">Loading...</Text>
          ) : historyError ? (
            <Text className="text-center text-danger mt-5 text-base">
              Error loading call history
            </Text>
          ) : (
            <Text className="text-center text-gray mt-5 text-base">No data available</Text>
          )
        }
      />
    </SafeAreaView>
  );
};

export default History;

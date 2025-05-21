import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useGet } from '@/hooks/useApi';
import { ApiResponse } from '@/types/authContext';
import { CallHistoryItem, CallSession, LIST_CONFIG } from '@/types/report.type';
import { formatDateTime } from '@/utils/formatDateTime';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';

const SessionsScreen = () => {
  const { user } = useAuth();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const stableUserId = useMemo(() => (user?.id != null ? String(user.id) : undefined), [user?.id]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [sessionId, setSessionId] = useState<number>(0);
  const [isRefresh, setIsRefreshing] = useState(false);

  // Use the enabled option to prevent the API call if groupId is invalid
  const {
    data: sessions,
    isLoading,
    error,
  } = useGet<{ data: CallSession[] }>(
    'report/sessions',
    { userId: stableUserId, groupId: groupId },
    {
      showErrorToast: true,
      showSuccessToast: false,
      showLoader: true,
    }
  );

  const {
    data: contactsData,
    refetch: contactsRefetch,
    isFetching: isContactsRefetch,
    error: contactsError,
  } = useGet<ApiResponse<CallHistoryItem[]>, { userId: string | undefined; sessionId: number }>(
    'report/contacts',
    { sessionId, userId: stableUserId },
    { showErrorToast: true, showSuccessToast: false, showLoader: false }
  ); // Handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await contactsRefetch();
    setIsRefreshing(false);
  }, [contactsRefetch]);

  const openModal = useCallback((item: CallSession) => {
    setSessionId(Number(item.id));
    setIsModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setSessionId(0);
  }, []);

  const formatDuration = useCallback((duration: number | undefined) => {
    if (!duration) return 'N/A';
    return `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
  }, []);

  // Render Functions
  const renderSessionItem = useCallback(
    ({ item }: { item: CallSession }) => (
      <TouchableOpacity
        onPress={() => openModal(item)}
        className="p-4 mb-4 bg-background-secondary rounded-lg shadow-sm flex-row justify-between items-center"
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`View session from ${formatDateTime(item.created_at)}`}
      >
        <View>
          <Text className="text-lg font-semibold text-text-primary">
            Session on {formatDateTime(item.created_at)}
          </Text>
          <Text className="text-sm text-gray-500">Status: {item.status}</Text>
          <Text className="text-sm text-gray-500">
            Calls: {item.successful_calls}/{item.total_calls} successful
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color="#aaa" />
      </TouchableOpacity>
    ),
    [openModal]
  );

  const renderHistoryItem = useCallback(
    ({ item }: { item: CallHistoryItem }) => (
      <View className="bg-background-secondary rounded-xl my-2 p-4 shadow-sm">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <Icon name="user-circle" size={24} color="#1E3A8A" />
            <Text className="text-base font-semibold text-text-primary ml-2">
              {item.contact_phone}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>
        <View className="border-t border-gray-200 pt-3">
          <Text className="text-sm text-text-primary">
            Called At: {formatDateTime(item.called_at)}
          </Text>
          <Text className="text-sm text-text-primary">
            Duration: {formatDuration(item.duration || 0)}
          </Text>
          {item.error_message && (
            <Text className="text-sm text-danger mt-1">Error: {item.error_message}</Text>
          )}
          <Text className="text-sm text-text-primary mt-1">
            Message: {item.message_content || 'N/A'}
          </Text>
        </View>
      </View>
    ),
    [formatDuration]
  );

  // Early Return for Missing groupId
  if (!groupId) {
    return (
      <SafeAreaView className="flex-1 bg-background-primary" edges={['top']}>
        <View className="flex-row justify-between items-center pt-4 px-4 pb-2 bg-background-primary border-b border-gray-200">
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon name="chevron-left" size={24} color="#1E3A8A" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-text-primary">Error</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text className="text-center text-red-500 mt-4" accessibilityRole="alert">
          Group ID is missing
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-primary" edges={['top']}>
      <View className="flex-row justify-between items-center pt-4 px-4 pb-2 bg-background-primary border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="chevron-left" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-text-primary">Group Sessions</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={sessions?.data}
        {...LIST_CONFIG}
        keyExtractor={item => item.id.toString()}
        renderItem={renderSessionItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            isLoading={isLoading}
            error={error}
            emptyMessage="No sessions found for this group"
          />
        }
        accessibilityLabel="List of group sessions"
      />
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={closeModal}
        onSwipeComplete={closeModal}
        swipeDirection={['down']}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        animationInTiming={300}
        animationOutTiming={200}
        backdropTransitionOutTiming={600}
        hideModalContentWhileAnimating
        style={{ justifyContent: 'flex-end', margin: 0 }}
        propagateSwipe
        accessibilityViewIsModal
      >
        <SafeAreaView
          className="bg-background-secondary rounded-t-3xl overflow-hidden"
          style={{ height: '75%' }}
          edges={['top']}
        >
          <View className="flex-row justify-between items-center pt-4 px-4 pb-2 bg-background-primary border-b border-gray-200">
            <Text className="text-2xl font-bold text-text-primary">Contacts</Text>
            <TouchableOpacity
              onPress={closeModal}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <Icon name="times" size={24} color="#1E3A8A" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={contactsData?.data}
            {...LIST_CONFIG}
            keyExtractor={item => `contact-${item.id}`}
            renderItem={renderHistoryItem}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={isRefresh} onRefresh={handleRefresh} />}
            ListEmptyComponent={
              <EmptyState
                isLoading={isContactsRefetch}
                error={contactsError}
                emptyMessage="No data available"
              />
            }
            accessibilityLabel="List of call history"
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default React.memo(SessionsScreen);

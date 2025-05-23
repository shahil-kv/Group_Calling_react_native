import { useAuth } from '@/contexts/AuthContext';
import { useGet } from '@/hooks/useApi';
import { OverviewData } from '@/types/report.type';
import React, { useMemo } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { BarChart, PieChart } from './Chart';
import { AnalyticCard } from './ReportsCard';

const OverView = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const stableUserId = useMemo(() => (user?.id != null ? Number(user.id) : 0), [user?.id]);

  const { data: analyticsData } = useGet<{ data: OverviewData }>(
    'report/getOverview',
    { userId: stableUserId },
    {
      showErrorToast: true,
      showSuccessToast: false,
      showLoader: true,
      enabled: stableUserId > 0,
    }
  );

  if (!analyticsData?.data) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-text-primary">No data available</Text>
      </View>
    );
  }

  const { overview, weeklyActivity, callStatus } = analyticsData.data as any;

  return (
    <ScrollView className="flex-1">
      <View className="flex-row justify-between px-4">
        <AnalyticCard
          title="Total Calls"
          value={overview.totalCalls}
          changePercent={overview.callsChangePercent}
          period="from last month"
        />
        <AnalyticCard
          title="Total Recipients"
          value={overview.totalRecipients}
          changePercent={overview.recipientsChangePercent}
          period="from last month"
        />
      </View>

      <View className="p-4 mx-4 my-4 shadow-sm bg-background-secondary rounded-xl shadow-black/5">
        <Text className="mb-4 text-lg font-semibold text-text-primary">Weekly Activity</Text>
        <BarChart data={weeklyActivity} width={Dimensions.get('window').width - 40} height={200} />
      </View>

      <View className="p-4 mx-4 my-4 rounded-lg shadow-sm h-min bg-background-secondary">
        <Text className="mb-2 text-base font-semibold text-text-secondary">Call Status</Text>
        <View className="flex-col">
          <PieChart
            data={[
              { value: callStatus.answered, color: '#6C5CE7', label: 'Answered' },
              { value: callStatus.failed, color: '#00CEC9', label: 'Failed' },
              { value: callStatus.missed, color: '#FF7675', label: 'Missed' },
            ]}
          />
          <View className="ml-4">
            <View className="flex-row items-center justify-center mb-2">
              <View className="w-4 h-4 mr-2 rounded-full bg-violet-600" />
              <Text className="text-sm text-text-secondary">Answered: {callStatus.answered}%</Text>
            </View>
            <View className="flex-row items-center justify-center mb-2">
              <View className="w-4 h-4 mr-2 rounded-full bg-cyan-400" />
              <Text className="text-sm text-text-secondary">Failed: {callStatus.failed}%</Text>
            </View>
            <View className="flex-row items-center justify-center mb-2">
              <View className="w-4 h-4 mr-2 rounded-full bg-rose-400" />
              <Text className="text-sm text-text-secondary">Missed: {callStatus.missed}%</Text>
            </View>
          </View>
        </View>
      </View>
      <View className="h-4" />
    </ScrollView>
  );
};

export default OverView;

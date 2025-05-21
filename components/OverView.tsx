import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import { BarChart, PieChart } from './Chart';
import { AnalyticCard } from './ReportsCard';

const OverView = ({ analyticsData }: any) => {
  return (
    <>
      <View className="flex-row justify-between px-4">
        <AnalyticCard
          title="Total Calls"
          value={analyticsData.overview.totalCalls}
          changePercent={analyticsData.overview.callsChangePercent}
          period="from last month"
        />
        <AnalyticCard
          title="Total Recipients"
          value={analyticsData.overview.totalRecipients}
          changePercent={analyticsData.overview.recipientsChangePercent}
          period="from last month"
        />
      </View>

      <View className="p-4 mx-4 my-4 shadow-sm bg-background-secondary rounded-xl shadow-black/5">
        <Text className="mb-4 text-lg font-semibold text-text-primary">Weekly Activity</Text>
        <BarChart
          data={analyticsData.weeklyActivity}
          width={Dimensions.get('window').width - 40}
          height={200}
        />
      </View>

      <View className="p-4 mx-4 my-4 rounded-lg shadow-sm h-min bg-background-secondary">
        <Text className="mb-2 text-base font-semibold text-text-secondary">Call Status</Text>
        <View className="flex-col">
          <PieChart
            data={[
              {
                value: analyticsData.callStatus.answered,
                color: '#6C5CE7',
                label: 'Answered',
              },
              {
                value: analyticsData.callStatus.voicemail,
                color: '#00CEC9',
                label: 'Voicemail',
              },
              { value: analyticsData.callStatus.missed, color: '#FF7675', label: 'Missed' },
            ]}
          />
          <View className="ml-4">
            <View className="flex-row items-center justify-center mb-2">
              <View className="w-4 h-4 mr-2 rounded-full bg-violet-600" />
              <Text className="text-sm text-text-secondary">
                Answered: {analyticsData.callStatus.answered}%
              </Text>
            </View>
            <View className="flex-row items-center justify-center mb-2">
              <View className="w-4 h-4 mr-2 rounded-full bg-cyan-400" />
              <Text className="text-sm text-text-secondary">
                Voicemail: {analyticsData.callStatus.voicemail}%
              </Text>
            </View>
            <View className="flex-row items-center justify-center mb-2">
              <View className="w-4 h-4 mr-2 rounded-full bg-rose-400" />
              <Text className="text-sm text-text-secondary">
                Missed: {analyticsData.callStatus.missed}%
              </Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

export default OverView;

import History from '@/components/History';
import OverView from '@/components/OverView';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

//tab button
const TabButton = ({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    className={`flex-1 p-2 rounded-lg items-center justify-center ${active ? 'bg-secondary' : ''}`}
  >
    <Text className={`text-sm ${active ? 'text-white' : 'text-text-primary'}`}>{title}</Text>
  </Pressable>
);

const enum Tabs {
  Overview = 'Overview',
  History = 'History',
}

export default function AnalyticsScreen() {
  const [activeTab, setActiveTab] = useState(Tabs.History);
  return (
    <SafeAreaView className="flex-1 bg-background-primary" edges={['top', 'left', 'right']}>
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-text-primary">Reports</Text>
        <Text className="text-text-secondary mt-1">
          Unlock insights to boost calls and connect with groups effortlessly.
        </Text>
      </View>
      <View className="flex-row justify-between p-1 mx-4 my-2 rounded-lg bg-background-secondary">
        <TabButton
          title={Tabs.History}
          active={activeTab === Tabs.History}
          onPress={() => setActiveTab(Tabs.History)}
        />
        <TabButton
          title={Tabs.Overview}
          active={activeTab === Tabs.Overview}
          onPress={() => setActiveTab(Tabs.Overview)}
        />
      </View>
      {activeTab === Tabs.Overview ? <OverView /> : <History />}
    </SafeAreaView>
  );
}

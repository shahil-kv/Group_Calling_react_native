import { BarChart, PieChart } from '@/components/Chart';
import { AnalyticCard, GroupPerformanceCard } from '@/components/ReportsCard';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';


const TabButton = ({ title, active, onPress }: { title: string; active: boolean; onPress: () => void }) => (
    <Pressable
        onPress={onPress} className={`flex-1 p-2 rounded-lg items-center justify-center ${active ? 'bg-secondary' : ''}`}
    >
        <Text className={`text-sm ${active ? 'text-white' : 'text-text-primary'}`}>{title}</Text>
    </Pressable>
);

export default function AnalyticsScreen() {
    const [activeTab, setActiveTab] = useState('Overview');
    const router = useRouter();
    const opacity = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 500 });
    }, []);

    const navigateToGroupDetails = useCallback((groupId: number, groupName: string) => {
        router.push({
            pathname: '/',
            params: { groupId, groupName }
        });
    }, [router]);

    const renderTabContent = () => {
        const analyticsData = {
            overview: {
                totalCalls: 29,
                callsChangePercent: 12,
                totalRecipients: 143,
                recipientsChangePercent: 8
            },
            weeklyActivity: [
                { label: 'Mon', value: 45, color: '#6C5CE7' },
                { label: 'Tue', value: 87, color: '#6C5CE7' },
                { label: 'Wed', value: 32, color: '#6C5CE7' },
                { label: 'Thu', value: 76, color: '#6C5CE7' },
                { label: 'Fri', value: 24, color: '#6C5CE7' },
                { label: 'Sat', value: 11, color: '#6C5CE7' },
                { label: 'Sun', value: 38, color: '#6C5CE7' }
            ],
            callStatus: {
                answered: 65,
                voicemail: 25,
                missed: 10
            },
            activity: {
                avgCallDuration: 42,
                durationChangePercent: 5,
                busiestTimeOfDay: '2-4 PM'
            },
            callVolumeByHour: [
                { label: '8am', value: 12, color: '#6C5CE7' },
                { label: '10am', value: 28, color: '#6C5CE7' },
                { label: '12pm', value: 18, color: '#6C5CE7' },
                { label: '2pm', value: 48, color: '#6C5CE7' },
                { label: '4pm', value: 36, color: '#6C5CE7' },
                { label: '6pm', value: 14, color: '#6C5CE7' }
            ],
            dayOfWeekPerformance: [
                { label: 'Mon', value: 62, color: '#6C5CE7' },
                { label: 'Tue', value: 78, color: '#6C5CE7' },
                { label: 'Wed', value: 54, color: '#6C5CE7' },
                { label: 'Thu', value: 69, color: '#6C5CE7' },
                { label: 'Fri', value: 42, color: '#6C5CE7' },
                { label: 'Sat', value: 18, color: '#6C5CE7' },
                { label: 'Sun', value: 25, color: '#6C5CE7' }
            ],
            engagement: {
                overallRate: 72,
                rateChangePercent: 4,
                keypressRate: '56%',
                keypressChangePercent: 7
            },
            topGroups: [
                { id: 1, name: 'Sales Leads', engagementRate: 84, callCount: 56 },
                { id: 2, name: 'Support Team', engagementRate: 76, callCount: 42 },
                { id: 3, name: 'Marketing', engagementRate: 68, callCount: 37 }
            ],
            responseDistribution: {
                pressed1: 56,
                pressed2: 32,
                other: 12
            }
        };

        switch (activeTab) {
            case 'Overview':
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

                        <View className='p-4 mx-4 my-4 shadow-sm bg-background-secondary rounded-xl shadow-black/5'>
                            <Text className='mb-4 text-lg font-semibold text-text-primary'>Weekly Activity</Text>
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
                                        { value: analyticsData.callStatus.answered, color: '#6C5CE7', label: 'Answered' },
                                        { value: analyticsData.callStatus.voicemail, color: '#00CEC9', label: 'Voicemail' },
                                        { value: analyticsData.callStatus.missed, color: '#FF7675', label: 'Missed' },
                                    ]}
                                />
                                <View className="ml-4">
                                    <View className="flex-row items-center justify-center mb-2">
                                        <View className="w-4 h-4 mr-2 rounded-full bg-violet-600" />
                                        <Text className="text-sm text-text-secondary">Answered: {analyticsData.callStatus.answered}%</Text>
                                    </View>
                                    <View className="flex-row items-center justify-center mb-2">
                                        <View className="w-4 h-4 mr-2 rounded-full bg-cyan-400" />
                                        <Text className="text-sm text-text-secondary">Voicemail: {analyticsData.callStatus.voicemail}%</Text>
                                    </View>
                                    <View className="flex-row items-center justify-center mb-2">
                                        <View className="w-4 h-4 mr-2 rounded-full bg-rose-400" />
                                        <Text className="text-sm text-text-secondary">Missed: {analyticsData.callStatus.missed}%</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </>
                );
            case 'Activity':
                return (
                    <>
                        <View className='flex flex-row justify-between px-4 pt-2 pb-4'>
                            <AnalyticCard
                                title="Avg. Call Duration"
                                value={`${analyticsData.activity.avgCallDuration}s`}
                                changePercent={analyticsData.activity.durationChangePercent}
                                period="from last month"
                            />
                            <AnalyticCard
                                title="Busiest Time"
                                value={analyticsData.activity.busiestTimeOfDay}
                                changeText="Consistent with last month"
                            />
                        </View>

                        <View className='p-4 mx-4 mb-4 shadow-sm bg-background-secondary rounded-xl shadow-black/5'>
                            <Text className='mb-4 text-lg font-semibold text-text-primary'>Call Volume by Hour</Text>
                            <BarChart
                                data={analyticsData.callVolumeByHour}
                                width={Dimensions.get('window').width - 40}
                                height={200}
                            />
                        </View>

                        <View className='p-4 mx-4 mb-4 shadow-sm bg-background-secondary rounded-xl shadow-black/5'>
                            <Text className='mb-4 text-lg font-semibold text-text-primary'>Day of Week Performance</Text>
                            <BarChart
                                data={analyticsData.dayOfWeekPerformance}
                                width={Dimensions.get('window').width - 40}
                                height={200}
                            />
                        </View>
                    </>
                );
            case 'Engagement':
                return (
                    <>
                        <View className='flex flex-row justify-between px-4 pt-2 pb-4'>
                            <AnalyticCard
                                title="Engagement Rate"
                                value={`${analyticsData.engagement.overallRate}%`}
                                changePercent={analyticsData.engagement.rateChangePercent}
                                period="from last month"
                            />
                            <AnalyticCard
                                title="Keypress Action"
                                value={analyticsData.engagement.keypressRate}
                                changePercent={analyticsData.engagement.keypressChangePercent}
                                period="from last month"
                            />
                        </View>

                        <View className='p-4 mx-4 mb-4 shadow-sm bg-background-secondary rounded-xl shadow-black/5'>
                            <Text className='mb-4 text-lg font-semibold text-text-primary'>Top Performing Groups</Text>
                            {analyticsData.topGroups.map((group) => (
                                <GroupPerformanceCard
                                    key={group.id}
                                    group={group}
                                    onPress={() => navigateToGroupDetails(group.id, group.name)}
                                />
                            ))}
                        </View>

                        <View className='p-4 mx-4 mb-4 shadow-sm bg-background-secondary rounded-xl shadow-black/5'>
                            <Text className='mb-4 text-lg font-semibold text-text-primary'>User Response Distribution</Text>
                            <View className='flex flex-row justify-around py-4'>
                                <View className='items-center text-center'>
                                    <Text className='mb-1 text-2xl font-bold text-primary'>{analyticsData.responseDistribution.pressed1}%</Text>
                                    <Text className='text-sm text-secondary'>Pressed "1"</Text>
                                </View>
                                <View className='items-center text-center'>
                                    <Text className='mb-1 text-2xl font-bold text-primary'>{analyticsData.responseDistribution.pressed2}%</Text>
                                    <Text className='text-sm text-secondary'>Pressed "2"</Text>
                                </View>
                                <View className='items-center text-center'>
                                    <Text className='mb-1 text-2xl font-bold text-primary'>{analyticsData.responseDistribution.other}%</Text>
                                    <Text className='text-sm text-secondary'>Other</Text>
                                </View>
                            </View>
                        </View>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <SafeAreaView className="flex flex-col flex-1 bg-background-primary">
            <View className='px-4 pt-4 pb-2'>
                <Text className="text-2xl font-bold text-text-primary">Reports</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="px-4 text-text-secondary">Unlock insights to boost calls and connect with groups effortlessly.</Text>
                <Animated.View className='px-4 pb-2' style={[animatedStyle]}>
                    <View className='flex flex-row justify-between p-1 my-2 rounded-lg bg-background-secondary'>
                        <TabButton
                            title="Overview"
                            active={activeTab === 'Overview'}
                            onPress={() => setActiveTab('Overview')}
                        />
                        <TabButton
                            title="Activity"
                            active={activeTab === 'Activity'}
                            onPress={() => setActiveTab('Activity')}
                        />
                        <TabButton
                            title="Engagement"
                            active={activeTab === 'Engagement'}
                            onPress={() => setActiveTab('Engagement')}
                        />
                    </View>
                </Animated.View>

                {renderTabContent()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#ECEEF1',
        borderRadius: 8,
        padding: 4,
        marginVertical: 8,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTabButton: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    tabButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeTabButtonText: {
        color: '#6C5CE7',
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 8,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusLegend: {
        flex: 1,
        paddingLeft: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 14,
        color: '#333',
    },
    responseDistribution: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
    },
    responseItem: {
        alignItems: 'center',
    },
    responseValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#6C5CE7',
        marginBottom: 4,
    },
    responseLabel: {
        fontSize: 14,
        color: '#666',
    },
});

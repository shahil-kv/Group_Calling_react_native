import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome';

type AnalyticCardProps = {
    title: string;
    value: string | number;
    changePercent?: number;
    changeText?: string;
    period?: string;
    valueUnit?: string;
};

export const AnalyticCard = ({ title, value, changePercent, changeText, period, valueUnit }: AnalyticCardProps) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(10);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ translateY: translateY.value }],
        };
    });

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 500 });
        translateY.value = withTiming(0, { duration: 500 });
    }, []);

    return (
        <Animated.View style={animatedStyle} className="flex-1 p-4 mx-1 shadow bg-background-secondary rounded-xl">
            <Text className="mb-1 text-sm text-text-secondary">{title}</Text>
            <Text className="mb-2 text-2xl font-bold text-text-primary">{value}{valueUnit}</Text>
            {(changePercent !== undefined || changeText) && (
                <View className="mt-auto">
                    {changePercent !== undefined && (
                        <View className="flex-row items-center">
                            {changePercent > 0 ? (
                                <Icon name="arrow-up" size={14} color="#10B981" />
                            ) : changePercent < 0 ? (
                                <Icon name="arrow-down" size={14} color="#EF4444" />
                            ) : null}
                            <Text
                                className={`text-sm font-medium ${changePercent > 0
                                    ? 'text-green-500'
                                    : changePercent < 0
                                        ? 'text-red-500'
                                        : 'text-text-secondary'
                                    }`}
                            >
                                {changePercent > 0 ? '+' : ''}{changePercent}%
                            </Text>
                        </View>
                    )}
                    {changeText && <Text className="text-xs text-text-secondary mt-0.5">{changeText}</Text>}
                    {period && <Text className="text-xs text-text-secondary mt-0.5">{period}</Text>}
                </View>
            )}
        </Animated.View>
    );
};

type GroupPerformanceCardProps = {
    group: {
        id: number;
        name: string;
        engagementRate: number;
        callCount: number;
    };
    onPress: () => void;
};

export const GroupPerformanceCard = ({ group, onPress }: GroupPerformanceCardProps) => {
    return (
        <Pressable
            className="flex-row items-center justify-between py-3 border-b border-gray-100"
            onPress={onPress}
        >
            <View className="flex-1">
                <Text className="mb-1 text-base font-semibold text-text-primary">{group.name}</Text>
                <Text className="text-sm text-text-secondary">
                    {group.callCount} calls • {group.engagementRate}% engagement
                </Text>
            </View>
            <Icon name="chevron-right" size={20} color="#6C5CE7" />
        </Pressable>
    );
};

type EngagementBreakdownProps = {
    answered: number;
    voicemail: number;
    missed: number;
};

export const EngagementBreakdown = ({ answered, voicemail, missed }: EngagementBreakdownProps) => {
    return (
        <View className="flex-1 pl-4">
            <View className="flex-row items-center mb-2">
                <View className="w-3 h-3 mr-2 rounded-full bg-violet-600" />
                <Text className="mr-auto text-sm text-gray-800">Answered</Text>
                <Text className="text-sm font-semibold text-gray-800">{answered}%</Text>
            </View>

            <View className="flex-row items-center mb-2">
                <View className="w-3 h-3 mr-2 rounded-full bg-cyan-400" />
                <Text className="mr-auto text-sm text-gray-800">Voicemail</Text>
                <Text className="text-sm font-semibold text-gray-800">{voicemail}%</Text>
            </View>

            <View className="flex-row items-center mb-2">
                <View className="w-3 h-3 mr-2 rounded-full bg-rose-400" />
                <Text className="mr-auto text-sm text-gray-800">Missed</Text>
                <Text className="text-sm font-semibold text-gray-800">{missed}%</Text>
            </View>
        </View>
    );
};
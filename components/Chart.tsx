import React, { memo } from 'react';
import { Dimensions, useColorScheme, View } from 'react-native';
import { BarChart as GiftedBarChart, PieChart as GiftedPieChart } from 'react-native-gifted-charts';

type BarChartProps = {
    data: {
        label: string;
        value: number;
        color?: string;
    }[];
    width?: number;
    height?: number;
};

export const BarChart = memo(({ data, width = Dimensions.get('window').width, height = 200 }: BarChartProps) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const textColor = isDark ? '#CBD5E1' : '#4F46E5';
    const barWidth = (width - 60) / data.length - 8;

    return (
        <View className="flex items-center justify-center p-3 overflow-scroll" >
            <GiftedBarChart
                data={data.map((item) => ({
                    value: item.value,
                    label: item.label,
                    frontColor: item.color || '#6C5CE7',
                }))}
                width={width - 70}
                height={height}
                dashWidth={12}
                barWidth={barWidth}
                spacing={4}
                initialSpacing={10}
                roundedTop
                hideRules
                xAxisColor={textColor}
                yAxisColor={textColor}
                yAxisTextStyle={{ color: textColor }}
                xAxisThickness={1}
                yAxisThickness={1}
                xAxisLabelTextStyle={{ color: textColor, textAlign: 'center' }}
                noOfSections={5}
                animationDuration={800}
                adjustToWidth
            />
        </View>
    );
});

type PieChartProps = {
    data: {
        value: number;
        color: string;
        label: string;
    }[];
    size?: number;
};

export const PieChart = memo(({ data, size = 200 }: PieChartProps) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const textColor = isDark ? '#CBD5E1' : '#4F46E5';

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <View className="items-center justify-center p-4">
            <GiftedPieChart
                data={data.map((item) => ({
                    value: item.value,
                    color: item.color,
                    text: `${Math.round((item.value / total) * 100)}%`,
                    textSize: 0,
                    textColor: textColor,
                    textFontFamily: 'System',
                }))}
                labelLineConfig={{
                    color: textColor,
                }}
                backgroundColor='transparent'
                radius={size / 2}
                innerRadius={size / 2 - size * 0.2}
                donut
                animationDuration={800}
                showText={false}
            />
        </View>
    );
});

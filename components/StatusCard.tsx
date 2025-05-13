import { LinearGradient } from 'expo-linear-gradient';
import 'nativewind';
import React, { ReactNode, useEffect } from 'react';
import { ColorValue, Dimensions, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedView = Animated.createAnimatedComponent(View);

interface StatusCardProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  status: ReactNode;
  className?: string;
  gradientColors?: [ColorValue, ColorValue, ...ColorValue[]];
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

const StatusCard = ({
  title,
  actionLabel,
  onAction,
  status,
  className,
  gradientColors,
  variant = 'primary'
}: StatusCardProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Default gradient colors from the original component
  const defaultGradientColors: Record<string, [ColorValue, ColorValue, ...ColorValue[]]> = {
    primary: ['#4F46E5', '#8B5CF6', '#EC4899', '#3B82F6'],
    secondary: ['#8B5CF6', '#3B82F6'],
    success: ['#22C55E', '#10B981'],
    warning: ['#F59E0B', '#FB923C'],
    error: ['#EF4444', '#FB7185'],
    info: ['#3B82F6', '#60A5FA']
  };

  // Use the provided gradient colors, or fall back to variant colors
  const colors = gradientColors || defaultGradientColors[variant];

  // Animation values
  const progress = useSharedValue(0);
  const shimmerValue = useSharedValue(0);
  const highlightPosition = useSharedValue(-SCREEN_WIDTH);

  // Derived gradient rotation value
  const gradientRotation = useDerivedValue(() => {
    return interpolate(
      progress.value,
      [0, 10],
      [0, 360]
    );
  });

  useEffect(() => {
    // Animate gradient rotation
    progress.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.linear }),
      -1, // infinite loop
      false
    );

    // Animate shimmer effect
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite loop
      true // reverse
    );

    // Animate highlight sweep
    highlightPosition.value = withRepeat(
      withDelay(
        1000,
        withTiming(SCREEN_WIDTH * 2, { duration: 2000, easing: Easing.out(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  // Container animation style
  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        shimmerValue.value,
        [0, 0.5, 1],
        [0.95, 1, 0.95]
      ),
      transform: [{
        scale: interpolate(
          shimmerValue.value,
          [0, 0.5, 1],
          [1, 1.02, 1]
        )
      }],
      shadowOpacity: interpolate(
        shimmerValue.value,
        [0, 0.5, 1],
        [0.3, 0.5, 0.3]
      )
    };
  });

  // Gradient positioning based on rotation
  const getGradientCoords = () => {
    // Convert rotation to radians
    const rotation = (gradientRotation.value * Math.PI) / 180;

    return {
      start: {
        x: 0.5 + 0.5 * Math.cos(rotation),
        y: 0.5 + 0.5 * Math.sin(rotation)
      },
      end: {
        x: 0.5 - 0.5 * Math.cos(rotation),
        y: 0.5 - 0.5 * Math.sin(rotation)
      }
    };
  };

  // Highlight sweep effect
  const highlightStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: highlightPosition.value,
      top: -100,
      width: 60,
      height: 350,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      transform: [{ rotate: '25deg' }],
      opacity: 0.7,
      zIndex: 10
    };
  });

  return (
    <Animated.View
      style={containerStyle}
      className={`overflow-hidden rounded-lg mx-5 shadow-xl ${className || ''}`}
    >
      <View className="relative p-5 rounded-lg">
        {/* Animated background gradient */}
        <AnimatedLinearGradient
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          colors={colors}
          start={getGradientCoords().start}
          end={getGradientCoords().end}
        />

        {/* Glass overlay for depth */}
        <View
          className="absolute top-0 bottom-0 left-0 right-0 bg-white/5"
        />

        {/* Moving highlight effect */}
        <AnimatedView style={highlightStyle} />

        {/* Border glow */}
        <View className="absolute inset-0 border rounded-lg border-white/20" />

        {/* Card content */}
        <View className="z-10 flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-white drop-shadow-md">{title}</Text>
          {actionLabel && onAction && (
            <TouchableOpacity
              className="px-3 py-1 border rounded-full bg-white/20 backdrop-blur-lg border-white/30"
              onPress={onAction}
              style={{
                shadowColor: "#fff",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.2,
                shadowRadius: 5,
                elevation: 5
              }}
            >
              <Text className="text-xs font-bold text-white">{actionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Divider with glow */}
        <View className="bg-white/30 h-[1] mb-3 shadow-sm shadow-white" />

        {/* Status content */}
        <View className="z-10">
          {status}
        </View>
      </View>
    </Animated.View>
  );
};

export default StatusCard;
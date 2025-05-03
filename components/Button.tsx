import React from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  ...props
}: ButtonProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case "primary":
        return "bg-primary";
      case "secondary":
        return "bg-secondary";
      case "outline":
        return "bg-transparent border border-primary";
      case "danger":
        return "bg-error";
      default:
        return "bg-primary";
    }
  };

  const getTextColor = () => {
    if (variant === "outline") {
      return "text-primary";
    }
    return "text-white";
  };

  const getSizeStyle = () => {
    switch (size) {
      case "sm":
        return "py-2 px-3";
      case "md":
        return "py-3 px-4";
      case "lg":
        return "py-4 px-5";
      default:
        return "py-3 px-4";
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "md":
        return "text-base";
      case "lg":
        return "text-lg";
      default:
        return "text-base";
    }
  };

  return (
    <TouchableOpacity
      className={`
        ${getVariantStyle()} 
        ${getSizeStyle()} 
        rounded-lg 
        items-center 
        justify-center 
        flex-row
        ${fullWidth ? "w-full" : ""}
        ${disabled || loading ? "opacity-50" : ""}
      `}
      disabled={disabled || loading}
      style={style}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? "#1E3A8A" : "#FFFFFF"}
          size="small"
        />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={`${getTextColor()} ${getTextSize()} font-medium`}>
            {title}
          </Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

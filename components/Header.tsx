import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../app/context/ThemeContext";

type HeaderProps = {
  title: string;
  onSettingsPress?: () => void;
  showBackButton?: boolean;
};

export default function Header({
  title,
  onSettingsPress,
  showBackButton = true,
}: HeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();
  
  return (
    <View
      className="w-full flex-row items-end justify-between px-4 pt-14 pb-10"
      style={{ backgroundColor: colors.primary }}
    >
      <View className="flex-row items-center">
        {showBackButton && (
          <TouchableOpacity
            className="p-2 mr-2 rounded-full"
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
        )}
        <Text className="text-2xl font-extrabold text-white">{title}</Text>
      </View>
      <TouchableOpacity
        className="p-2 rounded-full"
        onPress={onSettingsPress}
        activeOpacity={0.7}
      >
        <MaterialIcons name="settings" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

import React, { useEffect } from "react";
import { Text, View, SafeAreaView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Header from "../components/Header";
import { useServer } from "./context/ServerContext";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import "./global.css";

export default function App() {
  const router = useRouter();
  const { connectedServer, disconnectFromServer, isMobileEnabled } = useServer();
  const { user, isAuthenticated, logout } = useAuth();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    // POS bağlantısı yoksa veya kullanıcı girişi yoksa login ekranına yönlendir
    if (!connectedServer || !isAuthenticated) {
      // Root Layout'un mount olmasını beklemek için küçük bir gecikme ekle
      const timer = setTimeout(() => {
        router.replace("/login");
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [connectedServer, isAuthenticated]);
  
  const handleLogout = () => {
    logout();
    disconnectFromServer();
  };
  return (
    <View 
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <Header
        title={user?.waiter ? `Garson: ${user.waiter.name}` : "Mobil Garson"}
        onSettingsPress={() => router.push('/settings')}
        showBackButton={false}
      />
      {/* Oval içerik header'ın üzerinde */}
      <View
        className="flex-1 items-center justify-center w-full rounded-3xl"
        style={{ 
          marginTop: -32,
          backgroundColor: colors.background 
        }}
      >
        {/* Garson Bilgi Kartı */}
        {user?.waiter && (
          <View className="bg-brandOrange rounded-2xl p-4 mb-6 mx-6">
            <View className="flex-row items-center">
              <View className="bg-white rounded-full p-3 mr-4">
                <MaterialIcons name="person" size={24} color="#FF7F00" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-bold">
                  {user.waiter.name}
                </Text>
                <Text className="text-white opacity-90 text-sm">
                  ID: {user.waiter.id} • {user.waiter.isActive ? 'Aktif' : 'Pasif'}
                </Text>
              </View>
              {isMobileEnabled !== null && (
                <View className={`rounded-full px-3 py-1 ${
                  isMobileEnabled ? 'bg-green-500' : 'bg-yellow-500'
                }`}>
                  <Text className="text-white text-xs font-medium">
                    {isMobileEnabled ? 'Mobil Aktif' : 'Mobil Pasif'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        <Text 
          className="text-lg mb-8 mt-8"
          style={{ color: colors.text }}
        >
          Sipariş almak için hazır!
        </Text>
        <View className="w-full items-center">
          <View
            style={{ backgroundColor: colors.primary }}
            className="rounded-full shadow-lg"
          >
            <TouchableOpacity
              onPress={() => router.push("/screens/OrderScreen")}
              className=""
              activeOpacity={0.7}
            >
              <Text className="text-white text-lg px-8 py-3 font-semibold">
                Sipariş Al
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* POS ve Sistem Durumu */}
      <View className="absolute bottom-4 left-4 right-4">
        <View 
          className="rounded-lg shadow-lg p-3"
          style={{ backgroundColor: colors.surface }}
        >
          <View className="flex-row items-center justify-between">
            {/* POS Durumu */}
            <View className="flex-row items-center">
              <View className={`w-3 h-3 rounded-full mr-2 ${
                connectedServer ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <Text className={`text-sm font-medium ${
                connectedServer ? 'text-green-600' : 'text-red-600'
              }`}>
                {connectedServer ? `POS: ${connectedServer.ip}` : 'POS Yok'}
              </Text>
            </View>
            
            {/* Kullanıcı Durumu */}
            <View className="flex-row items-center">
              <MaterialIcons 
                name={user ? "account-circle" : "person-outline"} 
                size={16} 
                color={user ? "#10B981" : "#EF4444"} 
              />
              <Text className={`text-sm font-medium ml-1 ${
                user ? 'text-green-600' : 'text-red-600'
              }`}>
                {user?.waiter ? user.waiter.id : 'Giriş Yok'}
              </Text>
            </View>
            
            {/* Çıkış Butonu */}
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-red-500 rounded-full p-2"
            >
              <MaterialIcons name="logout" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

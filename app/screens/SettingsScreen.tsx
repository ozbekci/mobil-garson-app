import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { useTheme } from '../context/ThemeContext';
import { useServer } from '../context/ServerContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { theme, toggleTheme, isDark, colors } = useTheme();
  const { connectedServer, disconnectFromServer } = useServer();
  const { logout, currentUser } = useAuth();
  const router = useRouter();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Oturumu sonlandırmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleDisconnectServer = () => {
    Alert.alert(
      'Sunucu Bağlantısını Kes',
      'POS sisteminden ayrılmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Bağlantıyı Kes',
          style: 'destructive',
          onPress: () => {
            disconnectFromServer();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
      className="flex-row items-center p-4 mb-3 rounded-xl border"
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={{ backgroundColor: colors.primary }}
        className="w-10 h-10 rounded-full items-center justify-center mr-4"
      >
        <MaterialIcons name={icon as any} size={20} color="white" />
      </View>
      <View className="flex-1">
        <Text
          style={{ color: colors.text }}
          className="text-base font-semibold"
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{ color: colors.textSecondary }}
            className="text-sm mt-1"
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement && (
        <View className="ml-2">
          {rightElement}
        </View>
      )}
      {onPress && !rightElement && (
        <MaterialIcons 
          name="chevron-right" 
          size={24} 
          color={colors.textSecondary} 
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View 
      style={{ backgroundColor: colors.background }}
      className="flex-1"
    >
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.primary} 
      />
      
      <Header
        title="Ayarlar"
        onSettingsPress={() => router.back()}
        showBackButton={true}
      />
      
      <ScrollView 
        className="flex-1 px-6 py-8"
        style={{ marginTop: -32 }}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Kullanıcı Bilgileri */}
        {currentUser && (
          <View 
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
            className="p-4 mb-6 rounded-xl border"
          >
            <View className="flex-row items-center">
              <View
                style={{ backgroundColor: colors.primary }}
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
              >
                <MaterialIcons name="person" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text
                  style={{ color: colors.text }}
                  className="text-lg font-bold"
                >
                  {currentUser.name}
                </Text>
                <Text
                  style={{ color: colors.textSecondary }}
                  className="text-sm"
                >
                  ID: {currentUser.id}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Sunucu Bağlantı Durumu */}
        {connectedServer && (
          <View 
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
            className="p-4 mb-6 rounded-xl border"
          >
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="wifi" size={20} color={colors.success} />
              <Text
                style={{ color: colors.text }}
                className="text-base font-semibold ml-2"
              >
                Bağlı POS Sistemi
              </Text>
            </View>
            <Text
              style={{ color: colors.textSecondary }}
              className="text-sm"
            >
              {connectedServer.name}
            </Text>
            <Text
              style={{ color: colors.textSecondary }}
              className="text-xs"
            >
              {connectedServer.ip}:{connectedServer.port}
            </Text>
          </View>
        )}

        {/* Görünüm Ayarları */}
        <Text
          style={{ color: colors.text }}
          className="text-lg font-bold mb-4"
        >
          Görünüm
        </Text>

        <SettingItem
          icon="dark-mode"
          title="Koyu Tema"
          subtitle={`Şu an ${isDark ? 'koyu' : 'açık'} tema kullanılıyor`}
          rightElement={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDark ? '#fff' : '#f4f3f4'}
            />
          }
        />

        {/* Uygulama Ayarları */}
        <Text
          style={{ color: colors.text }}
          className="text-lg font-bold mb-4 mt-6"
        >
          Uygulama
        </Text>

        <SettingItem
          icon="notifications"
          title="Bildirimler"
          subtitle="Sipariş bildirimleri"
          rightElement={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          }
        />

        <SettingItem
          icon="volume-up"
          title="Sesler"
          subtitle="Uygulama sesleri"
          rightElement={
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={soundEnabled ? '#fff' : '#f4f3f4'}
            />
          }
        />

        {/* Hesap */}
        <Text
          style={{ color: colors.text }}
          className="text-lg font-bold mb-4 mt-6"
        >
          Hesap
        </Text>

        {connectedServer && (
          <SettingItem
            icon="wifi-off"
            title="Sunucu Bağlantısını Kes"
            subtitle="POS sisteminden ayrıl"
            onPress={handleDisconnectServer}
          />
        )}

        <SettingItem
          icon="logout"
          title="Çıkış Yap"
          subtitle="Oturumu sonlandır"
          onPress={handleLogout}
        />

        {/* Hakkında */}
        <Text
          style={{ color: colors.text }}
          className="text-lg font-bold mb-4 mt-6"
        >
          Hakkında
        </Text>

        <SettingItem
          icon="info"
          title="Sürüm"
          subtitle="1.0.0"
        />

        <SettingItem
          icon="help"
          title="Yardım"
          subtitle="Kullanım kılavuzu"
          onPress={() => Alert.alert('Yardım', 'Yardım özelliği yakında eklenecek.')}
        />
      </ScrollView>
    </View>
  );
}

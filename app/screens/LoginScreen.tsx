import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useServer } from "../context/ServerContext";
import { useAuth } from "../context/AuthContext";
import apiService, { Waiter } from "../services/ApiService";

interface POSServer {
  ip: string;
  port: number;
  name: string;
  status: "connected" | "disconnected" | "checking";
}

export default function LoginScreen() {
  const router = useRouter();
  const {
    availableServers,
    isScanning,
    scanForServers,
    connectToServer,
    connectToServerManually,
    connectedServer,
    isMobileEnabled,
    checkMobileFeature,
  } = useServer();
  
  const { waiterLogin, isLoading: authLoading } = useAuth();
  
  const [selectedServer, setSelectedServer] = useState<POSServer | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualIP, setManualIP] = useState('');
  const [manualPort, setManualPort] = useState('4000');
  
  // Garson girişi state'leri
  const [showWaiterLogin, setShowWaiterLogin] = useState(false);
  const [availableWaiters, setAvailableWaiters] = useState<Waiter[]>([]);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [waiterPin, setWaiterPin] = useState('');
  const [loadingWaiters, setLoadingWaiters] = useState(false);
  
  // IP input'unda virgülü noktaya çevir
  const handleIPChange = (text: string) => {
    const cleanText = text.replace(/,/g, '.');
    setManualIP(cleanText);
  };
  
  // Aktif garsonları çek
  const fetchActiveWaiters = async (serverInfo?: { ip: string, port: number }) => {
    const useServer = serverInfo || connectedServer;
    if (!useServer) {
      return;
    }
    
    setLoadingWaiters(true);
    
    try {
      const response = await apiService.getActiveWaiters();
      
      if (response.status === 200 && response.data) {
        // API response nested data yapısına göre düzelt
        const waitersData = response.data ;
        setAvailableWaiters(waitersData);
      } else {
        Alert.alert("Hata", "Garson listesi alınamadı: " + (response.error || "Bilinmeyen hata"));
        setAvailableWaiters([]);
      }
    } catch (error) {
      console.error('Garson listesi çekme hatası:', error);
      Alert.alert("Hata", "Garson listesi yüklenirken bir hata oluştu");
      setAvailableWaiters([]);
    } finally {
      setLoadingWaiters(false);
    }
  };
  
  // Garson girişi işlemleri
  const handleWaiterLogin = async () => {
    if (!selectedWaiter || !waiterPin.trim()) {
      Alert.alert("Hata", "Lütfen garson seçin ve PIN giriniz");
      return;
    }
    
    const result = await waiterLogin({
      waiterId: selectedWaiter.id,
      pin: waiterPin.trim()
    });
    
    if (result.success) {
      setShowWaiterLogin(false);
      setSelectedWaiter(null);
      setWaiterPin('');
      router.replace("/");
    } else {
      Alert.alert("Giriş Hatası", result.error || "Giriş başarısız");
    }
  };
  const screenHeight = Dimensions.get("window").height;

  useEffect(() => {
    // Ekran yüklendiginde otomatik tarama başlat (eğer daha önce bağlanmış server yoksa)
    if (!connectedServer && availableServers.length === 0) {
      // Küçük bir gecikme ile tarama başlat
      const timer = setTimeout(() => {
        scanForServers();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [connectedServer, availableServers.length]);

  const handleConnect = async () => {
    if (!selectedServer) {
      Alert.alert("Hata", "Lütfen bir POS sistemi seçin");
      return;
    }

    setConnecting(true);
    
    try {
      const success = await connectToServer(selectedServer);
      
      if (success) {
        // Bağlantı başarılı, garson listesini çek ve modal'i aç
        setTimeout(async () => {
          await fetchActiveWaiters(selectedServer);
          
          try {
            await checkMobileFeature(selectedServer);
          } catch (error) {
            console.error('Mobil özellik kontrolü sırasında hata:', error);
          }
          
          setShowWaiterLogin(true);
        }, 1000);
      } else {
        Alert.alert(
          "Bağlantı Hatası",
          "POS sistemine bağlanılamadı. Lütfen tekrar deneyin."
        );
      }
    } catch (error) {
      console.error('Bağlantı hatası:', error);
      Alert.alert("Hata", "Bağlantı kurulurken bir hata oluştu");
    } finally {
      setConnecting(false);
    }
  };

  const handleRefresh = () => {
    setSelectedServer(null);
    scanForServers();
  };

  const handleManualConnect = async () => {
    if (!manualIP.trim()) {
      Alert.alert("Hata", "IP adresi giriniz");
      return;
    }
    
    // iPhone'da virgül yerine nokta kullanımını düzelt
    const cleanIP = manualIP.replace(/,/g, '.');
    
    // IP format kontrolü
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(cleanIP)) {
      Alert.alert("Hata", "Geçerli bir IP adresi giriniz (örn: 192.168.1.103)");
      return;
    }
    
    const port = parseInt(manualPort) || 4000;
    setConnecting(true);
    setShowManualModal(false);
    
    try {
      const success = await connectToServerManually(cleanIP, port);
      if (success) {
        setManualIP('');
        setManualPort('4000');
        
        // Bağlantı başarılı, garson listesini çek ve modal'i aç
        setTimeout(async () => {
          await fetchActiveWaiters({ ip: cleanIP, port });
          // Mobil özellik durumunu kontrol et
          await checkMobileFeature({ ip: cleanIP, port });
          setShowWaiterLogin(true);
        }, 1000);
      } else {
        Alert.alert(
          "Bağlantı Hatası",
          "Belirtilen adrese bağlanılamadı. IP adresini ve port'u kontrol edin."
        );
      }
    } catch (error) {
      Alert.alert("Hata", "Bağlantı kurulurken bir hata oluştu");
    } finally {
      setConnecting(false);
    }
  };

  const renderServerItem = ({ item }: { item: POSServer }) => (
    <TouchableOpacity
      className={`w-full p-4 mb-3 rounded-xl border flex-row items-center justify-between ${
        selectedServer?.ip === item.ip
          ? "bg-brandOrange border-brandOrange"
          : "bg-white border-gray-300"
      }`}
      onPress={() => setSelectedServer(item)}
      disabled={isScanning}
    >
      <View className="flex-1">
        <Text
          className={`text-lg font-semibold ${
            selectedServer?.ip === item.ip ? "text-white" : "text-gray-800"
          }`}
        >
          {item.name}
        </Text>
        <Text
          className={`text-sm ${
            selectedServer?.ip === item.ip ? "text-white" : "text-gray-500"
          }`}
        >
          {item.ip}:{item.port}
        </Text>
      </View>
      <View className="flex-row items-center">
        <View
          className={`w-3 h-3 rounded-full mr-2 ${
            item.status === "connected"
              ? "bg-green-500"
              : item.status === "checking"
              ? "bg-yellow-500"
              : "bg-gray-400"
          }`}
        />
        {selectedServer?.ip === item.ip && (
          <MaterialIcons name="check" size={24} color="white" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor="#FF7F00" />
      
      {/* Header */}
      <View
        className="w-full items-center justify-end px-6 pb-8"
        style={{ 
          backgroundColor: "#FF7F00", 
          height: screenHeight * 0.25,
          paddingTop: StatusBar.currentHeight || 40 
        }}
      >
        <MaterialIcons name="restaurant" size={48} color="white" />
        <Text className="text-3xl font-bold text-white mt-4 mb-2">
          Mobil Garson
        </Text>
        <Text className="text-lg text-white opacity-90">
          POS Sistemi Bağlantısı
        </Text>
      </View>

      {/* Content */}
      <View 
        className="flex-1 bg-white rounded-t-3xl px-6 py-8"
        style={{ marginTop: -32 }}
      >
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-xl font-bold text-gray-800">
            Kullanılabilir POS Sistemleri
          </Text>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              className="bg-brandOrange p-3 rounded-full"
              onPress={() => setShowManualModal(true)}
              disabled={connecting}
            >
              <MaterialIcons 
                name="add" 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-100 p-3 rounded-full"
              onPress={handleRefresh}
              disabled={isScanning}
            >
              <MaterialIcons 
                name="refresh" 
                size={24} 
                color={isScanning ? "#9CA3AF" : "#374151"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {isScanning && (
          <View className="flex-row items-center justify-center py-8">
            <ActivityIndicator size="large" color="#FF7F00" />
            <Text className="ml-3 text-gray-600 text-base">
              Ağ taranıyor...
            </Text>
          </View>
        )}

        {!isScanning && availableServers.length === 0 && (
          <View className="items-center justify-center py-12">
            <MaterialIcons name="wifi-off" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg mt-4 text-center">
              POS sistemi bulunamadı
            </Text>
            <Text className="text-gray-400 text-sm mt-2 text-center">
              Ağ bağlantınızı kontrol edin ve tekrar deneyin
            </Text>
          </View>
        )}

        {availableServers.length > 0 && (
          <FlatList
            data={availableServers}
            keyExtractor={(item) => `${item.ip}:${item.port}`}
            renderItem={renderServerItem}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Connection Button */}
        {availableServers.length > 0 && (
          <View className="absolute bottom-0 left-0 right-0 bg-white px-6 py-6">
            <TouchableOpacity
              className={`w-full py-4 rounded-full flex-row items-center justify-center ${
                selectedServer && !connecting
                  ? "bg-brandOrange"
                  : "bg-gray-300"
              }`}
              onPress={handleConnect}
              disabled={!selectedServer || connecting}
            >
              {connecting ? (
                <>
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white text-lg font-bold ml-2">
                    Bağlanıyor...
                  </Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="wifi" size={24} color="white" />
                  <Text className="text-white text-lg font-bold ml-2">
                    Bağlan
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            {selectedServer && (
              <Text className="text-center text-gray-500 text-sm mt-3">
                Seçili: {selectedServer.name}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Manuel Bağlantı Modalı */}
      <Modal
        visible={showManualModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManualModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-black bg-opacity-50 justify-center items-center p-6">
            <ScrollView 
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
              keyboardShouldPersistTaps="handled"
            >
              <View className="bg-white rounded-2xl p-6 w-full max-w-sm mx-auto">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">
                Manuel Bağlantı
              </Text>
              <TouchableOpacity
                onPress={() => setShowManualModal(false)}
                className="p-2"
              >
                <MaterialIcons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <Text className="text-gray-600 mb-4">
              POS sisteminin IP adresini ve port numarasını girin:
            </Text>
            
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                IP Adresi
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-3 text-base"
                placeholder="192.168.1.103"
                value={manualIP}
                onChangeText={handleIPChange}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
            
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Port
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-3 text-base"
                placeholder="4000"
                value={manualPort}
                onChangeText={setManualPort}
                keyboardType="number-pad"
                returnKeyType="done"
              />
            </View>
            
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 py-3 rounded-lg"
                onPress={() => setShowManualModal(false)}
              >
                <Text className="text-center text-gray-800 font-semibold">
                  İptal
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 bg-brandOrange py-3 rounded-lg"
                onPress={handleManualConnect}
                disabled={!manualIP.trim()}
              >
                <Text className="text-center text-white font-semibold">
                  Bağlan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Garson Girişi Modalı */}
      <Modal
        visible={showWaiterLogin}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowWaiterLogin(false);
          setSelectedWaiter(null);
          setWaiterPin('');
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-black bg-opacity-50 justify-center items-center p-6">
            <ScrollView 
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
              keyboardShouldPersistTaps="handled"
            >
              <View className="bg-white rounded-2xl p-6 w-full max-w-sm mx-auto">
                <View className="items-center mb-6">
                  <View className="bg-brandOrange rounded-full p-4 mb-4">
                    <MaterialIcons name="people" size={32} color="white" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-800 mb-2">
                    Garson Seçimi
                  </Text>
                  <Text className="text-gray-600 text-center">
                    Lütfen garsonunuzu seçin{isMobileEnabled !== null && (
                      isMobileEnabled ? 
                        "" : 
                        "\n⚠️ Mobil özellik pasif"
                    )}
                  </Text>
                </View>
                
                {/* Garson Listesi */}
                {loadingWaiters ? (
                  <View className="items-center py-8">
                    <ActivityIndicator size="large" color="#FF7F00" />
                    <Text className="text-gray-600 mt-2">
                      Garsonlar yüklenyor...
                    </Text>
                  </View>
                ) : !availableWaiters || !Array.isArray(availableWaiters) || availableWaiters.length === 0 ? (
                  <View className="items-center py-8">
                    <MaterialIcons name="person-off" size={48} color="#9CA3AF" />
                    <Text className="text-gray-500 text-center mt-2">
                      Aktif garson bulunamadı
                    </Text>
                  </View>
                ) : (
                  <View className="mb-6">
                    <Text className="text-sm font-semibold text-gray-700 mb-3">
                      Aktif Garsonlar
                    </Text>
                    {Array.isArray(availableWaiters) && availableWaiters.map((waiter) => (
                      <TouchableOpacity
                        key={waiter.id}
                        className={`p-4 mb-3 rounded-xl border flex-row items-center justify-between ${
                          selectedWaiter?.id === waiter.id
                            ? "bg-brandOrange border-brandOrange"
                            : "bg-gray-50 border-gray-200"
                        }`}
                        onPress={() => setSelectedWaiter(waiter)}
                      >
                        <View className="flex-1">
                          <Text className={`text-base font-semibold ${
                            selectedWaiter?.id === waiter.id ? "text-white" : "text-gray-800"
                          }`}>
                            {waiter.name}
                          </Text>
                          <Text className={`text-sm ${
                            selectedWaiter?.id === waiter.id ? "text-white opacity-90" : "text-gray-500"
                          }`}>
                            ID: {waiter.id}
                          </Text>
                        </View>
                        {selectedWaiter?.id === waiter.id && (
                          <MaterialIcons name="check-circle" size={24} color="white" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                {/* PIN Girişi - Sadece garson seçildiğinde göster */}
                {selectedWaiter && (
                  <View className="mb-6">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      {selectedWaiter.name} - PIN Kodu
                    </Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-3 text-base"
                      placeholder="PIN kodunuzu girin"
                      value={waiterPin}
                      onChangeText={setWaiterPin}
                      keyboardType="number-pad"
                      secureTextEntry
                      returnKeyType="done"
                      onSubmitEditing={handleWaiterLogin}
                      autoFocus
                    />
                  </View>
                )}
                
                {isMobileEnabled === false && (
                  <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <View className="flex-row items-center">
                      <MaterialIcons name="warning" size={20} color="#F59E0B" />
                      <Text className="text-yellow-800 text-sm ml-2 flex-1">
                        Mobil özellik pasif. İşletme sahibinden aktifleştirmesini isteyiniz.
                      </Text>
                    </View>
                  </View>
                )}
                
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    className="flex-1 bg-gray-200 py-3 rounded-lg"
                    onPress={() => {
                      setShowWaiterLogin(false);
                      setSelectedWaiter(null);
                      setWaiterPin('');
                    }}
                    disabled={authLoading}
                  >
                    <Text className="text-center text-gray-800 font-semibold">
                      İptal
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg ${
                      (!selectedWaiter || !waiterPin.trim() || authLoading) 
                        ? "bg-gray-300" 
                        : "bg-brandOrange"
                    }`}
                    onPress={handleWaiterLogin}
                    disabled={!selectedWaiter || !waiterPin.trim() || authLoading}
                  >
                    {authLoading ? (
                      <View className="flex-row items-center justify-center">
                        <ActivityIndicator color="white" size="small" />
                        <Text className="text-white font-semibold ml-2">
                          Giriş Yapılıyor...
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-center text-white font-semibold">
                        Giriş Yap
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

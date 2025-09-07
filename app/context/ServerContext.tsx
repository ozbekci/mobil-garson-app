import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import apiService from '../services/ApiService';

interface POSServer {
  ip: string;
  port: number;
  name: string;
  status: 'connected' | 'disconnected' | 'checking';
}

interface ServerContextType {
  connectedServer: POSServer | null;
  availableServers: POSServer[];
  isScanning: boolean;
  isMobileEnabled: boolean | null;
  scanForServers: () => Promise<void>;
  connectToServer: (server: POSServer) => Promise<boolean>;
  connectToServerManually: (ip: string, port: number) => Promise<boolean>;
  disconnectFromServer: () => void;
  checkMobileFeature: () => Promise<boolean>;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

interface ServerProviderProps {
  children: ReactNode;
}

export function ServerProvider({ children }: ServerProviderProps) {
  const [connectedServer, setConnectedServer] = useState<POSServer | null>(null);
  const [availableServers, setAvailableServers] = useState<POSServer[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isMobileEnabled, setIsMobileEnabled] = useState<boolean | null>(null);

  // Local IP aralığını tespit et
  const getLocalIPRange = async (): Promise<string[]> => {
    const netInfo = await NetInfo.fetch();
    const localIP = netInfo.details?.ipAddress;
    
    if (!localIP) {
      // Varsayılan yaygın IP aralıkları
      return [
        '192.168.1',  // Bilinen server IP'si bu aralıkta
        '192.168.0', 
        '10.0.0',
        '172.16.0'
      ];
    }

    // Mevcut IP'den subnet çıkar
    const subnet = localIP.split('.').slice(0, 3).join('.');
    return [subnet];
  };

  // Belirli bir IP:port kombinasyonunu test et
  const testConnection = async (ip: string, port: number): Promise<boolean> => {
    const originalBaseUrl = apiService['baseUrl'];
    
    try {
      // ApiService'in baseUrl'ini geçici olarak ayarla
      apiService.setBaseUrl(`http://${ip}:${port}`);
      
      const response = await apiService.checkHealth();
      
      // BaseUrl'i geri yükle
      apiService.setBaseUrl(originalBaseUrl);
      
      return response.status === 200 && response.data?.ok === true;
    } catch (error) {
      // ApiService'in baseUrl'ini geri yükle
      apiService.setBaseUrl(originalBaseUrl);
      return false;
    }
  };

  // Ağı tarayıp kullanılabilir POS sunucularını bul
  const scanForServers = async (): Promise<void> => {
    setIsScanning(true);
    setAvailableServers([]);
    
    try {
      const ipRanges = await getLocalIPRange();
      const foundServers: POSServer[] = [];
      
      for (const range of ipRanges) {
        // Yaygın IP aralıklarından başla, sonra tamamını tara
        const commonIPs = [1, 100, 101, 102, 103, 104, 105, 150, 200, 254];
        const allIPs = Array.from({length: 254}, (_, i) => i + 1);
        const priorityIPs = [...new Set([...commonIPs, ...allIPs])];
        
        // Her seferinde sadece 5 paralel istek
        for (let j = 0; j < priorityIPs.length; j += 5) {
          const batch = priorityIPs.slice(j, j + 5);
          const batchPromises = batch.map(async (i) => {
            const ip = `${range}.${i}`;
            try {
              const isConnected = await testConnection(ip, 4000);
              if (isConnected) {
                const server: POSServer = {
                  ip,
                  port: 4000,
                  name: `POS Sistemi (${ip})`,
                  status: 'disconnected'
                };
                foundServers.push(server);
                
                // İlk sunucuyu bulduğumuzda güncelle
                setAvailableServers([...foundServers]);
              }
            } catch (error) {
              // Sessizce geç, log yapma
            }
          });
          
          await Promise.allSettled(batchPromises);
          
          // Kısa bekleme
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Eğer sunucu bulunmuşsa taramayı durdur
          if (foundServers.length > 0) {
            break;
          }
        }
        
        // İlk sunucuyu bulunca diğer range'leri tara
        if (foundServers.length > 0) {
          break;
        }
      }
      
      setAvailableServers(foundServers);
    } catch (error) {
      console.error('Sunucu tarama hatası:', error);
    } finally {
      setIsScanning(false);
    }
  };

  // Belirli bir sunucuya bağlan
  const connectToServer = async (server: POSServer): Promise<boolean> => {
    try {
      const isConnected = await testConnection(server.ip, server.port);
      
      if (isConnected) {
        const connectedServerData = { ...server, status: 'connected' as const };
        setConnectedServer(connectedServerData);
        
        // ApiService'in baseUrl'ini ayarla
        apiService.setBaseUrl(`http://${server.ip}:${server.port}`);
        
        // Mobil özellik durumunu kontrol et
        setTimeout(() => {
          checkMobileFeature();
        }, 500);
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Sunucu bağlantı hatası:', error);
      return false;
    }
  };

  // Manuel IP ile sunucuya bağlan
  const connectToServerManually = async (ip: string, port: number): Promise<boolean> => {
    try {
      const isConnected = await testConnection(ip, port);
      
      if (isConnected) {
        const server: POSServer = {
          ip,
          port,
          name: `POS Sistemi (${ip})`,
          status: 'connected'
        };
        setConnectedServer(server);
        
        // ApiService'in baseUrl'ini ayarla
        apiService.setBaseUrl(`http://${ip}:${port}`);
        
        // Manuel bağlanan sunucuyu available servers listesine ekle
        setAvailableServers(prev => {
          const exists = prev.find(s => s.ip === ip && s.port === port);
          if (!exists) {
            return [...prev, { ...server, status: 'disconnected' }];
          }
          return prev;
        });
        
        // Mobil özellik durumunu kontrol et
        setTimeout(() => {
          checkMobileFeature();
        }, 500);
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Manuel bağlantı hatası:', error);
      return false;
    }
  };

  // Mobil özellik durumunu kontrol et
  const checkMobileFeature = async (serverInfo?: { ip: string, port: number }): Promise<boolean> => {
    const useServer = serverInfo || connectedServer;
    if (!useServer) {
      setIsMobileEnabled(null);
      return false;
    }

    try {
      const baseUrl = `http://${useServer.ip}:${useServer.port}`;
      apiService.setBaseUrl(baseUrl);
      
      const response = await apiService.getMobileFeatureStatus();
      
      if (response.status === 200 && response.data) {
        // API response nested data yapısına göre düzelt
        const mobileData = response.data;
        const isEnabled = mobileData.mobileEnabled === true;
        setIsMobileEnabled(isEnabled);
        return isEnabled;
      } else {
        setIsMobileEnabled(false);
        return false;
      }
    } catch (error) {
      console.error('Mobil özellik kontrol hatası:', error);
      setIsMobileEnabled(false);
      return false;
    }
  };

  // Sunucu bağlantısını kes
  const disconnectFromServer = (): void => {
    setConnectedServer(null);
    setIsMobileEnabled(null);
    apiService.setBaseUrl('');
    apiService.setAuthToken(null);
  };

  const value: ServerContextType = {
    connectedServer,
    availableServers,
    isScanning,
    isMobileEnabled,
    scanForServers,
    connectToServer,
    connectToServerManually,
    disconnectFromServer,
    checkMobileFeature,
  };

  return (
    <ServerContext.Provider value={value}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServer(): ServerContextType {
  const context = useContext(ServerContext);
  if (context === undefined) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return context;
}

// Default export for Expo Router
export default ServerProvider;

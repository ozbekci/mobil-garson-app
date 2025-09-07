import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, RefreshControl } from 'react-native';
import { useWaiterAuthStore } from '../state/waiterAuthStore';
import { useOrdersStore } from '../state/ordersStore';
import { isVisibleToWaiter, Order } from '../types';
import { listActiveOrders } from '../api/endpoints';
import { connectSocket, disconnectSocket } from '../sockets/socket';

// Uses backend endpoint listActiveOrders

const OrdersScreen: React.FC<any> = ({ navigation }) => {
  const { session } = useWaiterAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listActiveOrders();
      setOrders(list.filter(isVisibleToWaiter));
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!session) {
      navigation.replace('Login');
      return;
    }
    connectSocket();
    load();
    return () => { disconnectSocket(); };
  }, [session]);

  return (
    <View style={{ flex:1, padding:16 }}>
      <Text style={{ fontSize:22, marginBottom:12 }}>Aktif Siparişler</Text>
      <FlatList
        data={orders}
        keyExtractor={o => String(o.id)}
        renderItem={({ item }) => (
          <View style={{ padding:12, borderWidth:1, borderRadius:8, marginBottom:10 }}>
            <Text>#{item.id} - {item.tableNumber || 'Paket'} - {item.status}</Text>
            <Text>Toplam: {item.total}</Text>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={!loading ? <Text>Görüntülenecek sipariş yok</Text> : null}
      />
      <Button title="Yenile" onPress={load} />
    </View>
  );
};

export default OrdersScreen;
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
import { useRouter } from "expo-router";
import Header from "../../components/Header";

const tables = [
  { id: 1, name: "Masa 1" },
  { id: 2, name: "Masa 2" },
  { id: 3, name: "Masa 3" },
  { id: 4, name: "Masa 4" },
  { id: 5, name: "Masa 5" },
];

export default function CompleteOrderScreen() {
  const router = useRouter();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  return (
    <View className="flex-1 bg-gray-50">
      <Header 
        title="Siparişi Tamamla" 
        onSettingsPress={() => router.push('/settings')}
        showBackButton={true} 
      />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-xl font-bold mb-6 text-gray-800">
          Masa Seçimi
        </Text>
        <FlatList
          data={tables}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`w-full py-4 mb-3 rounded-xl border ${selectedTable === item.id ? "bg-brandOrange border-brandOrange" : "bg-white border-gray-300"}`}
              onPress={() => setSelectedTable(item.id)}
            >
              <Text
                className={`text-lg text-center ${selectedTable === item.id ? "text-white font-bold" : "text-gray-800"}`}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity
          className={`mt-8 px-8 py-4 rounded-full w-full ${selectedTable ? "bg-brandOrange" : "bg-gray-300"}`}
          disabled={!selectedTable}
          onPress={() => {
            if (selectedTable) {
              alert(`Sipariş ${selectedTable}. masa için tamamlandı!`);
            }
          }}
        >
          <Text className="text-white text-lg font-bold text-center">
            Siparişi Tamamla
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

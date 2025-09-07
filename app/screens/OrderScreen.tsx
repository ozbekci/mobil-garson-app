import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Header from "../../components/Header";
import { useRouter } from "expo-router";
import apiService, { MenuItem } from "../services/ApiService";
import { useServer } from "../context/ServerContext";

export default function OrderScreen() {
  const router = useRouter();
  const { connectedServer } = useServer();

  // State'ler
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  type Product = MenuItem & { empty?: boolean };
  const [cart, setCart] = useState<Product[]>([]);
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  // Menü verilerini çek
  const fetchMenu = async () => {
    if (!connectedServer) {
      setError("Sunucu bağlantısı yok");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getMenu();

      if (response.status === 200 && response.data) {
        const menuData = response.data;

        setMenuItems(menuData.items || []);
        const allCategories = ["Tümü", ...(menuData.categories || [])];
        setCategories(allCategories);
      } else {
        setError(response.error || "Menü yüklenemedi");
      }
    } catch (error) {
      console.error("Menü yükleme hatası:", error);
      setError("Menü yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Component yüklenirken menü çek
  useEffect(() => {
    fetchMenu();
  }, [connectedServer]);

  // Kategori filtrelemesi
  const filteredItems =
    selectedCategory === "Tümü"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  // Grid için eksik ürünleri doldur
  const screenWidth = Dimensions.get("window").width;
  const columns = screenWidth >= 768 ? 3 : 2;
  const productGrid: Product[] = [...filteredItems];
  const remainder = productGrid.length % columns;
  if (remainder !== 0) {
    for (let i = 0; i < columns - remainder; i++) {
      productGrid.push({
        id: `empty-${i}`,
        name: "",
        price: 0,
        category: "",
        empty: true,
      });
    }
  }

  return (
    <View className="flex-1 bg-white">
      <Header
        title="Sipariş Alma"
        onSettingsPress={() => router.push('/settings')}
        showBackButton={true}
      />
      <View
        className="flex-1 rounded-3xl bg-gray-300 px-4 pt-8"
        style={{ marginTop: -32 }}
      >
        {/* Loading durumu */}
        {loading && (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#FF7F00" />
            <Text className="text-gray-600 mt-4 text-lg">
              Menü yükleniyor...
            </Text>
          </View>
        )}

        {/* Error durumu */}
        {error && !loading && (
          <View className="flex-1 justify-center items-center px-8">
            <MaterialIcons name="error" size={64} color="#EF4444" />
            <Text className="text-red-500 text-lg font-semibold mt-4 text-center">
              {error}
            </Text>
            <TouchableOpacity
              className="bg-brandOrange px-6 py-3 rounded-lg mt-4"
              onPress={fetchMenu}
            >
              <Text className="text-white font-semibold">Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Kategori butonları */}
        {!loading && !error && categories.length > 0 && (
          <View className="mb-6">
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item}
              contentContainerStyle={{ paddingHorizontal: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`px-4 py-2 mx-2 rounded-full ${
                    selectedCategory === item ? "bg-brandOrange" : "bg-white"
                  }`}
                  onPress={() => setSelectedCategory(item)}
                >
                  <Text
                    className={`font-medium ${
                      selectedCategory === item ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Boş menü durumu */}
        {!loading && !error && filteredItems.length === 0 && (
          <View className="flex-1 justify-center items-center px-8">
            <MaterialIcons name="restaurant-menu" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg font-semibold mt-4 text-center">
              {selectedCategory === 'Tümü' 
                ? 'Henüz menüde ürün bulunmuyor' 
                : `"${selectedCategory}" kategorisinde ürün bulunamadı`}
            </Text>
            <TouchableOpacity
              className="bg-brandOrange px-6 py-3 rounded-lg mt-4"
              onPress={fetchMenu}
            >
              <Text className="text-white font-semibold">Menüü Yenile</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Ürün listesi - responsive grid FlatList */}
        {!loading && !error && filteredItems.length > 0 && (
          <FlatList
            data={productGrid}
            keyExtractor={(item) => item.id.toString()}
            numColumns={columns}
            contentContainerStyle={{ gap: 12, paddingBottom: 200 }}
            renderItem={({ item }) => {
              if (item.empty) {
                return (
                  <View
                    style={{
                      flex: 1,
                      margin: 15,
                      aspectRatio: 1,
                      backgroundColor: "transparent",
                    }}
                  />
                );
              }
              const count = cart.filter(
                (cartItem) => cartItem.id === item.id
              ).length;
              return (
                <View
                  className="bg-white rounded-xl mb-4 p-4 items-center justify-center"
                  style={{ flex: 1, margin: 6, aspectRatio: 1 }}
                >
                  <Text className="text-lg font-semibold text-gray-900 mb-1">
                    {item.name}
                  </Text>
                  {item.description && (
                    <Text className="text-xs text-gray-400 mb-1 text-center">
                      {item.description}
                    </Text>
                  )}
                  <Text className="text-sm text-gray-500 mb-2">
                    {item.price}₺
                  </Text>
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      className="bg-red-400 rounded-full w-10 h-10 items-center justify-center mr-2"
                      onPress={() => {
                        const idx = cart.findIndex(
                          (cartItem) => cartItem.id === item.id
                        );
                        if (idx !== -1) {
                          setCart(cart.filter((_, i) => i !== idx));
                        }
                      }}
                      disabled={count === 0}
                    >
                      <Text className="font-bold text-white text-2xl">-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-green-400 rounded-full w-10 h-10 items-center justify-center"
                      onPress={() => setCart([...cart, item])}
                    >
                      <Text className="text-white font-bold text-2xl">+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
      {/* Sepet özeti, ürün listesi ve tamamla butonu tek bir alt View içinde */}
      <View className="absolute bottom-0 w-full bg-white rounded-t-3xl py-5 shadow px-12 items-center">
        {/* Sepetteki ürünler ve adetleri kaydırılabilir */}
        <View className="w-full max-h-24 overflow-hidden">
          <FlatList
            data={menuItems.filter((product) =>
              cart.some((item) => item.id === product.id)
            )}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const count = cart.filter(
                (cartItem) => cartItem.id === item.id
              ).length;
              return (
                <View
                  key={item.id}
                  className="flex-row justify-between items-center mb-1 w-full"
                >
                  <Text className="text-base text-gray-700">{item.name}</Text>
                  <Text className="text-base text-gray-900 font-bold">
                    x{count}
                  </Text>
                </View>
              );
            }}
            style={{ maxHeight: 96 }}
          />
        </View>
        {/* Toplam tutar sepetteki ürünlerin hemen altında */}
        <Text className="text-s font-bold text-gray-800 w-full text-left">
          Toplam: {total}₺
        </Text>
        <TouchableOpacity
          className="bg-brandOrange px-8 py-4 rounded-full w-full mb-4 mt-3"
          onPress={() => router.push("/screens/CompleteOrderScreen")}
        >
          <Text className="text-white text-lg font-bold text-center ">
            Masa Seç
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

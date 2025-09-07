import { Stack } from "expo-router";
import { ServerProvider } from "./context/ServerContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ServerProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" options={{ title: "Giriş" }} />
            <Stack.Screen name="index" options={{ title: "Ana Sayfa" }} />
            <Stack.Screen name="settings" options={{ title: "Ayarlar" }} />
          </Stack>
        </AuthProvider>
      </ServerProvider>
    </ThemeProvider>
  );
}

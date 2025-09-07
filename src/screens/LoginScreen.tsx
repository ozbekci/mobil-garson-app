// src/screens/LoginScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useConfigStore } from "../state/configStore";
import { useFeatureStore } from "../state/featureStore";
import { useWaiterAuthStore } from "../state/waiterAuthStore";
import { useOwnerStore } from "../state/ownerStore";
import { getActiveWaiters } from "../api/endpoints";

type Step =
  | "ip"
  | "handshake"
  | "feature"
  | "owner"
  | "waiterSelect"
  | "waiterPin"
  | "done";

// Active waiters & owner verify now come from endpoints / store

const LoginScreen: React.FC<any> = ({ navigation }) => {
  const {
    baseUrl,
    setBaseUrlValue,
    handshake,
    loading: cfgLoading,
    error: cfgError,
  } = useConfigStore();
  const {
    mobileEnabled,
    fetchFeatures,
    loading: featLoading,
    error: featError,
  } = useFeatureStore();
  const { session, loginWaiter, loading: waiterLoading } = useWaiterAuthStore();
  const {
    verify: verifyOwner,
    loading: ownerLoading,
    error: ownerError,
  } = useOwnerStore();

  const [step, setStep] = useState<Step>("ip");
  const [tempBaseUrl, setTempBaseUrl] = useState(baseUrl || "http://");
  const [ownerPw, setOwnerPw] = useState("");
  const [waiters, setWaiters] = useState<{ id: number; name: string }[]>([]);
  const [selectedWaiter, setSelectedWaiter] = useState<number | null>(null);
  const [waiterPin, setWaiterPin] = useState("");
  const [busy, setBusy] = useState(false);

  // Auto flow if session exists
  useEffect(() => {
    (async () => {
      if (session) {
        // Optionally check still active
        // Navigate directly
        navigation.replace("Orders");
      }
    })();
  }, [session]);

  const handleSetIp = async () => {
    setBusy(true);
    try {
      await setBaseUrlValue(tempBaseUrl.trim());
      setStep("handshake");
    } catch (e: any) {
      Alert.alert("Hata", e.message || "IP kaydedilemedi");
    } finally {
      setBusy(false);
    }
  };

  const doHandshake = useCallback(async () => {
    const ok = await handshake();
    if (ok) {
      setStep("feature");
    } else {
      Alert.alert("Hata", "Bağlantı doğrulanamadı");
      setStep("ip");
    }
  }, [handshake]);

  useEffect(() => {
    if (step === "handshake") {
      doHandshake();
    }
  }, [step, doHandshake]);

  const loadFeaturesAndContinue = useCallback(async () => {
    await fetchFeatures();
    if (mobileEnabled === false) return; // bekle sonraki render
  }, [fetchFeatures, mobileEnabled]);

  useEffect(() => {
    if (step === "feature") {
      loadFeaturesAndContinue();
    }
  }, [step, loadFeaturesAndContinue]);

  useEffect(() => {
    if (step === "feature" && mobileEnabled === false) {
      Alert.alert("Kapalı", "Mobil garson özelliği aktif değil");
    } else if (step === "feature" && mobileEnabled === true) {
      setStep("owner");
    }
  }, [mobileEnabled, step]);

  const handleOwnerVerify = async () => {
    setBusy(true);
    try {
      const ok = await verifyOwner(ownerPw.trim());
      if (!ok) {
        return;
      }
      const list = await getActiveWaiters();
      setWaiters(list);
      setStep("waiterSelect");
    } catch (e: any) {
      Alert.alert("Hata", e.message || "Doğrulama başarısız");
    } finally {
      setBusy(false);
    }
  };

  const handleSelectWaiter = (id: number) => {
    setSelectedWaiter(id);
    setStep("waiterPin");
  };

  const handleWaiterLogin = async () => {
    if (!selectedWaiter) return;
    setBusy(true);
    const ok = await loginWaiter(selectedWaiter, waiterPin.trim());
    setBusy(false);
    const waiterstate = useWaiterAuthStore.getState(); // store'daki güncel hata
    if (!ok) {
      Alert.alert(
        "Hata",
        (waiterstate.errorcode || "error code yok") + waiterstate.error ||
          "giriş başarisiz"
      );
      return;
    }
    navigation.replace("Orders");
  };

  const renderBody = () => {
    if (busy || cfgLoading || featLoading || waiterLoading || ownerLoading) {
      return (
        <View style={{ alignItems: "center" }}>
          <ActivityIndicator size="large" />
          <Text>İşleniyor...</Text>
        </View>
      );
    }
    if (step === "ip") {
      return (
        <View>
          <Text style={{ fontSize: 20, marginBottom: 12 }}>
            Sunucu IP / URL
          </Text>
          <TextInput
            value={tempBaseUrl}
            onChangeText={setTempBaseUrl}
            autoCapitalize="none"
            style={styles.input}
          />
          <Button title="Kaydet" onPress={handleSetIp} />
        </View>
      );
    }
    if (step === "handshake") {
      return <Text>Sunucu doğrulanıyor...</Text>;
    }
    if (step === "feature") {
      return <Text>Özellik kontrol ediliyor...</Text>;
    }
    if (step === "owner") {
      return (
        <View>
          <Text style={styles.title}>Patron Şifresi</Text>
          <TextInput
            value={ownerPw}
            onChangeText={setOwnerPw}
            secureTextEntry
            style={styles.input}
          />
          <Button title="Doğrula" onPress={handleOwnerVerify} />
          {ownerError && <Text style={styles.error}>{ownerError}</Text>}
        </View>
      );
    }
    if (step === "waiterSelect") {
      return (
        <View>
          <Text style={styles.title}>Garson Seç</Text>
          {waiters.map((w) => (
            <View key={w.id} style={{ marginBottom: 8 }}>
              <Button title={w.name} onPress={() => handleSelectWaiter(w.id)} />
            </View>
          ))}
        </View>
      );
    }
    if (step === "waiterPin") {
      return (
        <View>
          <Text style={styles.title}>Garson PIN</Text>
          <TextInput
            value={waiterPin}
            onChangeText={setWaiterPin}
            secureTextEntry
            style={styles.input}
          />
          <Button title="Giriş" onPress={handleWaiterLogin} />
        </View>
      );
    }
    // 'done' step artık kullanılmıyor (navigasyonla çıkılıyor)
    return null;
  };

  return (
    <View style={styles.container}>
      {cfgError && <Text style={styles.error}>{cfgError}</Text>}
      {featError && <Text style={styles.error}>{featError}</Text>}
      {renderBody()}
    </View>
  );
};

export default LoginScreen;

const styles = {
  container: { flex: 1, justifyContent: "center", padding: 20 } as const,
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 14,
    borderRadius: 6,
  } as const,
  title: { fontSize: 22, marginBottom: 12 } as const,
  error: { color: "red", marginBottom: 8 } as const,
};

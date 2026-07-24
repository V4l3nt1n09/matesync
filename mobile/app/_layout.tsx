import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AnimatedLogo } from "../components/AnimatedLogo";
import { DemoBanner } from "../components/DemoBanner";
import { AuthProvider } from "../lib/auth-context";
import { isDemoMode } from "../lib/demo-mode";
import { ProfileProvider } from "../lib/profile-context";
import { colors } from "../lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
          {showIntro ? (
            <AnimatedLogo onFinish={() => setShowIntro(false)} />
          ) : null}
          {isDemoMode ? <DemoBanner /> : null}
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

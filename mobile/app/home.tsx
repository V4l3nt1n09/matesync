import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth-context";
import { supabase, type Profile } from "../lib/supabase";
import { colors } from "../lib/theme";

const CONSOLE_LABELS: Record<string, string> = {
  switch1: "Switch (originale)",
  switch2: "Switch 2",
  both: "Switch 1 & 2",
};

export default function HomeScreen() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("profiles")
      .select("id, console, frequency, favorite_games")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data as Profile | null);
        setChecking(false);
      });
  }, [session]);

  if (authLoading || checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/" />;
  }

  if (!profile || !profile.console) {
    return <Redirect href="/profile-setup" />;
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.badge}>
        <View style={styles.dot} />
        <Text style={styles.badgeText}>Profil créé</Text>
      </View>
      <Text style={styles.title}>C&apos;est parti !</Text>
      <Text style={styles.sub}>
        Console : {CONSOLE_LABELS[profile.console] ?? profile.console}
      </Text>
      <Text style={styles.note}>
        La suite (découverte de joueurs, chat, sessions) arrive dans les
        prochaines mises à jour de l&apos;app.
      </Text>

      <Pressable
        style={styles.btnGhost}
        onPress={() => supabase.auth.signOut()}
      >
        <Text style={styles.btnGhostText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.mint,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mint,
  },
  badgeText: {
    color: colors.mint,
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    marginTop: 18,
    fontSize: 28,
    fontWeight: "800",
    color: colors.foreground,
  },
  sub: {
    marginTop: 10,
    fontSize: 16,
    color: colors.foreground,
  },
  note: {
    marginTop: 14,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  btnGhost: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnGhostText: {
    color: colors.foreground,
    fontWeight: "600",
    fontSize: 15,
  },
});

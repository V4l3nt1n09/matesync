import { Redirect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth-context";
import { colors } from "../lib/theme";

export default function WelcomeScreen() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/home" />;
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View>
        <Text style={styles.word}>
          Mate<Text style={styles.wordAccent}>Sync</Text>
        </Text>
        <Text style={styles.claim}>
          T&apos;as une Switch.{"\n"}T&apos;as personne avec qui jouer.
        </Text>
        <Text style={styles.sub}>
          Trouve des joueurs compatibles avec tes jeux et tes horaires — en
          local ou en ligne.
        </Text>
      </View>

      <View style={styles.ctaStack}>
        <Pressable
          style={styles.btnPrimary}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.btnPrimaryText}>Commencer</Text>
        </Pressable>
        <Pressable
          style={styles.btnGhost}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.btnGhostText}>J&apos;ai déjà un compte</Text>
        </Pressable>
      </View>
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
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  word: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.foreground,
  },
  wordAccent: {
    color: colors.accent2,
  },
  claim: {
    marginTop: 18,
    fontSize: 28,
    fontWeight: "800",
    color: colors.foreground,
    lineHeight: 36,
  },
  sub: {
    marginTop: 14,
    fontSize: 16,
    color: colors.muted,
    lineHeight: 23,
  },
  ctaStack: {
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnGhostText: {
    color: colors.foreground,
    fontWeight: "600",
    fontSize: 16,
  },
});

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth-context";
import { supabase, type Console } from "../lib/supabase";
import { colors } from "../lib/theme";

const CONSOLE_OPTIONS: { value: Console; label: string }[] = [
  { value: "switch1", label: "Switch (originale)" },
  { value: "switch2", label: "Switch 2" },
  { value: "both", label: "Les deux" },
];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [selected, setSelected] = useState<Console | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue() {
    if (!selected || !session) return;
    setError("");
    setLoading(true);
    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: session.user.id,
      console: selected,
    });
    setLoading(false);
    if (upsertError) {
      setError("Une erreur est survenue, réessaie.");
      return;
    }
    router.replace("/home");
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={styles.stepTag}>Étape 1 sur 1 (pour l&apos;instant)</Text>
      <Text style={styles.title}>Quelle console as-tu ?</Text>

      <View style={styles.options}>
        {CONSOLE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[
              styles.optionRow,
              selected === opt.value && styles.optionRowSelected,
            ]}
            onPress={() => setSelected(opt.value)}
          >
            <Text style={styles.optionLabel}>{opt.label}</Text>
            <View
              style={[
                styles.radio,
                selected === opt.value && styles.radioSelected,
              ]}
            />
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.btnPrimary, !selected && styles.btnDisabled]}
        onPress={handleContinue}
        disabled={!selected || loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.btnPrimaryText}>Continuer</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  stepTag: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.muted,
  },
  title: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "800",
    color: colors.foreground,
  },
  options: {
    marginTop: 28,
    gap: 12,
  },
  optionRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionRowSelected: {
    borderColor: colors.accent,
    backgroundColor: "rgba(124,92,255,0.12)",
  },
  optionLabel: {
    fontSize: 15,
    color: colors.foreground,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  radioSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  error: {
    marginTop: 16,
    color: colors.accent2,
    fontSize: 14,
  },
  btnPrimary: {
    marginTop: 28,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnPrimaryText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});

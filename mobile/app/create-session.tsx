import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { useAuth } from "../lib/auth-context";
import { useProfile } from "../lib/profile-context";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";

type Preset = "now" | "1h" | "tonight" | "tomorrow";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "now", label: "Maintenant" },
  { value: "1h", label: "Dans 1h" },
  { value: "tonight", label: "Ce soir (20h)" },
  { value: "tomorrow", label: "Demain soir (20h)" },
];

function computeScheduledAt(preset: Preset): string | null {
  if (preset === "now") return null;
  const date = new Date();
  if (preset === "1h") {
    date.setHours(date.getHours() + 1);
    return date.toISOString();
  }
  if (preset === "tonight") {
    date.setHours(20, 0, 0, 0);
    return date.toISOString();
  }
  date.setDate(date.getDate() + 1);
  date.setHours(20, 0, 0, 0);
  return date.toISOString();
}

export default function CreateSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { profile } = useProfile();

  const [game, setGame] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [preset, setPreset] = useState<Preset>("now");
  const [slots, setSlots] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const myGames = profile?.favorite_games ?? [];

  async function publish() {
    if (!session || !profile || !game) return;
    setLoading(true);
    setError("");
    const { error: insertError } = await supabase.from("sessions").insert({
      creator_id: session.user.id,
      creator_pseudo: profile.pseudo ?? "",
      creator_avatar_url: profile.avatar_url,
      game,
      description: description.trim() || null,
      scheduled_at: computeScheduledAt(preset),
      slots_total: slots,
    });
    setLoading(false);
    if (insertError) {
      setError("Impossible de publier l'annonce, réessaie.");
      return;
    }
    router.replace("/annonces");
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ Annuler</Text>
      </Pressable>

      <Text style={styles.title}>Créer une annonce</Text>

      {myGames.length === 0 ? (
        <>
          <Text style={styles.sub}>
            Ajoute d'abord des jeux à ton profil pour pouvoir créer une annonce.
          </Text>
          <PrimaryButton
            title="Compléter mon profil"
            onPress={() => router.push("/profile-setup")}
            style={styles.btnPrimary}
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Jeu</Text>
          <View style={styles.chipCloud}>
            {myGames.map((g) => (
              <Pressable
                key={g}
                style={[styles.chip, game === g && styles.chipSelected]}
                onPress={() => setGame(g)}
              >
                <Text style={[styles.chipText, game === g && styles.chipTextSelected]}>
                  {g}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Description (optionnel)</Text>
          <TextInput
            style={styles.input}
            placeholder="Un petit mot sur la session..."
            placeholderTextColor={colors.muted}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={200}
          />

          <Text style={styles.label}>Créneau</Text>
          <View style={styles.options}>
            {PRESETS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.optionRow, preset === opt.value && styles.optionRowSelected]}
                onPress={() => setPreset(opt.value)}
              >
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <View style={[styles.radio, preset === opt.value && styles.radioSelected]} />
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Nombre de places</Text>
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => setSlots((s) => Math.max(1, s - 1))}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{slots}</Text>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => setSlots((s) => Math.min(8, s + 1))}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            title="Publier l'annonce"
            onPress={publish}
            disabled={!game}
            loading={loading}
            style={styles.btnPrimary}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  back: {
    color: colors.muted,
    fontSize: 15,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.foreground,
  },
  sub: {
    marginTop: 12,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 21,
  },
  label: {
    marginTop: 24,
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipCloud: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: "rgba(124,92,255,0.15)",
  },
  chipText: {
    fontSize: 13,
    color: colors.muted,
  },
  chipTextSelected: {
    color: colors.foreground,
    fontWeight: "600",
  },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.foreground,
    minHeight: 80,
    textAlignVertical: "top",
  },
  options: {
    marginTop: 12,
    gap: 10,
  },
  optionRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  stepper: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: "700",
  },
  stepperValue: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
  },
  error: {
    marginTop: 16,
    color: colors.accent2,
    fontSize: 14,
  },
  btnPrimary: {
    marginTop: 28,
  },
});

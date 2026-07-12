import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth-context";
import { GAME_OPTIONS } from "../lib/games";
import { supabase, type Console, type Frequency } from "../lib/supabase";
import { colors } from "../lib/theme";

const CONSOLE_OPTIONS: { value: Console; label: string }[] = [
  { value: "switch1", label: "Switch (originale)" },
  { value: "switch2", label: "Switch 2" },
  { value: "both", label: "Les deux" },
];

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Tous les jours" },
  { value: "weekly", label: "Chaque semaine" },
  { value: "occasionally", label: "De temps en temps" },
  { value: "rarely", label: "Rarement" },
];

const STEPS = ["console", "pseudo", "games", "frequency", "friendcode", "photo"] as const;
type Step = (typeof STEPS)[number];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [stepIndex, setStepIndex] = useState(0);
  const step: Step = STEPS[stepIndex];

  const [consoleType, setConsoleType] = useState<Console | null>(null);
  const [pseudo, setPseudo] = useState("");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<Frequency | null>(null);
  const [friendCode, setFriendCode] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("profiles")
      .select(
        "console, pseudo, favorite_games, frequency, switch_friend_code, avatar_url",
      )
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          if (data.console) setConsoleType(data.console);
          if (data.pseudo) setPseudo(data.pseudo);
          if (data.favorite_games) setSelectedGames(data.favorite_games);
          if (data.frequency) setFrequency(data.frequency);
          if (data.switch_friend_code) setFriendCode(data.switch_friend_code);

          // Resume at the first step that hasn't been completed yet.
          if (!data.console) setStepIndex(0);
          else if (!data.pseudo) setStepIndex(1);
          else if (!data.avatar_url) setStepIndex(5);
        }
        setReady(true);
      });
  }, [session]);

  function toggleGame(game: string) {
    setSelectedGames((prev) =>
      prev.includes(game) ? prev.filter((g) => g !== game) : [...prev, game],
    );
  }

  function goNext() {
    setError("");
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      router.replace("/home");
    }
  }

  async function saveField(fields: Record<string, unknown>) {
    if (!session) return true;
    setLoading(true);
    setError("");
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({ id: session.user.id, ...fields });
    setLoading(false);
    if (upsertError) {
      if (upsertError.code === "23505") {
        setError("Ce pseudo est déjà pris, essaie-en un autre.");
      } else {
        setError("Une erreur est survenue, réessaie.");
      }
      return false;
    }
    return true;
  }

  async function handleConsoleContinue() {
    if (!consoleType) return;
    const ok = await saveField({ console: consoleType });
    if (ok) goNext();
  }

  async function handlePseudoContinue() {
    if (pseudo.trim().length < 2) {
      setError("Ton pseudo doit faire au moins 2 caractères.");
      return;
    }
    const ok = await saveField({ pseudo: pseudo.trim() });
    if (ok) goNext();
  }

  async function handleGamesContinue() {
    const ok = await saveField({ favorite_games: selectedGames });
    if (ok) goNext();
  }

  async function handleFrequencyContinue() {
    const ok = await saveField({ frequency });
    if (ok) goNext();
  }

  async function handleFriendCodeContinue() {
    const ok = await saveField({
      switch_friend_code: friendCode.trim() || null,
    });
    if (ok) goNext();
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function handlePhotoFinish() {
    if (!avatarUri || !session) {
      router.replace("/home");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(avatarUri);
      const arraybuffer = await response.arrayBuffer();
      const path = `${session.user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, arraybuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase
        .from("profiles")
        .upsert({ id: session.user.id, avatar_url: data.publicUrl });
      router.replace("/home");
    } catch {
      setError("Impossible d'envoyer la photo, réessaie.");
    } finally {
      setLoading(false);
    }
  }

  const stepNumber = stepIndex + 1;

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={styles.stepTag}>
        Étape {stepNumber} sur {STEPS.length}
      </Text>

      {step === "console" && (
        <>
          <Text style={styles.title}>Quelle console as-tu ?</Text>
          <View style={styles.options}>
            {CONSOLE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.optionRow,
                  consoleType === opt.value && styles.optionRowSelected,
                ]}
                onPress={() => setConsoleType(opt.value)}
              >
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <View
                  style={[
                    styles.radio,
                    consoleType === opt.value && styles.radioSelected,
                  ]}
                />
              </Pressable>
            ))}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={[styles.btnPrimary, !consoleType && styles.btnDisabled]}
            onPress={handleConsoleContinue}
            disabled={!consoleType || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnPrimaryText}>Continuer</Text>
            )}
          </Pressable>
        </>
      )}

      {step === "pseudo" && (
        <>
          <Text style={styles.title}>Comment on t&apos;appelle ?</Text>
          <Text style={styles.sub}>
            Ton pseudo, visible par les autres joueurs.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ton pseudo"
            placeholderTextColor={colors.muted}
            value={pseudo}
            onChangeText={setPseudo}
            autoCapitalize="none"
            maxLength={24}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={[
              styles.btnPrimary,
              pseudo.trim().length < 2 && styles.btnDisabled,
            ]}
            onPress={handlePseudoContinue}
            disabled={pseudo.trim().length < 2 || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnPrimaryText}>Continuer</Text>
            )}
          </Pressable>
        </>
      )}

      {step === "games" && (
        <>
          <Text style={styles.title}>Tes jeux favoris en multi ?</Text>
          <Text style={styles.sub}>Optionnel, tu pourras en ajouter plus tard.</Text>
          <View style={styles.chipCloud}>
            {GAME_OPTIONS.map((game) => (
              <Pressable
                key={game}
                style={[
                  styles.chip,
                  selectedGames.includes(game) && styles.chipSelected,
                ]}
                onPress={() => toggleGame(game)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedGames.includes(game) && styles.chipTextSelected,
                  ]}
                >
                  {game}
                </Text>
              </Pressable>
            ))}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.footerRow}>
            <Pressable style={styles.btnGhostSmall} onPress={goNext}>
              <Text style={styles.btnGhostText}>Passer</Text>
            </Pressable>
            <Pressable
              style={[styles.btnPrimary, styles.btnFlex]}
              onPress={handleGamesContinue}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.btnPrimaryText}>Continuer</Text>
              )}
            </Pressable>
          </View>
        </>
      )}

      {step === "frequency" && (
        <>
          <Text style={styles.title}>À quelle fréquence veux-tu jouer ?</Text>
          <Text style={styles.sub}>Optionnel.</Text>
          <View style={styles.options}>
            {FREQUENCY_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.optionRow,
                  frequency === opt.value && styles.optionRowSelected,
                ]}
                onPress={() => setFrequency(opt.value)}
              >
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <View
                  style={[
                    styles.radio,
                    frequency === opt.value && styles.radioSelected,
                  ]}
                />
              </Pressable>
            ))}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.footerRow}>
            <Pressable style={styles.btnGhostSmall} onPress={goNext}>
              <Text style={styles.btnGhostText}>Passer</Text>
            </Pressable>
            <Pressable
              style={[styles.btnPrimary, styles.btnFlex]}
              onPress={handleFrequencyContinue}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.btnPrimaryText}>Continuer</Text>
              )}
            </Pressable>
          </View>
        </>
      )}

      {step === "friendcode" && (
        <>
          <Text style={styles.title}>Ton code ami Switch ?</Text>
          <Text style={styles.sub}>
            Optionnel — pour s&apos;ajouter en jeu une fois mis en relation.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="SW-1234-5678-9012"
            placeholderTextColor={colors.muted}
            value={friendCode}
            onChangeText={setFriendCode}
            autoCapitalize="characters"
            maxLength={16}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.footerRow}>
            <Pressable style={styles.btnGhostSmall} onPress={goNext}>
              <Text style={styles.btnGhostText}>Passer</Text>
            </Pressable>
            <Pressable
              style={[styles.btnPrimary, styles.btnFlex]}
              onPress={handleFriendCodeContinue}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.btnPrimaryText}>Continuer</Text>
              )}
            </Pressable>
          </View>
        </>
      )}

      {step === "photo" && (
        <>
          <Text style={styles.title}>Une photo de profil ?</Text>
          <Text style={styles.sub}>Optionnel, tu peux la choisir maintenant ou plus tard.</Text>

          <Pressable style={styles.avatarPicker} onPress={pickImage}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarPlaceholder}>+</Text>
            )}
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={styles.btnPrimary}
            onPress={handlePhotoFinish}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnPrimaryText}>
                {avatarUri ? "Terminer" : "Terminer sans photo"}
              </Text>
            )}
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    flexGrow: 1,
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
  sub: {
    marginTop: 8,
    fontSize: 14,
    color: colors.muted,
  },
  options: {
    marginTop: 24,
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
  input: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.foreground,
  },
  chipCloud: {
    marginTop: 20,
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
  avatarPicker: {
    marginTop: 28,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    fontSize: 40,
    color: colors.muted,
  },
  error: {
    marginTop: 16,
    color: colors.accent2,
    fontSize: 14,
  },
  footerRow: {
    marginTop: 28,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  btnFlex: {
    flex: 1,
    marginTop: 0,
  },
  btnGhostSmall: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  btnGhostText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 15,
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

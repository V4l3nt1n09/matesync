import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";

type Step = "email" | "code";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendCode() {
    setError("");
    if (!email.includes("@")) {
      setError("Merci d'entrer un email valide.");
      return;
    }
    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
    });
    setLoading(false);
    if (otpError) {
      setError("Impossible d'envoyer le code, réessaie dans un instant.");
      return;
    }
    setStep("code");
  }

  async function verifyCode() {
    setError("");
    if (code.trim().length < 4) {
      setError("Entre le code reçu par email.");
      return;
    }
    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });
    setLoading(false);
    if (verifyError) {
      setError("Code invalide ou expiré, réessaie.");
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
      {step === "email" ? (
        <>
          <Text style={styles.title}>Ton email</Text>
          <Text style={styles.sub}>
            On t&apos;envoie un code à 6 chiffres, pas de mot de passe à
            retenir.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="toi@exemple.com"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton
            title="Recevoir le code"
            onPress={sendCode}
            loading={loading}
            style={styles.btnPrimary}
          />
        </>
      ) : (
        <>
          <Text style={styles.title}>Ton code</Text>
          <Text style={styles.sub}>
            Envoyé à {email}. Vérifie aussi tes spams.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ton code"
            placeholderTextColor={colors.muted}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={12}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton
            title="Valider"
            onPress={verifyCode}
            loading={loading}
            style={styles.btnPrimary}
          />
          <Pressable onPress={() => setStep("email")}>
            <Text style={styles.link}>Changer d&apos;email</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.foreground,
  },
  sub: {
    marginTop: 8,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 21,
  },
  input: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.foreground,
  },
  error: {
    marginTop: 10,
    color: colors.accent2,
    fontSize: 14,
  },
  btnPrimary: {
    marginTop: 20,
  },
  link: {
    marginTop: 16,
    textAlign: "center",
    color: colors.muted,
    fontSize: 14,
  },
});

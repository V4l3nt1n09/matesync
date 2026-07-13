import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/theme";
import { GradientAvatar } from "./GradientAvatar";

const CONSOLE_LABELS: Record<string, string> = {
  switch1: "Switch (originale)",
  switch2: "Switch 2",
  both: "Switch 1 & 2",
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Tous les jours",
  weekly: "Chaque semaine",
  occasionally: "De temps en temps",
  rarely: "Rarement",
};

interface ProfileViewProps {
  pseudo: string;
  avatarUrl: string | null;
  console: string | null;
  frequency: string | null;
  favoriteGames: string[];
  gameCounts: Record<string, number>;
  isSelf: boolean;
  onSettingsPress?: () => void;
}

export function ProfileView({
  pseudo,
  avatarUrl,
  console: consoleType,
  frequency,
  favoriteGames,
  gameCounts,
  isSelf,
  onSettingsPress,
}: ProfileViewProps) {
  return (
    <View>
      <View style={styles.headerRow}>
        <GradientAvatar uri={avatarUrl} label={pseudo} size={72} />
        {isSelf ? (
          <Pressable onPress={onSettingsPress} hitSlop={12} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={24} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.title}>{pseudo}</Text>

      <View style={styles.badgeRow}>
        {consoleType ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {CONSOLE_LABELS[consoleType] ?? consoleType}
            </Text>
          </View>
        ) : null}
        {frequency ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {FREQUENCY_LABELS[frequency] ?? frequency}
            </Text>
          </View>
        ) : null}
      </View>

      {favoriteGames.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Jeux favoris</Text>
          <View style={styles.chipCloud}>
            {favoriteGames.map((game) => (
              <View key={game} style={styles.chip}>
                <Text style={styles.chipText}>{game}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
            Sessions par jeu
          </Text>
          <View style={styles.gameCountList}>
            {favoriteGames.map((game) => (
              <View key={game} style={styles.gameCountRow}>
                <Text style={styles.gameCountName}>{game}</Text>
                <Text style={styles.gameCountValue}>
                  {gameCounts[game] ?? 0} session{(gameCounts[game] ?? 0) > 1 ? "s" : ""}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingsBtn: {
    padding: 4,
  },
  title: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: "800",
    color: colors.foreground,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  badge: {
    borderWidth: 1,
    borderColor: colors.mint,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.mint,
    fontSize: 12,
    fontWeight: "700",
  },
  sectionTitle: {
    marginTop: 24,
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionTitleSpaced: {
    marginTop: 28,
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
  chipText: {
    fontSize: 13,
    color: colors.foreground,
    fontWeight: "600",
  },
  gameCountList: {
    marginTop: 12,
    gap: 10,
  },
  gameCountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  gameCountName: {
    fontSize: 14,
    color: colors.foreground,
    fontWeight: "600",
    flexShrink: 1,
  },
  gameCountValue: {
    fontSize: 13,
    color: colors.muted,
  },
});

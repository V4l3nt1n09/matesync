import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileView } from "../../components/ProfileView";
import { useAuth } from "../../lib/auth-context";
import { useProfile } from "../../lib/profile-context";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { profile } = useProfile();
  const [gameCounts, setGameCounts] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      supabase
        .rpc("get_player_game_session_counts", { p_user_id: session.user.id })
        .then(({ data }) => {
          const map: Record<string, number> = {};
          for (const row of data ?? []) map[row.game] = row.session_count;
          setGameCounts(map);
        });
    }, [session]),
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <ProfileView
        pseudo={profile?.pseudo ?? ""}
        avatarUrl={profile?.avatar_url ?? null}
        console={profile?.console ?? null}
        frequency={profile?.frequency ?? null}
        favoriteGames={profile?.favorite_games ?? []}
        gameCounts={gameCounts}
        isSelf
        onSettingsPress={() => router.push("/profile-setup?edit=1")}
      />

      <Pressable
        style={[styles.btnGhost, styles.btnGhostFirst]}
        onPress={() => supabase.auth.signOut()}
      >
        <Text style={styles.btnGhostText}>Se déconnecter</Text>
      </Pressable>
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
  btnGhostFirst: {
    marginTop: 32,
  },
  btnGhost: {
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

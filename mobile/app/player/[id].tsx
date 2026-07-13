import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileView } from "../../components/ProfileView";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";

interface PublicProfile {
  pseudo: string;
  avatar_url: string | null;
  console: string | null;
  frequency: string | null;
  favorite_games: string[];
}

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [gameCounts, setGameCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.rpc("get_public_profile", { p_user_id: id }).then(({ data }) => data?.[0] ?? null),
      supabase.rpc("get_player_game_session_counts", { p_user_id: id }).then(({ data }) => data ?? []),
    ]).then(([profileData, counts]) => {
      setProfile(profileData);
      const map: Record<string, number> = {};
      for (const row of counts) map[row.game] = row.session_count;
      setGameCounts(map);
      setLoading(false);
    });
  }, [id]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ Retour</Text>
      </Pressable>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : !profile ? (
        <Text style={styles.emptyText}>Profil introuvable.</Text>
      ) : (
        <ProfileView
          pseudo={profile.pseudo}
          avatarUrl={profile.avatar_url}
          console={profile.console}
          frequency={profile.frequency}
          favoriteGames={profile.favorite_games ?? []}
          gameCounts={gameCounts}
          isSelf={false}
        />
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
    marginBottom: 16,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    textAlign: "center",
    marginTop: 40,
  },
});

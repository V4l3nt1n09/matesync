import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientAvatar } from "../../components/GradientAvatar";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAuth } from "../../lib/auth-context";
import { DEMO_NEWS, DEMO_USER_ID, demoStore } from "../../lib/demo-data";
import { isDemoMode } from "../../lib/demo-mode";
import { formatCreneau } from "../../lib/format";
import { useProfile } from "../../lib/profile-context";
import {
  supabase,
  type GameSession,
  type NewsItem,
  type SessionRequest,
} from "../../lib/supabase";
import { colors } from "../../lib/theme";

interface ActivityItem {
  id: string;
  text: string;
  timestamp: string;
  pseudo: string;
  avatarUrl: string | null;
  onPress: () => void;
}

interface RecommendedSession {
  id: string;
  game: string;
  creator_pseudo: string;
  creator_avatar_url: string | null;
  scheduled_at: string | null;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { profile } = useProfile();

  const [nextSession, setNextSession] = useState<GameSession | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [recommended, setRecommended] = useState<RecommendedSession[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (isDemoMode) {
        const myId = DEMO_USER_ID;
        const now = new Date();

        const hosted = demoStore.sessions.filter(
          (s) => s.creator_id === myId && new Date(s.expires_at) > now,
        );
        const acceptedSessions = demoStore.sessionRequests
          .filter((r) => r.requester_id === myId && r.status === "accepted")
          .map((r) => demoStore.sessions.find((s) => s.id === r.session_id))
          .filter((s): s is GameSession => !!s && new Date(s.expires_at) > now);

        const sessionsById = new Map<string, GameSession>();
        for (const s of hosted) sessionsById.set(s.id, s);
        for (const s of acceptedSessions) sessionsById.set(s.id, s);

        const mySessions = [...sessionsById.values()];
        setActiveCount(mySessions.length);
        const next = mySessions.sort(
          (a, b) =>
            new Date(a.scheduled_at ?? a.created_at).getTime() -
            new Date(b.scheduled_at ?? b.created_at).getTime(),
        )[0];
        setNextSession(next ?? null);

        setFriendsCount(
          demoStore.friendRequests.filter(
            (fr) =>
              fr.status === "accepted" &&
              (fr.requester_id === myId || fr.addressee_id === myId),
          ).length,
        );

        if (profile?.favorite_games?.length) {
          setRecommended(
            demoStore.sessions
              .filter(
                (s) =>
                  s.creator_id !== myId &&
                  profile.favorite_games.includes(s.game) &&
                  new Date(s.expires_at) > now,
              )
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 3),
          );
        } else {
          setRecommended([]);
        }

        const items: ActivityItem[] = [];

        for (const fr of demoStore.friendRequests.filter(
          (f) => f.addressee_id === myId && f.status === "pending",
        )) {
          items.push({
            id: `fr-in-${fr.id}`,
            text: `${fr.requester_pseudo} veut devenir ton ami`,
            timestamp: fr.created_at,
            pseudo: fr.requester_pseudo,
            avatarUrl: fr.requester_avatar_url,
            onPress: () => router.push("/chat"),
          });
        }

        for (const fr of demoStore.friendRequests.filter(
          (f) => f.requester_id === myId && f.status === "accepted",
        )) {
          items.push({
            id: `fr-acc-${fr.id}`,
            text: `${fr.addressee_pseudo} a accepté ta demande d'ami`,
            timestamp: fr.decided_at ?? fr.created_at,
            pseudo: fr.addressee_pseudo,
            avatarUrl: fr.addressee_avatar_url,
            onPress: () => router.push("/chat"),
          });
        }

        const hostedIds = hosted.map((s) => s.id);
        for (const r of demoStore.sessionRequests.filter(
          (req) => hostedIds.includes(req.session_id) && req.status === "pending",
        )) {
          const s = demoStore.sessions.find((sess) => sess.id === r.session_id);
          items.push({
            id: `sr-in-${r.id}`,
            text: `${r.requester_pseudo} veut rejoindre ${s?.game ?? "ta session"}`,
            timestamp: r.created_at,
            pseudo: r.requester_pseudo,
            avatarUrl: r.requester_avatar_url,
            onPress: () => router.push("/annonces"),
          });
        }

        for (const r of demoStore.sessionRequests.filter(
          (req) => req.requester_id === myId && req.status === "accepted",
        )) {
          const s = demoStore.sessions.find((sess) => sess.id === r.session_id);
          if (s) {
            items.push({
              id: `sr-acc-${r.id}`,
              text: `${s.creator_pseudo} a accepté ta demande pour ${s.game}`,
              timestamp: r.decided_at ?? r.created_at,
              pseudo: s.creator_pseudo,
              avatarUrl: s.creator_avatar_url,
              onPress: () => router.push(`/session-chat/${s.id}`),
            });
          }
        }

        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivity(items.slice(0, 5));

        setNews(DEMO_NEWS);
        return;
      }

      if (!session) return;
      const myId = session.user.id;
      const nowIso = new Date().toISOString();

      (async () => {
        const { data: hosted } = await supabase
          .from("sessions")
          .select("*")
          .eq("creator_id", myId)
          .gt("expires_at", nowIso);

        const { data: acceptedReqs } = await supabase
          .from("session_requests")
          .select("*, session:sessions(*)")
          .eq("requester_id", myId)
          .eq("status", "accepted");

        const sessionsById = new Map<string, GameSession>();
        for (const s of hosted ?? []) sessionsById.set(s.id, s);
        for (const r of (acceptedReqs ?? []) as unknown as (SessionRequest & {
          session: GameSession;
        })[]) {
          if (r.session && new Date(r.session.expires_at) > new Date()) {
            sessionsById.set(r.session.id, r.session);
          }
        }

        const mySessions = [...sessionsById.values()];
        setActiveCount(mySessions.length);
        const next = mySessions.sort(
          (a, b) =>
            new Date(a.scheduled_at ?? a.created_at).getTime() -
            new Date(b.scheduled_at ?? b.created_at).getTime(),
        )[0];
        setNextSession(next ?? null);

        const { count } = await supabase
          .from("friend_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "accepted")
          .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`);
        setFriendsCount(count ?? 0);

        // Recommended annonces preview
        if (profile?.favorite_games?.length) {
          const { data: available } = await supabase
            .from("sessions")
            .select("id, game, creator_pseudo, creator_avatar_url, scheduled_at")
            .neq("creator_id", myId)
            .in("game", profile.favorite_games)
            .gt("expires_at", nowIso)
            .order("created_at", { ascending: false })
            .limit(3);
          setRecommended(available ?? []);
        } else {
          setRecommended([]);
        }

        // Activity feed
        const items: ActivityItem[] = [];

        const { data: friendReceived } = await supabase
          .from("friend_requests")
          .select("*")
          .eq("addressee_id", myId)
          .eq("status", "pending");
        for (const fr of friendReceived ?? []) {
          items.push({
            id: `fr-in-${fr.id}`,
            text: `${fr.requester_pseudo} veut devenir ton ami`,
            timestamp: fr.created_at,
            pseudo: fr.requester_pseudo,
            avatarUrl: fr.requester_avatar_url,
            onPress: () => router.push("/chat"),
          });
        }

        const { data: friendAccepted } = await supabase
          .from("friend_requests")
          .select("*")
          .eq("requester_id", myId)
          .eq("status", "accepted");
        for (const fr of friendAccepted ?? []) {
          items.push({
            id: `fr-acc-${fr.id}`,
            text: `${fr.addressee_pseudo} a accepté ta demande d'ami`,
            timestamp: fr.decided_at ?? fr.created_at,
            pseudo: fr.addressee_pseudo,
            avatarUrl: fr.addressee_avatar_url,
            onPress: () => router.push("/chat"),
          });
        }

        const hostedIds = (hosted ?? []).map((s) => s.id);
        if (hostedIds.length) {
          const { data: pendingGuests } = await supabase
            .from("session_requests")
            .select("*, session:sessions(*)")
            .in("session_id", hostedIds)
            .eq("status", "pending");
          for (const r of (pendingGuests ?? []) as unknown as (SessionRequest & {
            session: GameSession;
          })[]) {
            items.push({
              id: `sr-in-${r.id}`,
              text: `${r.requester_pseudo} veut rejoindre ${r.session?.game ?? "ta session"}`,
              timestamp: r.created_at,
              pseudo: r.requester_pseudo,
              avatarUrl: r.requester_avatar_url,
              onPress: () => router.push("/annonces"),
            });
          }
        }

        const { data: myAcceptedReqs } = await supabase
          .from("session_requests")
          .select("*, session:sessions(*)")
          .eq("requester_id", myId)
          .eq("status", "accepted");
        for (const r of (myAcceptedReqs ?? []) as unknown as (SessionRequest & {
          session: GameSession;
        })[]) {
          if (r.session) {
            items.push({
              id: `sr-acc-${r.id}`,
              text: `${r.session.creator_pseudo} a accepté ta demande pour ${r.session.game}`,
              timestamp: r.decided_at ?? r.created_at,
              pseudo: r.session.creator_pseudo,
              avatarUrl: r.session.creator_avatar_url,
              onPress: () => router.push(`/session-chat/${r.session.id}`),
            });
          }
        }

        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivity(items.slice(0, 5));

        const { data: newsData } = await supabase
          .from("news")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3);
        setNews(newsData ?? []);
      })();
    }, [session, profile]),
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.badge}>
        <View style={styles.dot} />
        <Text style={styles.badgeText}>Profil créé</Text>
      </View>
      <Text style={styles.title}>Salut {profile?.pseudo} !</Text>

      {nextSession ? (
        <Pressable
          style={styles.nextCard}
          onPress={() => router.push(`/session-chat/${nextSession.id}`)}
        >
          <Text style={styles.nextLabel}>Ta prochaine session</Text>
          <Text style={styles.nextGame}>{nextSession.game}</Text>
          <Text style={styles.nextMeta}>{formatCreneau(nextSession.scheduled_at)}</Text>
        </Pressable>
      ) : (
        <Text style={styles.sub}>
          Prêt à trouver des joueurs compatibles avec tes jeux et tes horaires ?
        </Text>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{activeCount}</Text>
          <Text style={styles.statLabel}>Annonces actives</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{friendsCount}</Text>
          <Text style={styles.statLabel}>Amis</Text>
        </View>
      </View>

      <PrimaryButton
        title="Voir les annonces"
        onPress={() => router.push("/annonces")}
        style={styles.btnPrimary}
      />
      <Pressable
        style={styles.btnGhost}
        onPress={() => router.push("/create-session")}
      >
        <Text style={styles.btnGhostText}>Créer une annonce</Text>
      </Pressable>

      {activity.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activité récente</Text>
          {activity.map((item) => (
            <Pressable key={item.id} style={styles.activityRow} onPress={item.onPress}>
              <GradientAvatar uri={item.avatarUrl} label={item.pseudo} size={32} />
              <Text style={styles.activityText}>{item.text}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {recommended.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Annonces pour toi</Text>
            <Pressable onPress={() => router.push("/annonces")}>
              <Text style={styles.sectionLink}>Tout voir</Text>
            </Pressable>
          </View>
          {recommended.map((r) => (
            <Pressable
              key={r.id}
              style={styles.recoCard}
              onPress={() => router.push("/annonces")}
            >
              <Text style={styles.recoGame}>{r.game}</Text>
              <View style={styles.recoHostRow}>
                <GradientAvatar uri={r.creator_avatar_url} label={r.creator_pseudo} size={22} />
                <Text style={styles.recoMeta}>
                  Chez {r.creator_pseudo} · {formatCreneau(r.scheduled_at)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {news.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actus Switch</Text>
          {news.map((n) => (
            <View key={n.id} style={styles.newsCard}>
              <Text style={styles.newsTitle}>{n.title}</Text>
              <Text style={styles.newsBody}>{n.body}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.note}>
        Retrouve tes conversations et tes amis dans l&apos;onglet Chat.
      </Text>
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
    color: colors.muted,
    lineHeight: 22,
  },
  nextCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: "rgba(124,92,255,0.1)",
    borderRadius: 18,
    padding: 16,
  },
  nextLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nextGame: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "800",
    color: colors.foreground,
  },
  nextMeta: {
    marginTop: 2,
    fontSize: 14,
    color: colors.muted,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  statTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.foreground,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    color: colors.muted,
  },
  btnPrimary: {
    marginTop: 28,
  },
  btnGhost: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnGhostText: {
    color: colors.foreground,
    fontWeight: "600",
    fontSize: 15,
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 12,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: colors.foreground,
  },
  recoCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  recoGame: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.foreground,
  },
  recoHostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  recoMeta: {
    fontSize: 13,
    color: colors.muted,
  },
  newsCard: {
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: "rgba(62,230,168,0.08)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  newsBody: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
  },
  note: {
    marginTop: 24,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
});

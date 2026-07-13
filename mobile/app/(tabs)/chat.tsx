import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientAvatar } from "../../components/GradientAvatar";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAuth } from "../../lib/auth-context";
import { useProfile } from "../../lib/profile-context";
import {
  supabase,
  type FriendRequest,
  type GameSession,
  type SessionMessage,
  type SessionRequest,
} from "../../lib/supabase";
import { colors } from "../../lib/theme";

type Segment = "conversations" | "amis";

interface SessionConvo {
  kind: "session";
  session: GameSession;
  participantCount: number;
  lastMessageAt: string;
  lastMessagePreview: string | null;
}

interface DirectConvo {
  kind: "direct";
  otherId: string;
  otherPseudo: string;
  otherAvatarUrl: string | null;
  lastMessageAt: string;
  lastMessagePreview: string;
}

type ConvoItem = SessionConvo | DirectConvo;

interface MetPlayer {
  id: string;
  pseudo: string;
  avatarUrl: string | null;
  liked: boolean | null;
}

function otherFriendId(fr: FriendRequest, myId: string): string {
  return fr.requester_id === myId ? fr.addressee_id : fr.requester_id;
}

function otherFriendPseudo(fr: FriendRequest, myId: string): string {
  return fr.requester_id === myId ? fr.addressee_pseudo : fr.requester_pseudo;
}

function otherFriendAvatar(fr: FriendRequest, myId: string): string | null {
  return fr.requester_id === myId ? fr.addressee_avatar_url : fr.requester_avatar_url;
}

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { profile } = useProfile();

  const [segment, setSegment] = useState<Segment>("conversations");
  const [loading, setLoading] = useState(true);
  const [convos, setConvos] = useState<ConvoItem[]>([]);
  const [received, setReceived] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<FriendRequest[]>([]);
  const [metPlayers, setMetPlayers] = useState<MetPlayer[]>([]);

  const loadConversations = useCallback(async () => {
    if (!session) return;
    const myId = session.user.id;

    const { data: hosted } = await supabase
      .from("sessions")
      .select("*")
      .eq("creator_id", myId);

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
      if (r.session) sessionsById.set(r.session.id, r.session);
    }
    const sessionIds = [...sessionsById.keys()];

    let acceptedCountBySession = new Map<string, number>();
    let lastMessageBySession = new Map<string, SessionMessage>();
    if (sessionIds.length) {
      const { data: accepted } = await supabase
        .from("session_requests")
        .select("session_id")
        .in("session_id", sessionIds)
        .eq("status", "accepted");
      for (const r of accepted ?? []) {
        acceptedCountBySession.set(r.session_id, (acceptedCountBySession.get(r.session_id) ?? 0) + 1);
      }

      const { data: messages } = await supabase
        .from("session_messages")
        .select("*")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: false });
      for (const m of messages ?? []) {
        if (!lastMessageBySession.has(m.session_id)) {
          lastMessageBySession.set(m.session_id, m);
        }
      }
    }

    const sessionConvos: SessionConvo[] = [...sessionsById.values()].map((s) => {
      const last = lastMessageBySession.get(s.id);
      return {
        kind: "session",
        session: s,
        participantCount: (acceptedCountBySession.get(s.id) ?? 0) + 1,
        lastMessageAt: last?.created_at ?? s.created_at,
        lastMessagePreview: last?.content ?? null,
      };
    });

    const { data: friendRows } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("status", "accepted")
      .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`);

    const directConvos: DirectConvo[] = [];
    for (const fr of friendRows ?? []) {
      const otherId = otherFriendId(fr, myId);
      const [userA, userB] = [myId, otherId].sort();
      const { data: msgs } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("user_a", userA)
        .eq("user_b", userB)
        .order("created_at", { ascending: false })
        .limit(1);
      const last = msgs?.[0];
      if (last) {
        directConvos.push({
          kind: "direct",
          otherId,
          otherPseudo: otherFriendPseudo(fr, myId),
          otherAvatarUrl: otherFriendAvatar(fr, myId),
          lastMessageAt: last.created_at,
          lastMessagePreview: last.content,
        });
      }
    }

    const all: ConvoItem[] = [...sessionConvos, ...directConvos].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );
    setConvos(all);
  }, [session]);

  const loadAmis = useCallback(async () => {
    if (!session) return;
    const myId = session.user.id;

    const { data: receivedRows } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("addressee_id", myId)
      .eq("status", "pending");
    setReceived(receivedRows ?? []);

    const { data: friendRows } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("status", "accepted")
      .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`);
    setFriends(friendRows ?? []);

    const excludedIds = new Set<string>([myId]);
    for (const fr of friendRows ?? []) excludedIds.add(otherFriendId(fr, myId));
    const { data: pendingEither } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("status", "pending")
      .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`);
    for (const fr of pendingEither ?? []) excludedIds.add(otherFriendId(fr, myId));

    const met = new Map<string, MetPlayer>();

    const { data: hosted } = await supabase
      .from("sessions")
      .select("id")
      .eq("creator_id", myId);
    const hostedIds = (hosted ?? []).map((s) => s.id);
    if (hostedIds.length) {
      const { data: acceptedGuests } = await supabase
        .from("session_requests")
        .select("*")
        .in("session_id", hostedIds)
        .eq("status", "accepted");
      for (const r of acceptedGuests ?? []) {
        if (!excludedIds.has(r.requester_id)) {
          met.set(r.requester_id, {
            id: r.requester_id,
            pseudo: r.requester_pseudo,
            avatarUrl: r.requester_avatar_url,
            liked: null,
          });
        }
      }
    }

    const { data: myAccepted } = await supabase
      .from("session_requests")
      .select("*, session:sessions(*)")
      .eq("requester_id", myId)
      .eq("status", "accepted");
    for (const r of (myAccepted ?? []) as unknown as (SessionRequest & {
      session: GameSession;
    })[]) {
      if (r.session && !excludedIds.has(r.session.creator_id)) {
        met.set(r.session.creator_id, {
          id: r.session.creator_id,
          pseudo: r.session.creator_pseudo,
          avatarUrl: r.session.creator_avatar_url,
          liked: null,
        });
      }
    }

    const metIds = [...met.keys()];
    if (metIds.length) {
      const { data: myRatings } = await supabase
        .from("player_ratings")
        .select("*")
        .eq("rater_id", myId)
        .in("ratee_id", metIds);
      for (const r of myRatings ?? []) {
        const player = met.get(r.ratee_id);
        if (player) player.liked = r.liked;
      }
    }

    const sorted = [...met.values()].sort((a, b) => {
      const scoreA = a.liked === true ? 0 : a.liked === false ? 2 : 1;
      const scoreB = b.liked === true ? 0 : b.liked === false ? 2 : 1;
      return scoreA - scoreB;
    });
    setMetPlayers(sorted);
  }, [session]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadConversations(), loadAmis()]);
    setLoading(false);
  }, [loadConversations, loadAmis]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
      AsyncStorage.setItem("chat_last_viewed_at", new Date().toISOString());
    }, [loadAll]),
  );

  async function sendFriendRequest(otherId: string, otherPseudo: string, otherAvatarUrl: string | null) {
    if (!session || !profile) return;
    const myId = session.user.id;

    const { data: reverse } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("requester_id", otherId)
      .eq("addressee_id", myId)
      .eq("status", "pending")
      .maybeSingle();

    if (reverse) {
      await supabase
        .from("friend_requests")
        .update({ status: "accepted", decided_at: new Date().toISOString() })
        .eq("id", reverse.id);
    } else {
      await supabase.from("friend_requests").insert({
        requester_id: myId,
        requester_pseudo: profile.pseudo ?? "",
        requester_avatar_url: profile.avatar_url,
        addressee_id: otherId,
        addressee_pseudo: otherPseudo,
        addressee_avatar_url: otherAvatarUrl,
      });
    }
    loadAmis();
  }

  async function respondToFriendRequest(requestId: string, status: "accepted" | "declined") {
    await supabase
      .from("friend_requests")
      .update({ status, decided_at: new Date().toISOString() })
      .eq("id", requestId);
    loadAmis();
    loadConversations();
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom },
      ]}
    >
      <Text style={styles.title}>Chat</Text>

      <View style={styles.segmentRow}>
        <Pressable
          style={[styles.segment, segment === "conversations" && styles.segmentActive]}
          onPress={() => setSegment("conversations")}
        >
          <Text
            style={[
              styles.segmentText,
              segment === "conversations" && styles.segmentTextActive,
            ]}
          >
            Conversations
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, segment === "amis" && styles.segmentActive]}
          onPress={() => setSegment("amis")}
        >
          <Text
            style={[styles.segmentText, segment === "amis" && styles.segmentTextActive]}
          >
            Amis
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : segment === "conversations" ? (
        convos.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Pas encore de conversation. Rejoins ou crée une annonce, ou
              deviens ami avec un joueur croisé pour commencer à discuter.
            </Text>
          </View>
        ) : (
          <FlatList
            data={convos}
            keyExtractor={(item) =>
              item.kind === "session" ? `s-${item.session.id}` : `d-${item.otherId}`
            }
            contentContainerStyle={styles.list}
            renderItem={({ item }) =>
              item.kind === "session" ? (
                <Pressable
                  style={styles.card}
                  onPress={() => router.push(`/session-chat/${item.session.id}`)}
                >
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>🎮</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.pseudo}>{item.session.game}</Text>
                    <Text style={styles.preview} numberOfLines={1}>
                      {item.lastMessagePreview ?? `${item.participantCount} participants`}
                    </Text>
                  </View>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.card}
                  onPress={() => router.push(`/direct-chat/${item.otherId}`)}
                >
                  <Pressable onPress={() => router.push(`/player/${item.otherId}`)}>
                    <GradientAvatar uri={item.otherAvatarUrl} label={item.otherPseudo} size={48} />
                  </Pressable>
                  <View style={styles.cardInfo}>
                    <Pressable onPress={() => router.push(`/player/${item.otherId}`)}>
                      <Text style={styles.pseudo}>{item.otherPseudo}</Text>
                    </Pressable>
                    <Text style={styles.preview} numberOfLines={1}>
                      {item.lastMessagePreview}
                    </Text>
                  </View>
                </Pressable>
              )
            }
          />
        )
      ) : (
        <FlatList
          data={[{ key: "amis" }]}
          keyExtractor={(s) => s.key}
          contentContainerStyle={styles.list}
          renderItem={() => (
            <View>
              <Text style={styles.sectionTitle}>Demandes reçues</Text>
              {received.length === 0 ? (
                <Text style={styles.emptyInline}>Aucune demande en attente.</Text>
              ) : (
                received.map((fr) => (
                  <View key={fr.id} style={styles.card}>
                    <Pressable onPress={() => router.push(`/player/${fr.requester_id}`)}>
                      <GradientAvatar
                        uri={fr.requester_avatar_url}
                        label={fr.requester_pseudo}
                        size={44}
                      />
                    </Pressable>
                    <View style={styles.cardInfo}>
                      <Pressable onPress={() => router.push(`/player/${fr.requester_id}`)}>
                        <Text style={styles.pseudo}>{fr.requester_pseudo}</Text>
                      </Pressable>
                    </View>
                    <View style={styles.requesterActions}>
                      <Pressable
                        style={styles.btnAccept}
                        onPress={() => respondToFriendRequest(fr.id, "accepted")}
                      >
                        <Text style={styles.btnAcceptText}>Accepter</Text>
                      </Pressable>
                      <Pressable
                        style={styles.btnDecline}
                        onPress={() => respondToFriendRequest(fr.id, "declined")}
                      >
                        <Text style={styles.btnDeclineText}>Refuser</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}

              <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Mes amis</Text>
              {friends.length === 0 ? (
                <Text style={styles.emptyInline}>
                  Pas encore d'ami. Retrouve les joueurs rencontrés ci-dessous.
                </Text>
              ) : (
                friends.map((fr) => {
                  const otherId = session ? otherFriendId(fr, session.user.id) : "";
                  const otherPseudo = session ? otherFriendPseudo(fr, session.user.id) : "";
                  const otherAvatarUrl = session ? otherFriendAvatar(fr, session.user.id) : null;
                  return (
                    <Pressable
                      key={fr.id}
                      style={styles.card}
                      onPress={() => router.push(`/direct-chat/${otherId}`)}
                    >
                      <Pressable onPress={() => router.push(`/player/${otherId}`)}>
                        <GradientAvatar uri={otherAvatarUrl} label={otherPseudo} size={44} />
                      </Pressable>
                      <View style={styles.cardInfo}>
                        <Pressable onPress={() => router.push(`/player/${otherId}`)}>
                          <Text style={styles.pseudo}>{otherPseudo}</Text>
                        </Pressable>
                      </View>
                      <Text style={styles.btnGhostText}>Discuter</Text>
                    </Pressable>
                  );
                })
              )}

              <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
                Joueurs rencontrés
              </Text>
              {metPlayers.length === 0 ? (
                <Text style={styles.emptyInline}>
                  Aucun joueur rencontré pour l'instant via une annonce.
                </Text>
              ) : (
                metPlayers.map((p) => (
                  <View key={p.id} style={styles.card}>
                    <Pressable onPress={() => router.push(`/player/${p.id}`)}>
                      <GradientAvatar uri={p.avatarUrl} label={p.pseudo} size={44} />
                    </Pressable>
                    <View style={styles.cardInfo}>
                      <Pressable onPress={() => router.push(`/player/${p.id}`)}>
                        <Text style={styles.pseudo}>
                          {p.pseudo} {p.liked === true ? "👍" : ""}
                        </Text>
                      </Pressable>
                    </View>
                    <PrimaryButton
                      title="Demander en ami"
                      size="small"
                      onPress={() => sendFriendRequest(p.id, p.pseudo, p.avatarUrl)}
                    />
                  </View>
                ))
              )}
            </View>
          )}
        />
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
  segmentRow: {
    flexDirection: "row",
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 999,
  },
  segmentActive: {
    backgroundColor: colors.accent,
  },
  segmentText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 14,
  },
  segmentTextActive: {
    color: "white",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyInline: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  list: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 10,
  },
  sectionTitleSpaced: {
    marginTop: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderText: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 16,
  },
  cardInfo: {
    flex: 1,
  },
  pseudo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.foreground,
  },
  preview: {
    marginTop: 2,
    fontSize: 13,
    color: colors.muted,
  },
  requesterActions: {
    flexDirection: "row",
    gap: 8,
  },
  btnAccept: {
    backgroundColor: colors.mint,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnAcceptText: {
    color: colors.background,
    fontWeight: "700",
    fontSize: 12,
  },
  btnDecline: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnDeclineText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 12,
  },
  btnGhostText: {
    color: colors.mint,
    fontWeight: "600",
    fontSize: 13,
  },
});

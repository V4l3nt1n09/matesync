import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { formatCreneau } from "../../lib/format";
import { useProfile } from "../../lib/profile-context";
import {
  supabase,
  type GameSession,
  type SessionRequest,
} from "../../lib/supabase";
import { colors } from "../../lib/theme";

type Segment = "disponibles" | "miennes";

interface AvailableItem {
  session: GameSession;
  request: SessionRequest | null;
  acceptedCount: number;
}

interface MySessionItem {
  session: GameSession;
  pending: SessionRequest[];
  acceptedCount: number;
}

type SentRequest = SessionRequest & { session: GameSession };

export default function AnnoncesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { profile } = useProfile();

  const [segment, setSegment] = useState<Segment>("disponibles");
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState<AvailableItem[]>([]);
  const [mySessions, setMySessions] = useState<MySessionItem[]>([]);
  const [myRequests, setMyRequests] = useState<SentRequest[]>([]);
  const [revealedCodes, setRevealedCodes] = useState<Record<string, string>>({});

  const loadDisponibles = useCallback(async () => {
    if (!session || !profile?.favorite_games?.length) {
      setAvailable([]);
      return;
    }
    const nowIso = new Date().toISOString();
    const { data: sessionsData } = await supabase
      .from("sessions")
      .select("*")
      .neq("creator_id", session.user.id)
      .in("game", profile.favorite_games)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false });

    const ids = (sessionsData ?? []).map((s) => s.id);

    const { data: myReqs } = await supabase
      .from("session_requests")
      .select("*")
      .eq("requester_id", session.user.id);
    const requestMap = new Map((myReqs ?? []).map((r) => [r.session_id, r]));

    let acceptedBySession = new Map<string, number>();
    if (ids.length) {
      const { data: accepted } = await supabase
        .from("session_requests")
        .select("session_id")
        .in("session_id", ids)
        .eq("status", "accepted");
      for (const r of accepted ?? []) {
        acceptedBySession.set(r.session_id, (acceptedBySession.get(r.session_id) ?? 0) + 1);
      }
    }

    const creatorIds = [...new Set((sessionsData ?? []).map((s) => s.creator_id))];
    let likedByCreator = new Map<string, boolean>();
    if (creatorIds.length) {
      const { data: myRatings } = await supabase
        .from("player_ratings")
        .select("*")
        .eq("rater_id", session.user.id)
        .in("ratee_id", creatorIds);
      for (const r of myRatings ?? []) likedByCreator.set(r.ratee_id, r.liked);
    }

    const items = (sessionsData ?? []).map((s) => ({
      session: s,
      request: requestMap.get(s.id) ?? null,
      acceptedCount: acceptedBySession.get(s.id) ?? 0,
    }));

    items.sort((a, b) => {
      const scoreOf = (creatorId: string) => {
        const liked = likedByCreator.get(creatorId);
        return liked === true ? 0 : liked === false ? 2 : 1;
      };
      return scoreOf(a.session.creator_id) - scoreOf(b.session.creator_id);
    });

    setAvailable(items);
  }, [session, profile]);

  const loadMine = useCallback(async () => {
    if (!session) return;
    const nowIso = new Date().toISOString();
    const { data: created } = await supabase
      .from("sessions")
      .select("*")
      .eq("creator_id", session.user.id)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false });

    const ids = (created ?? []).map((s) => s.id);
    let pendingBySession = new Map<string, SessionRequest[]>();
    let acceptedBySession = new Map<string, number>();
    if (ids.length) {
      const { data: requests } = await supabase
        .from("session_requests")
        .select("*")
        .in("session_id", ids);
      for (const r of requests ?? []) {
        if (r.status === "pending") {
          const arr = pendingBySession.get(r.session_id) ?? [];
          arr.push(r);
          pendingBySession.set(r.session_id, arr);
        } else if (r.status === "accepted") {
          acceptedBySession.set(r.session_id, (acceptedBySession.get(r.session_id) ?? 0) + 1);
        }
      }
    }

    setMySessions(
      (created ?? []).map((s) => ({
        session: s,
        pending: pendingBySession.get(s.id) ?? [],
        acceptedCount: acceptedBySession.get(s.id) ?? 0,
      })),
    );

    const { data: sent } = await supabase
      .from("session_requests")
      .select("*, session:sessions(*)")
      .eq("requester_id", session.user.id)
      .order("created_at", { ascending: false });
    setMyRequests((sent ?? []) as unknown as SentRequest[]);
  }, [session]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadDisponibles(), loadMine()]);
    setLoading(false);
  }, [loadDisponibles, loadMine]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function requestToJoin(sessionId: string) {
    if (!session || !profile) return;
    await supabase.from("session_requests").insert({
      session_id: sessionId,
      requester_id: session.user.id,
      requester_pseudo: profile.pseudo ?? "",
      requester_avatar_url: profile.avatar_url,
    });
    loadDisponibles();
  }

  async function respondToRequest(requestId: string, status: "accepted" | "declined") {
    await supabase
      .from("session_requests")
      .update({ status, decided_at: new Date().toISOString() })
      .eq("id", requestId);
    loadMine();
  }

  async function deleteSession(sessionId: string) {
    await supabase.from("sessions").delete().eq("id", sessionId);
    loadMine();
  }

  async function revealCode(sessionId: string) {
    const { data } = await supabase.rpc("get_host_friend_code", {
      p_session_id: sessionId,
    });
    setRevealedCodes((prev) => ({ ...prev, [sessionId]: data ?? "" }));
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Annonces</Text>
        <PrimaryButton
          title="+ Créer"
          size="small"
          onPress={() => router.push("/create-session")}
        />
      </View>

      <View style={styles.segmentRow}>
        <Pressable
          style={[styles.segment, segment === "disponibles" && styles.segmentActive]}
          onPress={() => setSegment("disponibles")}
        >
          <Text
            style={[
              styles.segmentText,
              segment === "disponibles" && styles.segmentTextActive,
            ]}
          >
            Disponibles
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, segment === "miennes" && styles.segmentActive]}
          onPress={() => setSegment("miennes")}
        >
          <Text
            style={[
              styles.segmentText,
              segment === "miennes" && styles.segmentTextActive,
            ]}
          >
            Les miennes
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : segment === "disponibles" ? (
        available.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {profile?.favorite_games?.length
                ? "Aucune annonce pour tes jeux pour l'instant. Reviens plus tard."
                : "Ajoute des jeux à ton profil pour voir des annonces compatibles."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={available}
            keyExtractor={(item) => item.session.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Pressable onPress={() => router.push(`/player/${item.session.creator_id}`)}>
                    <GradientAvatar
                      uri={item.session.creator_avatar_url}
                      label={item.session.creator_pseudo}
                      size={52}
                    />
                  </Pressable>
                  <View style={styles.cardInfo}>
                    <Pressable onPress={() => router.push(`/player/${item.session.creator_id}`)}>
                      <Text style={styles.pseudo}>{item.session.creator_pseudo}</Text>
                    </Pressable>
                    <Text style={styles.game}>{item.session.game}</Text>
                    <Text style={styles.meta}>
                      {formatCreneau(item.session.scheduled_at)} · {item.acceptedCount}/
                      {item.session.slots_total} places
                    </Text>
                  </View>
                </View>

                {item.session.description ? (
                  <Text style={styles.description}>{item.session.description}</Text>
                ) : null}

                {!item.request ? (
                  <PrimaryButton
                    title="Demander à rejoindre"
                    onPress={() => requestToJoin(item.session.id)}
                    style={styles.btnPrimarySmall}
                  />
                ) : item.request.status === "pending" ? (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Demande envoyée</Text>
                  </View>
                ) : item.request.status === "declined" ? (
                  <View style={[styles.statusBadge, styles.statusBadgeDeclined]}>
                    <Text style={styles.statusBadgeText}>Refusée</Text>
                  </View>
                ) : revealedCodes[item.session.id] !== undefined ? (
                  <View style={styles.codeBox}>
                    <Text style={styles.codeText}>
                      {revealedCodes[item.session.id] || "Code indisponible"}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.btnGhost}
                    onPress={() => revealCode(item.session.id)}
                  >
                    <Text style={styles.btnGhostText}>Accepté · voir le code ami</Text>
                  </Pressable>
                )}
              </View>
            )}
          />
        )
      ) : (
        <FlatList
          data={[
            { type: "created" as const, items: mySessions },
            { type: "sent" as const, items: myRequests },
          ]}
          keyExtractor={(section) => section.type}
          contentContainerStyle={styles.list}
          renderItem={({ item: section }) =>
            section.type === "created" ? (
              <View>
                <Text style={styles.sectionTitle}>Mes annonces créées</Text>
                {mySessions.length === 0 ? (
                  <Text style={styles.emptyInline}>
                    Tu n'as pas d'annonce active. Crée-en une avec le bouton "+ Créer".
                  </Text>
                ) : (
                  mySessions.map((item) => (
                    <View key={item.session.id} style={styles.card}>
                      <Text style={styles.game}>{item.session.game}</Text>
                      <Text style={styles.meta}>
                        {formatCreneau(item.session.scheduled_at)} · {item.acceptedCount}/
                        {item.session.slots_total} places
                      </Text>
                      {item.session.description ? (
                        <Text style={styles.description}>{item.session.description}</Text>
                      ) : null}

                      {item.pending.length > 0 ? (
                        <View style={styles.requestersBox}>
                          {item.pending.map((req) => (
                            <View key={req.id} style={styles.requesterRow}>
                              <Pressable
                                style={styles.requesterIdentity}
                                onPress={() => router.push(`/player/${req.requester_id}`)}
                              >
                                <GradientAvatar
                                  uri={req.requester_avatar_url}
                                  label={req.requester_pseudo}
                                  size={28}
                                />
                                <Text style={styles.requesterName}>{req.requester_pseudo}</Text>
                              </Pressable>
                              <View style={styles.requesterActions}>
                                <Pressable
                                  style={styles.btnAccept}
                                  onPress={() => respondToRequest(req.id, "accepted")}
                                >
                                  <Text style={styles.btnAcceptText}>Accepter</Text>
                                </Pressable>
                                <Pressable
                                  style={styles.btnDecline}
                                  onPress={() => respondToRequest(req.id, "declined")}
                                >
                                  <Text style={styles.btnDeclineText}>Refuser</Text>
                                </Pressable>
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.noRequests}>Aucune demande pour l'instant</Text>
                      )}

                      <Pressable
                        style={styles.btnDeleteSession}
                        onPress={() => deleteSession(item.session.id)}
                      >
                        <Text style={styles.btnDeleteSessionText}>Supprimer l'annonce</Text>
                      </Pressable>
                    </View>
                  ))
                )}

                <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
                  Mes demandes envoyées
                </Text>
                {myRequests.length === 0 ? (
                  <Text style={styles.emptyInline}>
                    Tu n'as demandé à rejoindre aucune annonce pour l'instant.
                  </Text>
                ) : (
                  myRequests.map((req) => (
                    <View key={req.id} style={styles.card}>
                      <Text style={styles.game}>{req.session.game}</Text>
                      <Pressable
                        style={styles.sentHostRow}
                        onPress={() => router.push(`/player/${req.session.creator_id}`)}
                      >
                        <GradientAvatar
                          uri={req.session.creator_avatar_url}
                          label={req.session.creator_pseudo}
                          size={22}
                        />
                        <Text style={styles.meta}>
                          Chez {req.session.creator_pseudo} ·{" "}
                          {formatCreneau(req.session.scheduled_at)}
                        </Text>
                      </Pressable>
                      {req.status === "pending" ? (
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusBadgeText}>Demande envoyée</Text>
                        </View>
                      ) : req.status === "declined" ? (
                        <View style={[styles.statusBadge, styles.statusBadgeDeclined]}>
                          <Text style={styles.statusBadgeText}>Refusée</Text>
                        </View>
                      ) : revealedCodes[req.session.id] !== undefined ? (
                        <View style={styles.codeBox}>
                          <Text style={styles.codeText}>
                            {revealedCodes[req.session.id] || "Code indisponible"}
                          </Text>
                        </View>
                      ) : (
                        <Pressable
                          style={styles.btnGhost}
                          onPress={() => revealCode(req.session.id)}
                        >
                          <Text style={styles.btnGhostText}>Accepté · voir le code ami</Text>
                        </Pressable>
                      )}
                    </View>
                  ))
                )}
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.foreground,
  },
  segmentRow: {
    flexDirection: "row",
    marginHorizontal: 24,
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
    paddingHorizontal: 40,
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
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
    padding: 16,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  pseudo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.foreground,
  },
  game: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: "700",
    color: colors.foreground,
  },
  meta: {
    marginTop: 2,
    fontSize: 13,
    color: colors.muted,
  },
  sentHostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  description: {
    marginTop: 12,
    fontSize: 14,
    color: colors.foreground,
    lineHeight: 20,
  },
  btnPrimarySmall: {
    marginTop: 14,
  },
  statusBadge: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  statusBadgeDeclined: {
    borderColor: colors.accent2,
  },
  statusBadgeText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 13,
  },
  btnGhost: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.mint,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnGhostText: {
    color: colors.mint,
    fontWeight: "600",
    fontSize: 13,
  },
  codeBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.mint,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  codeText: {
    color: colors.mint,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 1,
  },
  requestersBox: {
    marginTop: 14,
    gap: 10,
  },
  requesterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  requesterIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  requesterName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
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
  noRequests: {
    marginTop: 14,
    fontSize: 13,
    color: colors.muted,
    fontStyle: "italic",
  },
  btnDeleteSession: {
    marginTop: 14,
    alignItems: "center",
  },
  btnDeleteSessionText: {
    color: colors.accent2,
    fontWeight: "600",
    fontSize: 13,
  },
});

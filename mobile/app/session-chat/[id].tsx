import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientAvatar } from "../../components/GradientAvatar";
import { useAuth } from "../../lib/auth-context";
import {
  addDemoSessionMessage,
  DEMO_USER_ID,
  demoStore,
  setDemoPlayerRating,
} from "../../lib/demo-data";
import { isDemoMode } from "../../lib/demo-mode";
import { useProfile } from "../../lib/profile-context";
import {
  supabase,
  type GameSession,
  type SessionMessage,
  type SessionRequest,
} from "../../lib/supabase";
import { colors, gradient } from "../../lib/theme";

interface Participant {
  id: string;
  pseudo: string;
  avatarUrl: string | null;
}

export default function SessionChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { profile } = useProfile();

  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [text, setText] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [ratings, setRatings] = useState<Record<string, boolean>>({});
  const listRef = useRef<FlatList>(null);

  const myId = session?.user.id ?? "";

  const load = useCallback(async () => {
    if (isDemoMode) {
      if (!id) return;
      const s = demoStore.sessions.find((sess) => sess.id === id) ?? null;
      setGameSession(s);
      setMessages(demoStore.sessionMessages[id] ?? []);

      if (s) {
        const requests = demoStore.sessionRequests.filter(
          (r) => r.session_id === id && r.status === "accepted",
        );
        const others: Participant[] = [];
        if (s.creator_id !== DEMO_USER_ID) {
          others.push({
            id: s.creator_id,
            pseudo: s.creator_pseudo,
            avatarUrl: s.creator_avatar_url,
          });
        }
        for (const r of requests) {
          if (r.requester_id !== DEMO_USER_ID) {
            others.push({
              id: r.requester_id,
              pseudo: r.requester_pseudo,
              avatarUrl: r.requester_avatar_url,
            });
          }
        }
        setParticipants(others);

        const map: Record<string, boolean> = {};
        for (const o of others) {
          const rating = demoStore.playerRatings.find(
            (r) => r.rater_id === DEMO_USER_ID && r.ratee_id === o.id,
          );
          if (rating) map[o.id] = rating.liked;
        }
        setRatings(map);
      }
      return;
    }

    if (!id || !myId) return;
    const { data: s } = await supabase.from("sessions").select("*").eq("id", id).maybeSingle();
    setGameSession(s);

    const { data: msgs } = await supabase
      .from("session_messages")
      .select("*")
      .eq("session_id", id)
      .order("created_at", { ascending: true });
    setMessages(msgs ?? []);

    if (s) {
      const { data: requests } = await supabase
        .from("session_requests")
        .select("*")
        .eq("session_id", id)
        .eq("status", "accepted");

      const others: Participant[] = [];
      if (s.creator_id !== myId) {
        others.push({ id: s.creator_id, pseudo: s.creator_pseudo, avatarUrl: s.creator_avatar_url });
      }
      for (const r of (requests ?? []) as SessionRequest[]) {
        if (r.requester_id !== myId) {
          others.push({
            id: r.requester_id,
            pseudo: r.requester_pseudo,
            avatarUrl: r.requester_avatar_url,
          });
        }
      }
      setParticipants(others);

      const { data: myRatings } = await supabase
        .from("player_ratings")
        .select("*")
        .eq("rater_id", myId)
        .in(
          "ratee_id",
          others.map((o) => o.id),
        );
      const map: Record<string, boolean> = {};
      for (const r of myRatings ?? []) map[r.ratee_id] = r.liked;
      setRatings(map);
    }
  }, [id, myId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isDemoMode) return;
    if (!id) return;
    const channel = supabase
      .channel(`session-messages-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "session_messages", filter: `session_id=eq.${id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as SessionMessage]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function send() {
    const content = text.trim();
    if (!content || !id) return;
    if (isDemoMode) {
      setText("");
      const msg: SessionMessage = {
        id: `demo-sm-${Date.now()}`,
        session_id: id,
        sender_id: DEMO_USER_ID,
        sender_pseudo: profile?.pseudo ?? "",
        content,
        created_at: new Date().toISOString(),
      };
      addDemoSessionMessage(id, msg);
      setMessages((prev) => [...prev, msg]);
      return;
    }
    if (!session || !profile) return;
    setText("");
    await supabase.from("session_messages").insert({
      session_id: id,
      sender_id: session.user.id,
      sender_pseudo: profile.pseudo ?? "",
      content,
    });
  }

  async function rate(other: Participant, liked: boolean) {
    if (!id) return;
    if (isDemoMode) {
      setRatings((prev) => ({ ...prev, [other.id]: liked }));
      setDemoPlayerRating({
        rater_id: DEMO_USER_ID,
        ratee_id: other.id,
        ratee_pseudo: other.pseudo,
        ratee_avatar_url: other.avatarUrl,
        liked,
        session_id: id,
        updated_at: new Date().toISOString(),
      });
      return;
    }
    if (!myId) return;
    setRatings((prev) => ({ ...prev, [other.id]: liked }));
    await supabase.from("player_ratings").upsert({
      rater_id: myId,
      ratee_id: other.id,
      ratee_pseudo: other.pseudo,
      ratee_avatar_url: other.avatarUrl,
      liked,
      session_id: id,
      updated_at: new Date().toISOString(),
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Retour</Text>
        </Pressable>
        <Text style={styles.title}>{gameSession?.game ?? "Chat de session"}</Text>

        {participants.length > 0 ? (
          <View style={styles.participantsRow}>
            {participants.map((p) => (
              <View key={p.id} style={styles.participantChip}>
                <Pressable
                  style={styles.participantLink}
                  onPress={() => router.push(`/player/${p.id}`)}
                >
                  <GradientAvatar uri={p.avatarUrl} label={p.pseudo} size={28} />
                  <Text style={styles.participantName} numberOfLines={1}>
                    {p.pseudo}
                  </Text>
                </Pressable>
                <Pressable onPress={() => rate(p, true)} hitSlop={6}>
                  <Text
                    style={[
                      styles.rateIcon,
                      ratings[p.id] === true && styles.rateIconActive,
                    ]}
                  >
                    👍
                  </Text>
                </Pressable>
                <Pressable onPress={() => rate(p, false)} hitSlop={6}>
                  <Text
                    style={[
                      styles.rateIcon,
                      ratings[p.id] === false && styles.rateIconActive,
                    ]}
                  >
                    👎
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.sender_id === session?.user.id;
          if (mine) {
            return (
              <View style={[styles.bubbleRow, styles.bubbleRowMine]}>
                <LinearGradient
                  colors={gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.bubble}
                >
                  <Text style={styles.bubbleTextMine}>{item.content}</Text>
                </LinearGradient>
              </View>
            );
          }
          return (
            <View style={styles.bubbleRow}>
              <View style={[styles.bubble, styles.bubbleThem]}>
                <Text style={styles.sender}>{item.sender_pseudo}</Text>
                <Text style={styles.bubbleText}>{item.content}</Text>
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          style={styles.input}
          placeholder="Écrire un message..."
          placeholderTextColor={colors.muted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <Pressable disabled={!text.trim()} onPress={send}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          >
            <Text style={styles.sendBtnText}>Envoyer</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: {
    color: colors.muted,
    fontSize: 15,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.foreground,
  },
  participantsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  participantChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    maxWidth: 180,
  },
  participantLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  participantName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.foreground,
    flexShrink: 1,
  },
  rateIcon: {
    fontSize: 14,
    opacity: 0.35,
  },
  rateIconActive: {
    opacity: 1,
  },
  list: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  bubbleRow: {
    flexDirection: "row",
  },
  bubbleRowMine: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleThem: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sender: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.mint,
    marginBottom: 2,
  },
  bubbleText: {
    fontSize: 15,
    color: colors.foreground,
    lineHeight: 21,
  },
  bubbleTextMine: {
    fontSize: 15,
    color: "white",
    lineHeight: 21,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.foreground,
    maxHeight: 100,
  },
  sendBtn: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
});

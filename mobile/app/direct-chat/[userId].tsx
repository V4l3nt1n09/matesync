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
import { supabase, type DirectMessage, type FriendRequest } from "../../lib/supabase";
import { colors, gradient } from "../../lib/theme";

export default function DirectChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [otherPseudo, setOtherPseudo] = useState("");
  const [otherAvatarUrl, setOtherAvatarUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);

  const myId = session?.user.id ?? "";
  const [userA, userB] = myId && userId ? [myId, userId].sort() : ["", ""];

  const load = useCallback(async () => {
    if (!myId || !userId) return;

    const { data: fr } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("status", "accepted")
      .or(
        `and(requester_id.eq.${myId},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${myId})`,
      )
      .maybeSingle();
    if (fr) {
      const other: FriendRequest = fr;
      const isMeRequester = other.requester_id === myId;
      setOtherPseudo(isMeRequester ? other.addressee_pseudo : other.requester_pseudo);
      setOtherAvatarUrl(
        isMeRequester ? other.addressee_avatar_url : other.requester_avatar_url,
      );
    }

    const { data: msgs } = await supabase
      .from("direct_messages")
      .select("*")
      .eq("user_a", userA)
      .eq("user_b", userB)
      .order("created_at", { ascending: true });
    setMessages(msgs ?? []);
  }, [myId, userId, userA, userB]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!userA || !userB) return;
    const channel = supabase
      .channel(`direct-messages-${userA}-${userB}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `user_a=eq.${userA}`,
        },
        (payload) => {
          const message = payload.new as DirectMessage;
          if (message.user_b === userB) {
            setMessages((prev) => [...prev, message]);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userA, userB]);

  async function send() {
    const content = text.trim();
    if (!content || !myId || !userA || !userB) return;
    setText("");
    await supabase.from("direct_messages").insert({
      user_a: userA,
      user_b: userB,
      sender_id: myId,
      content,
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
        <Pressable
          style={styles.titleRow}
          onPress={() => userId && router.push(`/player/${userId}`)}
        >
          <GradientAvatar uri={otherAvatarUrl} label={otherPseudo || "?"} size={32} />
          <Text style={styles.title}>{otherPseudo || "Chat"}</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.sender_id === myId;
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.foreground,
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

import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../lib/auth-context";
import { useProfile } from "../../lib/profile-context";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";

const CHAT_LAST_VIEWED_KEY = "chat_last_viewed_at";

export default function TabsLayout() {
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [chatBadge, setChatBadge] = useState(false);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function check() {
      const myId = session!.user.id;
      const lastViewed =
        (await AsyncStorage.getItem(CHAT_LAST_VIEWED_KEY)) ?? "1970-01-01T00:00:00.000Z";

      const [{ count: pendingCount }, { data: newSessionMsgs }, { data: newDirectMsgs }] =
        await Promise.all([
          supabase
            .from("friend_requests")
            .select("id", { count: "exact", head: true })
            .eq("addressee_id", myId)
            .eq("status", "pending"),
          supabase
            .from("session_messages")
            .select("id")
            .neq("sender_id", myId)
            .gt("created_at", lastViewed)
            .limit(1),
          supabase
            .from("direct_messages")
            .select("id")
            .neq("sender_id", myId)
            .gt("created_at", lastViewed)
            .limit(1),
        ]);

      if (!cancelled) {
        setChatBadge(
          (pendingCount ?? 0) > 0 ||
            (newSessionMsgs?.length ?? 0) > 0 ||
            (newDirectMsgs?.length ?? 0) > 0,
        );
      }
    }

    check();
    const interval = setInterval(check, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session]);

  if (authLoading || profileLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/" />;
  }

  if (!profile || !profile.console || !profile.pseudo) {
    return <Redirect href="/profile-setup" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="annonces"
        options={{
          title: "Annonces",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "megaphone" : "megaphone-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarBadge: chatBadge ? "•" : undefined,
          tabBarBadgeStyle: { minWidth: 10, height: 10, borderRadius: 5, fontSize: 0 },
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "person-circle" : "person-circle-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

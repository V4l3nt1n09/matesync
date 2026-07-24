import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../lib/theme";

function openMateSyncSite() {
  if (Platform.OS === "web") {
    window.open("https://matesync.fr", "_blank");
  } else {
    Linking.openURL("https://matesync.fr");
  }
}

export function DemoBanner() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
      <View style={styles.bar}>
        <View style={styles.dot} />
        <Text style={styles.text}>Mode démo — données fictives</Text>
        <Pressable onPress={openMateSyncSite} hitSlop={8}>
          <Text style={styles.link}>matesync.fr</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mint,
  },
  text: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: "600",
  },
  link: {
    color: colors.mint,
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

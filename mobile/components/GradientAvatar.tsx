import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text } from "react-native";
import { gradient } from "../lib/theme";

interface GradientAvatarProps {
  uri?: string | null;
  label: string;
  size?: number;
}

export function GradientAvatar({ uri, label, size = 48 }: GradientAvatarProps) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[styles.image, dimensionStyle]} />;
  }

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.placeholder, dimensionStyle]}
    >
      <Text style={[styles.label, { fontSize: size * 0.38 }]}>
        {label[0]?.toUpperCase() ?? "?"}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  image: {},
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "white",
    fontWeight: "700",
  },
});

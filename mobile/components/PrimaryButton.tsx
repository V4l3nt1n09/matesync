import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { gradient } from "../lib/theme";

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: "default" | "small";
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  style,
  size = "default",
}: PrimaryButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={style}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.base,
          size === "small" && styles.small,
          (disabled || loading) && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={[styles.text, size === "small" && styles.textSmall]}>{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  small: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  textSmall: {
    fontSize: 13,
  },
});

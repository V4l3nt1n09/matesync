import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { colors } from "../lib/theme";

const AnimatedG = Animated.createAnimatedComponent(View);

interface AnimatedLogoProps {
  onFinish?: () => void;
  size?: number;
}

export function AnimatedLogo({ onFinish, size = 160 }: AnimatedLogoProps) {
  const left = useRef(new Animated.ValueXY({ x: -70, y: 90 })).current;
  const right = useRef(new Animated.ValueXY({ x: 70, y: -90 })).current;
  const dots = useRef(new Animated.Value(0)).current;
  const piecesOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  // Runs once on mount — must not restart mid-flight when the parent
  // re-renders (e.g. once auth/profile finish loading).
  useEffect(() => {
    Animated.sequence([
      Animated.timing(piecesOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(left, {
          toValue: { x: 0, y: 0 },
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(right, {
          toValue: { x: 0, y: 0 },
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(dots, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(350),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => onFinishRef.current?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[styles.container, { opacity: screenOpacity }]}
      pointerEvents="none"
    >
      <View style={{ width: size, height: size }}>
        <AnimatedG
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: piecesOpacity,
              transform: [{ translateX: left.x }, { translateY: left.y }],
            },
          ]}
        >
          <Svg width={size} height={size} viewBox="0 0 512 512">
            <Defs>
              <LinearGradient id="barGrad" x1="98" y1="0" x2="414" y2="0" gradientUnits="userSpaceOnUse">
                <Stop offset="0%" stopColor="#8c5cf6" />
                <Stop offset="100%" stopColor="#ff6aa8" />
              </LinearGradient>
            </Defs>
            <Path
              d="M246,208 H154 A48,48 0 0 0 154,304 H246 Z"
              fill="url(#barGrad)"
              transform="rotate(-11 256 256)"
            />
            <AnimatedCircle cx={140} cy={256} r={14} fill="#f3f1f8" opacity={dots} transform="rotate(-11 256 256)" />
          </Svg>
        </AnimatedG>

        <AnimatedG
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: piecesOpacity,
              transform: [{ translateX: right.x }, { translateY: right.y }],
            },
          ]}
        >
          <Svg width={size} height={size} viewBox="0 0 512 512">
            <Defs>
              <LinearGradient id="barGrad2" x1="98" y1="0" x2="414" y2="0" gradientUnits="userSpaceOnUse">
                <Stop offset="0%" stopColor="#8c5cf6" />
                <Stop offset="100%" stopColor="#ff6aa8" />
              </LinearGradient>
            </Defs>
            <Path
              d="M266,208 H358 A48,48 0 0 1 358,304 H266 Z"
              fill="url(#barGrad2)"
              transform="rotate(-11 256 256)"
            />
            <AnimatedCircle cx={372} cy={256} r={14} fill="#f3f1f8" opacity={dots} transform="rotate(-11 256 256)" />
          </Svg>
        </AnimatedG>
      </View>
    </Animated.View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    zIndex: 999,
  },
});

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { HOME_APPS, type HomeApp, type HomeAppId } from "../../lib/home-apps";
import { colors, shadowLift } from "../../theme/tokens";

const ITEM_SIZE = 64;
const SNAP_MS = 150;
const SWIPE_DISTANCE = 28;
const SWIPE_VELOCITY = 400;

type AppSwitcherArcProps = {
  open: boolean;
  activeAppId: HomeAppId;
  /** Space reserved for the bottom bar so the arc sits just above it. */
  bottomInset: number;
  onSelect: (app: HomeApp) => void;
  onDismiss: () => void;
};

function wrapDelta(delta: number, count: number): number {
  "worklet";
  let wrapped = ((delta % count) + count) % count;
  if (wrapped > count / 2) {
    wrapped -= count;
  }
  return wrapped;
}

function wrapIndex(value: number, length: number): number {
  "worklet";
  const mod = ((Math.round(value) % length) + length) % length;
  return mod;
}

function ArcItem({
  app,
  index,
  count,
  offset,
  radiusPx,
  onActivate,
}: {
  app: HomeApp;
  index: number;
  count: number;
  offset: SharedValue<number>;
  radiusPx: number;
  onActivate: (app: HomeApp, isApex: boolean) => void;
}) {
  const step = (2 * Math.PI) / count;

  const style = useAnimatedStyle(() => {
    const wrapped = wrapDelta(index - offset.value, count);
    const angle = -Math.PI / 2 + wrapped * step;
    const x = Math.cos(angle) * radiusPx;
    const y = Math.sin(angle) * radiusPx;
    const distance = Math.abs(wrapped);
    const apex = distance < 0.35;
    const opacity = Math.max(0.35, 1 - distance * 0.35);
    const scale = Math.max(0.78, 1 - distance * 0.12);

    return {
      transform: [{ translateX: x }, { translateY: y }, { scale }],
      opacity: apex ? 1 : opacity * 0.85,
      zIndex: apex ? 2 : 1,
    };
  });

  const handlePress = () => {
    const apexIndex = wrapIndex(offset.value, count);
    onActivate(app, apexIndex === index);
  };

  return (
    <Animated.View style={[styles.itemSlot, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={app.label}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.itemButton,
          pressed && styles.itemPressed,
        ]}
      >
        <MaterialCommunityIcons name={app.icon} size={26} color={colors.ink} />
        <Text style={styles.itemLabel} numberOfLines={1}>
          {app.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function AppSwitcherArc({
  open,
  activeAppId,
  bottomInset,
  onSelect,
  onDismiss,
}: AppSwitcherArcProps) {
  const { width } = useWindowDimensions();
  const apps = useMemo(() => [...HOME_APPS], []);
  const count = apps.length;
  const radiusPx = Math.min(132, width * 0.34);

  const offset = useSharedValue(
    Math.max(
      0,
      apps.findIndex((app) => app.id === activeAppId),
    ),
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const index = apps.findIndex((app) => app.id === activeAppId);
    // Instant open — no spring. Shared values are intentionally mutable.
    // eslint-disable-next-line react/immutability -- Reanimated SharedValue
    offset.value = index >= 0 ? index : 0;
  }, [activeAppId, apps, offset, open]);

  const rotateToIndex = useCallback(
    (targetIndex: number) => {
      const current = Math.round(offset.value);
      // Shortest signed step so taps don't reverse through the long way.
      const delta = wrapDelta(targetIndex - current, count);
      // eslint-disable-next-line react/immutability -- Reanimated SharedValue
      offset.value = withTiming(current + delta, { duration: SNAP_MS });
    },
    [count, offset],
  );

  const handleActivate = useCallback(
    (app: HomeApp, isApex: boolean) => {
      if (isApex) {
        onSelect(app);
        return;
      }
      const index = apps.findIndex((entry) => entry.id === app.id);
      if (index >= 0) {
        rotateToIndex(index);
      }
    },
    [apps, onSelect, rotateToIndex],
  );

  // Discrete ±1 snap on a continuous offset so wrap-around keeps swipe direction.
  // oxlint-disable-next-line react/capitalized-calls -- Gesture.Pan is a factory, not a component
  const pan = Gesture.Pan().onEnd((event) => {
    const current = Math.round(offset.value);
    const stepped =
      event.translationX <= -SWIPE_DISTANCE ||
      event.velocityX <= -SWIPE_VELOCITY
        ? 1
        : event.translationX >= SWIPE_DISTANCE ||
            event.velocityX >= SWIPE_VELOCITY
          ? -1
          : 0;
    // eslint-disable-next-line react/immutability -- Reanimated SharedValue
    offset.value = withTiming(current + stepped, { duration: SNAP_MS });
  });

  if (!open) {
    return null;
  }

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss app switcher"
        style={styles.backdrop}
        onPress={onDismiss}
      />

      <GestureDetector gesture={pan}>
        <View
          style={[
            styles.arc,
            {
              height: radiusPx + ITEM_SIZE + 36,
              marginBottom: bottomInset,
            },
          ]}
        >
          <View style={styles.arcStage}>
            {apps.map((app, index) => (
              <ArcItem
                key={app.id}
                app={app}
                index={index}
                count={count}
                offset={offset}
                radiusPx={radiusPx}
                onActivate={handleActivate}
              />
            ))}
          </View>
          <Text style={styles.hint}>Swipe to switch · tap top to open</Text>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(44, 36, 28, 0.28)",
  },
  arc: {
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 8,
  },
  arcStage: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  itemSlot: {
    position: "absolute",
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    left: ITEM_SIZE / 2,
    top: ITEM_SIZE / 2,
    marginLeft: -ITEM_SIZE / 2,
    marginTop: -ITEM_SIZE / 2,
  },
  itemButton: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadowLift,
  },
  itemPressed: {
    opacity: 0.85,
  },
  itemLabel: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: "700",
  },
  hint: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
});

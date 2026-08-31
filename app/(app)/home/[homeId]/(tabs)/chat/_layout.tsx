import { Stack } from "expo-router";
import { navScreenOptions } from "../../../../../../theme/paper-theme";

/**
 * Chat is a stack inside the Chat tab, so the conversation list and a thread
 * are separate screens with a real back gesture.
 *
 * Nesting the stack inside `(tabs)` keeps the tab bar visible over a thread,
 * matching the web layout where the bottom tabs stayed put. Move this directory
 * out of `(tabs)` if a full-screen thread is wanted instead.
 */
export default function ChatLayout() {
  return (
    <Stack screenOptions={{ ...navScreenOptions, headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Chat" }} />
      <Stack.Screen name="new" options={{ title: "New chat" }} />
      <Stack.Screen name="[conversationId]" options={{ title: "Chat" }} />
    </Stack>
  );
}

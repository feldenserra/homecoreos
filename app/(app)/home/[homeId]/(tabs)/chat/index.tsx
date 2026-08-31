import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, IconButton } from "react-native-paper";
import {
  ErrorText,
  LoadingScreen,
  MetaLabel,
  Muted,
  Screen,
} from "../../../../../../components/ui";
import { useAsync } from "../../../../../../hooks/use-async";
import {
  deleteConversation,
  listConversations,
} from "../../../../../../lib/api/chat";
import { useHome } from "../../../../../../lib/home-context";
import { colors, radius, TOUCH_TARGET } from "../../../../../../theme/tokens";

/**
 * The conversation list. Was the collapsible sidebar inside chat-app.tsx.
 *
 * Titles arrive already decrypted from the `conversations` Edge Function — the
 * client cannot read them itself.
 */
export default function ChatListScreen() {
  const home = useHome();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const state = useAsync(
    async () => await listConversations(home.id),
    [home.id],
  );

  useFocusEffect(
    useCallback(() => {
      void state.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [home.id]),
  );

  const remove = useCallback(
    async (conversationId: string) => {
      setActionError(null);
      setBusyId(conversationId);
      try {
        await deleteConversation(home.id, conversationId);
        await state.refresh();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Could not delete chat.",
        );
      } finally {
        setBusyId(null);
      }
    },
    [home.id, state],
  );

  const confirmRemove = useCallback(
    (conversationId: string, title: string) => {
      // Alert is unavailable on web; there, confirm() is the equivalent.
      if (Platform.OS === "web") {
        // eslint-disable-next-line no-alert
        if (globalThis.confirm?.(`Delete "${title}"?`)) {
          void remove(conversationId);
        }
        return;
      }

      Alert.alert("Delete chat?", title, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void remove(conversationId),
        },
      ]);
    },
    [remove],
  );

  if (state.loading && !state.data) {
    return <LoadingScreen />;
  }

  const conversations = state.data ?? [];

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              icon="plus"
              accessibilityLabel="New chat"
              onPress={() => router.push(`/home/${home.id}/chat/new`)}
            />
          ),
        }}
      />
      <Screen scroll style={styles.screen}>
        <ErrorText>{state.error ?? actionError}</ErrorText>

        {conversations.length === 0 ? (
          <View style={styles.empty}>
            <Muted>No chats yet. Ask the house something.</Muted>
            <Button
              mode="contained"
              onPress={() => router.push(`/home/${home.id}/chat/new`)}
            >
              New chat
            </Button>
          </View>
        ) : (
          <View style={styles.list}>
            <MetaLabel>Chats</MetaLabel>
            {conversations.map((conversation) => (
              <View key={conversation.id} style={styles.row}>
                <Pressable
                  accessibilityRole="button"
                  style={styles.rowMain}
                  disabled={busyId === conversation.id}
                  onPress={() =>
                    router.push(`/home/${home.id}/chat/${conversation.id}`)
                  }
                >
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {conversation.title}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {new Date(conversation.updatedAt).toLocaleDateString()}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${conversation.title}`}
                  hitSlop={8}
                  style={styles.rowAction}
                  disabled={busyId === conversation.id}
                  onPress={() =>
                    confirmRemove(conversation.id, conversation.title)
                  }
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Button
          mode="text"
          textColor={colors.muted}
          style={styles.settingsLink}
          onPress={() => router.push(`/home/${home.id}/settings/ai`)}
        >
          AI settings
        </Button>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  empty: { gap: 12, alignItems: "flex-start" },
  list: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowMain: {
    flex: 1,
    gap: 2,
    minHeight: TOUCH_TARGET,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  rowAction: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsLink: { alignSelf: "flex-start" },
});

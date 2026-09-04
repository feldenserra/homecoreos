import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, IconButton, TextInput } from "react-native-paper";
import { listAiKeys, type AiKeyListItem } from "../../lib/api/ai-keys";
import {
  getConversation,
  streamChat,
  type ChatMessageRow,
} from "../../lib/api/chat";
import {
  beginChatStream,
  canAdoptChatStream,
  clearChatStreamHandoff,
  finishChatStream,
  getChatStreamSnapshot,
  releaseChatStreamOwner,
  setChatStreamConversationId,
  setChatStreamError,
  subscribeChatStream,
  updateChatStreamMessages,
  type ChatUiMessage,
} from "../../lib/chat-stream-session";
import {
  DEFAULT_SYSTEM_PROMPT,
  MAX_SYSTEM_PROMPT_LENGTH,
} from "../../lib/chat-prompt";
import { AI_KEY_SOURCE_LABELS, type AiKeySource } from "../../lib/types";
import {
  colors,
  INPUT_FONT_SIZE,
  radius,
  TOUCH_TARGET,
} from "../../theme/tokens";
import { ErrorText, LoadingScreen, MetaLabel, Muted } from "../ui";

/**
 * One conversation. Replaces the message half of components/chat/chat-app.tsx.
 *
 * The web component was a single 536-line screen holding the conversation
 * sidebar, the message list and the composer. The sidebar is now its own route
 * (chat/index.tsx) because a collapsible sidebar has no place on a phone; this
 * component is only the thread.
 *
 * Two things worth knowing about the flow:
 *
 *  - A conversation is created implicitly by the first send. When
 *    `conversationId` is absent the chat function inserts one and reports the id
 *    back on the `meta` frame, at which point we swap the URL. On native that
 *    remounts this component; live stream state lives in chat-stream-session so
 *    the SSE is not aborted mid-handoff.
 *  - The provider locks on first message. Once a thread has history, the model
 *    picker disappears, because the function refuses to switch a locked chat.
 */

type UiMessage = ChatUiMessage;

function keyLabel(key: AiKeyListItem): string {
  const provider = AI_KEY_SOURCE_LABELS[key.source];
  return key.model ? `${provider} · ${key.model}` : provider;
}

function toUiMessage(row: ChatMessageRow): UiMessage {
  return { id: row.id, role: row.role, content: row.content };
}

export function ChatView({
  homeId,
  conversationId,
}: {
  homeId: string;
  conversationId?: string;
}) {
  const adopted = canAdoptChatStream(homeId, conversationId);
  const initialSession = adopted ? getChatStreamSnapshot() : null;

  const [messages, setMessages] = useState<UiMessage[]>(
    () => initialSession?.messages ?? [],
  );
  const [systemPrompt, setSystemPrompt] = useState(
    () => initialSession?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
  );
  const [aiSource, setAiSource] = useState<AiKeySource | null>(
    () => initialSession?.aiSource ?? null,
  );
  const [aiModel, setAiModel] = useState<string | null>(
    () => initialSession?.aiModel ?? null,
  );
  const [keys, setKeys] = useState<AiKeyListItem[]>([]);
  const [promptOpen, setPromptOpen] = useState(false);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(
    () => initialSession?.streaming ?? false,
  );
  const [loading, setLoading] = useState(
    () => Boolean(conversationId) && !adopted,
  );
  const [error, setError] = useState<string | null>(
    () => initialSession?.error ?? null,
  );

  const scrollRef = useRef<ScrollView | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // A thread with history has its provider locked server-side.
  const chatLocked = messages.length > 0;
  const canSend = Boolean(
    input.trim() && !streaming && (chatLocked || aiSource),
  );

  // Keep UI subscribed to the live stream after /new → /[id] remount.
  // Initial message/streaming state is already seeded from the session above.
  useEffect(() => {
    if (!canAdoptChatStream(homeId, conversationId)) {
      return;
    }

    clearChatStreamHandoff();

    return subscribeChatStream((next) => {
      if (next.homeId !== homeId) {
        return;
      }
      if (
        conversationId &&
        next.conversationId &&
        next.conversationId !== conversationId
      ) {
        return;
      }
      setMessages(next.messages);
      setStreaming(next.streaming);
      setError(next.error);
      setSystemPrompt(next.systemPrompt);
      setAiSource(next.aiSource);
      setAiModel(next.aiModel);
    });
  }, [homeId, conversationId]);

  useEffect(() => {
    let active = true;

    // Live handoff: skip the blank reload that would wipe streaming tokens.
    if (canAdoptChatStream(homeId, conversationId)) {
      void listAiKeys()
        .then((loadedKeys) => {
          if (active) {
            setKeys(loadedKeys);
          }
        })
        .catch(() => {
          /* keys are optional once a thread is locked */
        });
      return () => {
        active = false;
      };
    }

    void (async () => {
      try {
        const [loadedKeys, detail] = await Promise.all([
          listAiKeys(),
          conversationId
            ? getConversation(homeId, conversationId)
            : Promise.resolve(null),
        ]);

        if (!active) {
          return;
        }

        setKeys(loadedKeys);

        if (detail) {
          setMessages(detail.messages.map(toUiMessage));
          setSystemPrompt(detail.conversation.systemPrompt || DEFAULT_SYSTEM_PROMPT);
          setAiSource(detail.conversation.aiSource);
          setAiModel(detail.conversation.aiModel);
        } else if (loadedKeys.length === 1) {
          // One configured provider is not a choice; preselect it.
          setAiSource(loadedKeys[0].source);
          setAiModel(loadedKeys[0].model);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load chat.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [homeId, conversationId]);

  // Cancel an in-flight stream only when leaving the thread for real — not
  // during the Expo remount that follows first-message meta handoff.
  useEffect(
    () => () => {
      releaseChatStreamOwner(homeId, conversationId);
      abortRef.current = null;
    },
    [homeId, conversationId],
  );

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  useEffect(scrollToEnd, [messages, scrollToEnd]);

  const send = useCallback(async () => {
    const message = input.trim();
    if (!message || streaming) {
      return;
    }

    setError(null);
    setInput("");
    setStreaming(true);

    // Optimistic local ids; the server's real ids arrive on meta/done. Only the
    // assistant placeholder needs replacing as deltas stream in.
    const localUserId = `local-user-${Date.now()}`;
    const localAssistantId = `local-assistant-${Date.now()}`;

    const nextMessages: UiMessage[] = [
      ...messages,
      { id: localUserId, role: "user", content: message },
      { id: localAssistantId, role: "assistant", content: "" },
    ];
    setMessages(nextMessages);

    const controller = new AbortController();
    abortRef.current = controller;

    beginChatStream({
      homeId,
      conversationId: conversationId ?? null,
      messages: nextMessages,
      systemPrompt,
      aiSource,
      aiModel,
      abort: controller,
    });

    let assistantText = "";
    let workingMessages = nextMessages;

    const pushMessages = (updater: (current: UiMessage[]) => UiMessage[]) => {
      workingMessages = updater(workingMessages);
      setMessages(workingMessages);
      updateChatStreamMessages(workingMessages);
    };

    try {
      await streamChat(
        {
          homeId,
          conversationId,
          message,
          systemPrompt,
          aiSource: aiSource ?? undefined,
        },
        {
          onMeta: (meta) => {
            pushMessages((current) =>
              current.map((entry) =>
                entry.id === localUserId
                  ? { ...entry, id: meta.userMessageId }
                  : entry,
              ),
            );

            // First send on a brand-new thread: adopt the id the server made.
            // Mark handoff before replace so the unmounting /new screen does
            // not abort the still-running stream.
            if (!conversationId) {
              setChatStreamConversationId(meta.conversationId);
              router.replace(
                `/home/${homeId}/chat/${meta.conversationId}`,
              );
            }
          },
          onDelta: (text) => {
            assistantText += text;
            pushMessages((current) =>
              current.map((entry) =>
                entry.id === localAssistantId
                  ? { ...entry, content: assistantText }
                  : entry,
              ),
            );
            scrollToEnd();
          },
          onDone: (done) => {
            pushMessages((current) =>
              current.map((entry) =>
                entry.id === localAssistantId
                  ? { ...entry, id: done.assistantMessageId }
                  : entry,
              ),
            );
          },
          onError: (detail) => {
            setError(detail);
            setChatStreamError(detail);
          },
        },
        controller.signal,
      );
    } catch (err) {
      const detail =
        err instanceof Error ? err.message : "Could not send message.";
      setError(detail);
      setChatStreamError(detail);
      // Drop the empty assistant bubble so the thread does not show a blank turn.
      pushMessages((current) =>
        current.filter(
          (entry) => entry.id !== localAssistantId || entry.content.length > 0,
        ),
      );
    } finally {
      finishChatStream(workingMessages);
      setStreaming(false);
      abortRef.current = null;
    }
  }, [
    aiModel,
    aiSource,
    conversationId,
    homeId,
    input,
    messages,
    scrollToEnd,
    streaming,
    systemPrompt,
  ]);

  const visibleMessages = useMemo(
    () => messages.filter((message) => message.role !== "system"),
    [messages],
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        keyboardShouldPersistTaps="handled"
      >
        {!chatLocked ? (
          <View style={styles.setup}>
            {keys.length === 0 ? (
              <View style={styles.emptyProviders}>
                <Muted>
                  Add an AI provider before you can send a message.
                </Muted>
                <Button
                  mode="contained-tonal"
                  onPress={() => router.push(`/home/${homeId}/settings/chat`)}
                >
                  Chat settings
                </Button>
              </View>
            ) : (
              <>
                <MetaLabel>Model</MetaLabel>
                <View style={styles.sourceRow}>
                  {keys.map((key) => (
                    <Pressable
                      key={key.id}
                      accessibilityRole="button"
                      onPress={() => {
                        setAiSource(key.source);
                        setAiModel(key.model);
                      }}
                      style={({ pressed }) => [
                        styles.sourceChip,
                        aiSource === key.source && styles.sourceChipActive,
                        pressed && styles.sourceChipPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sourceChipText,
                          aiSource === key.source &&
                            styles.sourceChipTextActive,
                        ]}
                      >
                        {keyLabel(key)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={() => setPromptOpen((open) => !open)}
              style={styles.promptToggle}
            >
              <MaterialCommunityIcons
                name={promptOpen ? "chevron-down" : "chevron-right"}
                size={18}
                color={colors.muted}
              />
              <Text style={styles.promptToggleText}>Instructions</Text>
            </Pressable>

            {promptOpen ? (
              <TextInput
                label="System prompt"
                value={systemPrompt}
                onChangeText={setSystemPrompt}
                mode="outlined"
                multiline
                numberOfLines={4}
                maxLength={MAX_SYSTEM_PROMPT_LENGTH}
                style={styles.promptInput}
              />
            ) : null}
          </View>
        ) : null}

        {visibleMessages.length === 0 ? (
          <Muted>Ask the house anything.</Muted>
        ) : null}

        {visibleMessages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.bubble,
              message.role === "user" ? styles.bubbleUser : styles.bubbleAi,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                message.role === "user" && styles.bubbleTextUser,
              ]}
            >
              {message.content ||
                (streaming && message.role === "assistant" ? "…" : "")}
            </Text>
          </View>
        ))}

        <ErrorText>{error}</ErrorText>
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          mode="outlined"
          placeholder={
            chatLocked
              ? `Message ${aiModel ?? "the house"}`
              : "Ask the house…"
          }
          multiline
          maxLength={8000}
          dense
          style={styles.composerInput}
        />
        <IconButton
          icon="send"
          mode="contained"
          accessibilityLabel="Send"
          disabled={!canSend}
          loading={streaming}
          onPress={send}
          size={22}
          style={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  thread: { flex: 1 },
  threadContent: {
    padding: 16,
    gap: 10,
  },
  setup: {
    gap: 8,
    padding: 14,
    marginBottom: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyProviders: { gap: 10 },
  sourceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sourceChip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  sourceChipActive: {
    backgroundColor: colors.claySoft,
    borderColor: colors.clay,
  },
  sourceChipPressed: { opacity: 0.7 },
  sourceChipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  sourceChipTextActive: { color: colors.ink },
  promptToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 32,
  },
  promptToggleText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  promptInput: {
    fontSize: INPUT_FONT_SIZE,
    backgroundColor: colors.surface,
  },
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: colors.clay,
  },
  bubbleAi: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  bubbleText: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextUser: { color: "#ffffff" },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.paper,
  },
  composerInput: {
    flex: 1,
    maxHeight: 120,
    fontSize: INPUT_FONT_SIZE,
    backgroundColor: colors.surface,
  },
  sendButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    margin: 0,
  },
});

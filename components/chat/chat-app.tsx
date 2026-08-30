"use client";

import {
  ActionIcon,
  Button,
  Collapse,
  ScrollArea,
  Select,
  Stack,
  Text,
  Textarea,
  UnstyledButton,
} from "@mantine/core";
import { IconMessages, IconSend, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  getAiKeysForUser,
  type AiKeyListItem,
} from "../../app/app/ai-key-actions";
import {
  createConversation,
  deleteConversation,
} from "../../app/app/chat-actions";
import {
  DEFAULT_SYSTEM_PROMPT,
  MAX_SYSTEM_PROMPT_LENGTH,
} from "../../lib/chat-prompt";
import {
  AI_KEY_SOURCE_LABELS,
  AI_KEY_SOURCES,
  type AiKeySource,
} from "../../lib/types";
import { AiSettings } from "./ai-settings";

export type ChatConversationListItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export type ChatUiMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

function isAiKeySource(value: string): value is AiKeySource {
  return (AI_KEY_SOURCES as readonly string[]).includes(value);
}

function keyLabel(key: AiKeyListItem) {
  const provider = AI_KEY_SOURCE_LABELS[key.source];
  return key.model ? `${provider} · ${key.model}` : provider;
}

export function ChatApp({
  homeId,
  conversations,
  activeConversationId,
  initialMessages,
  initialSystemPrompt,
  initialAiSource,
  initialAiModel,
}: {
  homeId: string;
  conversations: ChatConversationListItem[];
  activeConversationId: string | null;
  initialMessages: ChatUiMessage[];
  initialSystemPrompt: string;
  initialAiSource: AiKeySource | null;
  initialAiModel: string | null;
}) {
  const router = useRouter();
  const [mutating, setMutating] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [systemPrompt, setSystemPrompt] = useState(
    initialSystemPrompt || DEFAULT_SYSTEM_PROMPT,
  );
  const [aiSource, setAiSource] = useState<AiKeySource | null>(initialAiSource);
  const [aiModel, setAiModel] = useState(initialAiModel);
  const [keys, setKeys] = useState<AiKeyListItem[]>([]);
  const [promptOpen, setPromptOpen] = useState(false);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const base = `/app/${homeId}/home/chat`;
  const chatLocked = messages.length > 0;
  const canSend = Boolean(input.trim() && !streaming && (chatLocked || aiSource));

  async function loadKeys() {
    const result = await getAiKeysForUser();
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setKeys(result.keys);
  }

  const activeTitle =
    conversations.find((c) => c.id === activeConversationId)?.title ??
    "New chat";

  useEffect(() => {
    setMessages(initialMessages);
    setSystemPrompt(initialSystemPrompt || DEFAULT_SYSTEM_PROMPT);
    setAiSource(initialAiSource);
    setAiModel(initialAiModel);
    setPromptOpen(false);
  }, [
    initialMessages,
    activeConversationId,
    initialSystemPrompt,
    initialAiSource,
    initialAiModel,
  ]);

  useEffect(() => {
    void loadKeys();
  }, []);

  useEffect(() => {
    if (aiSource || keys.length !== 1) {
      return;
    }
    setAiSource(keys[0].source);
    setAiModel(keys[0].model);
  }, [keys, aiSource]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function onNewChat() {
    if (mutating || streaming) {
      return;
    }
    setError(null);
    setMutating(true);
    try {
      const result = await createConversation(homeId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSidebarOpen(false);
      router.push(`${base}/${result.id}`);
    } finally {
      setMutating(false);
    }
  }

  async function onDeleteChat(
    e: React.MouseEvent,
    conversationId: string,
    title: string,
  ) {
    e.preventDefault();
    e.stopPropagation();
    if (streaming || mutating) {
      return;
    }
    if (
      !window.confirm(
        `Delete “${title}”? This permanently removes the chat and all messages.`,
      )
    ) {
      return;
    }

    setError(null);
    setMutating(true);
    try {
      const result = await deleteConversation(homeId, conversationId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      if (activeConversationId === conversationId) {
        setMessages([]);
        router.replace(base);
      } else {
        router.refresh();
      }
    } finally {
      setMutating(false);
    }
  }

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming || (!chatLocked && !aiSource)) {
      return;
    }

    setError(null);
    setInput("");
    setStreaming(true);

    const tempUserId = `temp-user-${Date.now()}`;
    const tempAssistantId = `temp-assistant-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: tempUserId, role: "user", content: text },
      { id: tempAssistantId, role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeId,
          conversationId: activeConversationId ?? undefined,
          message: text,
          systemPrompt,
          aiSource: chatLocked ? undefined : aiSource,
        }),
      });

      if (!res.ok || !res.body) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Chat request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let routedConversationId = activeConversationId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          let event = "message";
          let dataLine = "";
          for (const line of lines) {
            if (line.startsWith("event:")) {
              event = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataLine += line.slice(5).trim();
            }
          }
          if (!dataLine) {
            continue;
          }

          const data = JSON.parse(dataLine) as {
            conversationId?: string;
            text?: string;
            error?: string;
          };

          if (event === "meta" && data.conversationId) {
            routedConversationId = data.conversationId;
          } else if (event === "delta" && data.text) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId
                  ? { ...m, content: m.content + data.text }
                  : m,
              ),
            );
          } else if (event === "error") {
            throw new Error(data.error ?? "Stream error");
          } else if (event === "done" && data.conversationId) {
            routedConversationId = data.conversationId;
          }
        }
      }

      if (
        routedConversationId &&
        routedConversationId !== activeConversationId
      ) {
        router.push(`${base}/${routedConversationId}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempAssistantId || m.content.length > 0),
      );
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="chat-layout">
      <aside
        className={`chat-sidebar${sidebarOpen ? " chat-sidebar--open" : ""}`}
      >
        <div className="chat-sidebar-top">
          <Stack gap={8}>
            <Button
              fullWidth
              onClick={onNewChat}
              loading={mutating}
              disabled={streaming}
            >
              New chat
            </Button>
            <AiSettings onKeysChange={() => void loadKeys()} />
          </Stack>
        </div>
        <ScrollArea className="chat-sidebar-list" type="scroll">
          <Stack gap={4} p="xs">
            {conversations.length === 0 ? (
              <Text size="sm" c="dimmed" px="xs" py="sm">
                No chats yet
              </Text>
            ) : (
              conversations.map((c) => {
                const active = c.id === activeConversationId;
                return (
                  <div
                    key={c.id}
                    className={`chat-conv-row${active ? " chat-conv-row--active" : ""}`}
                  >
                    <UnstyledButton
                      component={Link}
                      href={`${base}/${c.id}`}
                      className={`chat-conv-link${active ? " chat-conv-link--active" : ""}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Text size="sm" fw={550} lineClamp={1}>
                        {c.title}
                      </Text>
                    </UnstyledButton>
                    <ActionIcon
                      className="chat-conv-delete"
                      variant="subtle"
                      color="gray"
                      size="sm"
                      aria-label={`Delete ${c.title}`}
                      disabled={mutating || streaming}
                      onClick={(e) => void onDeleteChat(e, c.id, c.title)}
                    >
                      <IconTrash size={14} stroke={1.7} />
                    </ActionIcon>
                  </div>
                );
              })
            )}
          </Stack>
        </ScrollArea>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="chat-sidebar-backdrop"
          aria-label="Close chats"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <section className="chat-main">
        <div className="chat-main-toolbar">
          <ActionIcon
            variant="subtle"
            color="gray"
            hiddenFrom="sm"
            aria-label="Chats"
            onClick={() => setSidebarOpen(true)}
          >
            <IconMessages size={20} stroke={1.7} />
          </ActionIcon>
          <Text size="sm" fw={600} lineClamp={1} style={{ flex: 1 }}>
            {activeConversationId ? activeTitle : "New chat"}
          </Text>
          {chatLocked ? (
            <UnstyledButton
              className="chat-prompt-toggle"
              onClick={() => setPromptOpen((open) => !open)}
            >
              <Text size="sm" c="dimmed">
                {promptOpen ? "Hide" : "More"}
              </Text>
            </UnstyledButton>
          ) : null}
        </div>

        {chatLocked ? (
          <Collapse expanded={promptOpen}>
            <div className="chat-prompt-recall">
              <Text size="xs" fw={600} c="dimmed" mb={4}>
                AI
              </Text>
              <Text size="sm" c="dimmed">
                {aiSource
                  ? `${AI_KEY_SOURCE_LABELS[aiSource]}${aiModel ? ` · ${aiModel}` : ""}`
                  : "Not set"}
              </Text>
              <Text size="xs" fw={600} c="dimmed" mt="sm" mb={4}>
                Instructions
              </Text>
              <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                {systemPrompt}
              </Text>
            </div>
          </Collapse>
        ) : null}

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <Text className="display-title" fz={26}>
                What’s for dinner?
              </Text>
              <Text size="sm" c="dimmed" mt={8} maw={360}>
                Ask what’s still open, what’s for dinner, or what to do next.
              </Text>
              {keys.length === 0 ? (
                <Text size="sm" c="dimmed" mt="lg" maw={360}>
                  Add an AI setting first, then choose it here.
                </Text>
              ) : (
                <Select
                  className="chat-empty-prompt"
                  label="AI"
                  description="This is locked after you send the first message."
                  data={keys.map((key) => ({
                    value: key.source,
                    label: keyLabel(key),
                  }))}
                  value={aiSource}
                  onChange={(value) => {
                    if (!value || !isAiKeySource(value)) {
                      return;
                    }
                    const selected = keys.find((key) => key.source === value);
                    setAiSource(value);
                    setAiModel(selected?.model ?? null);
                  }}
                  disabled={streaming}
                  mt="lg"
                />
              )}
              <Textarea
                className="chat-empty-prompt"
                label="Instructions"
                description="Set how the assistant should behave. You can change this before sending."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.currentTarget.value)}
                minRows={3}
                maxRows={8}
                autosize
                maxLength={MAX_SYSTEM_PROMPT_LENGTH}
                disabled={streaming}
                mt="md"
              />
            </div>
          ) : (
            <Stack gap="md" maw={720} mx="auto" w="100%" px="md" py="md">
              {messages
                .filter((m) => m.role !== "system")
                .map((m) => (
                  <div
                    key={m.id}
                    className={`chat-row chat-row--${m.role}`}
                  >
                    <div className={`chat-bubble chat-bubble--${m.role}`}>
                      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                        {m.content || (streaming ? "…" : "")}
                      </Text>
                    </div>
                  </div>
                ))}
              <div ref={bottomRef} />
            </Stack>
          )}
        </div>

        <form className="chat-composer" onSubmit={onSend}>
          <Stack gap="xs" maw={720} mx="auto" w="100%">
            {error ? (
              <Text size="sm" c="red">
                {error}
              </Text>
            ) : null}
            <div className="chat-composer-row">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                placeholder="Ask the house…"
                minRows={1}
                maxRows={6}
                autosize
                disabled={streaming || (!chatLocked && !aiSource)}
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void onSend(e);
                  }
                }}
              />
              <ActionIcon
                type="submit"
                className="chat-send"
                size={44}
                radius="md"
                variant="filled"
                color="clay"
                loading={streaming}
                disabled={!canSend}
                aria-label="Send"
              >
                <IconSend size={18} stroke={1.8} />
              </ActionIcon>
            </div>
          </Stack>
        </form>
      </section>
    </div>
  );
}

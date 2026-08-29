"use client";

import { Button, ScrollArea, Stack, Text, Textarea, UnstyledButton } from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createConversation } from "../../app/app/chat-actions";

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

export function ChatApp({
  homeId,
  conversations,
  activeConversationId,
  initialMessages,
}: {
  homeId: string;
  conversations: ChatConversationListItem[];
  activeConversationId: string | null;
  initialMessages: ChatUiMessage[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const base = `/app/${homeId}/home/chat`;

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, activeConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function onNewChat() {
    setError(null);
    startTransition(async () => {
      const result = await createConversation(homeId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSidebarOpen(false);
      router.push(`${base}/${result.id}`);
      router.refresh();
    });
  }

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) {
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
          <Button
            fullWidth
            radius="md"
            onClick={onNewChat}
            loading={pending}
            disabled={streaming}
          >
            New chat
          </Button>
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
                  <UnstyledButton
                    key={c.id}
                    component={Link}
                    href={`${base}/${c.id}`}
                    className={`chat-conv-link${active ? " chat-conv-link--active" : ""}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Text size="sm" fw={550} lineClamp={1}>
                      {c.title}
                    </Text>
                  </UnstyledButton>
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
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <section className="chat-main">
        <div className="chat-main-toolbar">
          <Button
            variant="subtle"
            color="gray"
            size="compact-md"
            hiddenFrom="sm"
            onClick={() => setSidebarOpen(true)}
          >
            Chats
          </Button>
          <Text size="sm" c="dimmed" visibleFrom="sm">
            {activeConversationId ? "Conversation" : "Start a new message"}
          </Text>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <Text fw={650} fz={22}>
                What can I help with?
              </Text>
              <Text size="sm" c="dimmed" mt={8} maw={360}>
                Ask about chores, meal ideas, or anything around the house.
              </Text>
            </div>
          ) : (
            <Stack gap="md" maw={720} mx="auto" w="100%" px="md" py="md">
              {messages
                .filter((m) => m.role !== "system")
                .map((m) => (
                  <div
                    key={m.id}
                    className={`chat-bubble chat-bubble--${m.role}`}
                  >
                    <Text size="xs" fw={600} c="dimmed" mb={4}>
                      {m.role === "user" ? "You" : "Assistant"}
                    </Text>
                    <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                      {m.content || (streaming ? "…" : "")}
                    </Text>
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
            <Textarea
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              placeholder="Message HomeCore…"
              minRows={1}
              maxRows={6}
              autosize
              radius="md"
              disabled={streaming}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend(e);
                }
              }}
            />
            <Button
              type="submit"
              radius="md"
              loading={streaming}
              disabled={!input.trim()}
              style={{ alignSelf: "flex-end" }}
            >
              Send
            </Button>
          </Stack>
        </form>
      </section>
    </div>
  );
}

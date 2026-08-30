import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import { ChatApp } from "../../../../../../components/chat/chat-app";
import { DEFAULT_SYSTEM_PROMPT } from "../../../../../../lib/chat-prompt";
import { isValidHomeId, normalizeHomeId } from "../../../../../../lib/home-id";
import { getHomeForMember } from "../../../../actions";
import {
  getConversationForMember,
  getConversationsForHome,
  getMessagesForConversation,
} from "../../../../chat-actions";

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ homeId: string; conversationId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { homeId: raw, conversationId } = await params;
  const homeId = normalizeHomeId(raw);
  if (!isValidHomeId(homeId)) {
    redirect("/app");
  }

  const home = await getHomeForMember(session.user.id, homeId);
  if (!home) {
    redirect("/app");
  }

  const conversation = await getConversationForMember(
    session.user.id,
    homeId,
    conversationId,
  );
  if (!conversation) {
    redirect(`/app/${homeId}/home/chat`);
  }

  const [conversations, messages] = await Promise.all([
    getConversationsForHome(session.user.id, homeId),
    getMessagesForConversation(session.user.id, homeId, conversationId),
  ]);

  return (
    <main className="chat-page">
      <ChatApp
        homeId={home.id}
        conversations={conversations.map((c) => ({
          id: c.id,
          title: c.title,
          updatedAt: c.updatedAt.toISOString(),
        }))}
        activeConversationId={conversation.id}
        initialMessages={messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))}
        initialSystemPrompt={
          conversation.systemPrompt || DEFAULT_SYSTEM_PROMPT
        }
        initialAiSource={conversation.aiSource}
        initialAiModel={conversation.aiModel}
      />
    </main>
  );
}

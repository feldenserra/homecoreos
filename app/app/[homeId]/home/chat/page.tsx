import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { ChatApp } from "../../../../../components/chat/chat-app";
import { DEFAULT_SYSTEM_PROMPT } from "../../../../../lib/chat-prompt";
import { isValidHomeId, normalizeHomeId } from "../../../../../lib/home-id";
import { getHomeForMember } from "../../../actions";
import { getConversationsForHome } from "../../../chat-actions";

export default async function ChatIndexPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { homeId: raw } = await params;
  const homeId = normalizeHomeId(raw);
  if (!isValidHomeId(homeId)) {
    redirect("/app");
  }

  const home = await getHomeForMember(session.user.id, homeId);
  if (!home) {
    redirect("/app");
  }

  const conversations = await getConversationsForHome(session.user.id, homeId);

  return (
    <main className="chat-page">
      <ChatApp
        homeId={home.id}
        conversations={conversations.map((c) => ({
          id: c.id,
          title: c.title,
          updatedAt: c.updatedAt.toISOString(),
        }))}
        activeConversationId={null}
        initialMessages={[]}
        initialSystemPrompt={DEFAULT_SYSTEM_PROMPT}
        initialAiSource={null}
        initialAiModel={null}
      />
    </main>
  );
}

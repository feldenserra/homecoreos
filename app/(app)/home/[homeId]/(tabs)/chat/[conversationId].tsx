import { Redirect, useLocalSearchParams } from "expo-router";
import { ChatView } from "../../../../../../components/chat/chat-view";
import { useHome } from "../../../../../../lib/home-context";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Replaces app/app/[homeId]/home/chat/[conversationId]/page.tsx. */
export default function ConversationScreen() {
  const home = useHome();
  const params = useLocalSearchParams<{ conversationId: string | string[] }>();

  // Dynamic segments are typed as string but are string | string[] at runtime.
  const conversationId = Array.isArray(params.conversationId)
    ? params.conversationId[0]
    : params.conversationId;

  if (!conversationId || !UUID_RE.test(conversationId)) {
    return <Redirect href={`/home/${home.id}/chat`} />;
  }

  return <ChatView homeId={home.id} conversationId={conversationId} />;
}

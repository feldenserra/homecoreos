import { ChatView } from "../../../../../../components/chat/chat-view";
import { useHome } from "../../../../../../lib/home-context";

/**
 * A thread that does not exist yet.
 *
 * No row is inserted here — the chat Edge Function creates the conversation on
 * the first message and reports its id back, at which point ChatView swaps the
 * route. That is the same implicit-creation flow the web app had; it just did
 * not need a separate URL for it.
 *
 * The literal segment "new" wins over [conversationId] in Expo Router's
 * matching, and conversation ids are uuids, so the two can never collide.
 */
export default function NewChatScreen() {
  const home = useHome();
  return <ChatView homeId={home.id} />;
}

import { Redirect } from "expo-router";
import { useHome } from "../../../../../lib/home-context";

/** Old AI settings URL — the form now lives under Chat settings. */
export default function AiSettingsRedirect() {
  const home = useHome();
  return <Redirect href={`/home/${home.id}/settings/chat`} />;
}

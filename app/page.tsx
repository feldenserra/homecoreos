import { redirect } from "next/navigation";
import { auth } from "../auth";
import { LandingPage } from "../components/landing/landing-page";
import { isRunningLocal } from "../lib/running-local";

export default async function HomePage() {
  const runningLocal = isRunningLocal();
  if (!runningLocal) {
    return <LandingPage showLogin={runningLocal} />;
  }

  const session = await auth();
  if (session?.user) {
    redirect("/app");
  }
  redirect("/login");
}

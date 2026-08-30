import { redirect } from "next/navigation";
import { auth } from "../auth";
import { LandingPage } from "../components/landing/landing-page";
import { hasUnlimitedAccess } from "../lib/revenuecat/server";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) {
    if (await hasUnlimitedAccess(session.user.id)) {
      redirect("/app");
    }
    redirect("/subscribe");
  }

  return <LandingPage />;
}

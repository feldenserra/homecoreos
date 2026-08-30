import { redirect } from "next/navigation";
import { auth } from "../auth";
import { LandingPage } from "../components/landing/landing-page";
import { loginsAllowed } from "../lib/allow-logins";

export default async function HomePage() {
  const allowLogins = loginsAllowed();
  if (allowLogins) {
    const session = await auth();
    if (session?.user?.id) {
      redirect("/app");
    }
  }

  return <LandingPage allowLogins={allowLogins} />;
}

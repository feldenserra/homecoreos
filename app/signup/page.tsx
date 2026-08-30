import { Text, Title } from "@mantine/core";
import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { hasUnlimitedAccess } from "../../lib/revenuecat/server";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const session = await auth();
  if (session?.user?.id) {
    if (await hasUnlimitedAccess(session.user.id)) {
      redirect("/app");
    }
    redirect("/subscribe");
  }

  return (
    <main className="login-page">
      <div className="login-panel">
        <Title order={1} className="wordmark" fz={36} mb={4}>
          HomeCore
        </Title>
        <Text c="dimmed" size="sm" mb="xl">
          Subscribe to access everything for the house.
        </Text>
        <SignupForm />
      </div>
    </main>
  );
}

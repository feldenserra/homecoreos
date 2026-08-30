import { Button, Text, Title } from "@mantine/core";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../auth";
import { RevenueCatProvider } from "../../components/billing/revenuecat-provider";
import { SubscribeCheckout } from "../../components/billing/subscribe-checkout";
import { isSubscriptionPlan } from "../../lib/revenuecat/constants";
import { hasUnlimitedAccess } from "../../lib/revenuecat/server";

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (await hasUnlimitedAccess(session.user.id)) {
    redirect("/app");
  }

  const { plan: rawPlan } = await searchParams;
  const plan = rawPlan && isSubscriptionPlan(rawPlan) ? rawPlan : null;

  return (
    <main className="login-page">
      <div className="login-panel">
        <Title order={1} className="wordmark" fz={36} mb={4}>
          HomeCore
        </Title>
        <Text c="dimmed" size="sm" mb="xl">
          Unlock unlimited access for this account.
        </Text>
        <div className="login-form">
          <RevenueCatProvider userId={session.user.id}>
            <SubscribeCheckout
              email={session.user.email ?? null}
              plan={plan}
            />
          </RevenueCatProvider>
          <form
            className="subscribe-signout"
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="subtle" color="gray" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}

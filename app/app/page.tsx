import { Button, Stack, Text, Title } from "@mantine/core";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../auth";
import { MAX_CREATED_HOMES, MAX_JOINED_HOMES } from "../../lib/home-id";
import { getHomeQuota, getHomesForUser } from "./actions";
import { HomeGate } from "./home-gate";

export default async function AppGatePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [homes, quota] = await Promise.all([
    getHomesForUser(session.user.id),
    getHomeQuota(session.user.id),
  ]);

  return (
    <main className="home-gate-page">
      <Stack gap="xl" maw={420} mx="auto" w="100%">
        <Stack gap={6}>
          <Text className="wordmark" fz={22}>
            HomeCore
          </Text>
          <Title order={1} className="display-title" fz={32} fw={550} lh={1.15}>
            Which house?
          </Title>
          <Text size="sm" c="dimmed" maw={360}>
            Create one home, or join others with a 12-character invite code.
          </Text>
        </Stack>

        <HomeGate
          homes={homes}
          canCreate={quota.createdCount < MAX_CREATED_HOMES}
          remainingJoins={Math.max(0, MAX_JOINED_HOMES - quota.joinedCount)}
        />

        <form
          className="home-gate-signout"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="subtle" color="gray" size="sm">
            Sign out
          </Button>
        </form>
      </Stack>
    </main>
  );
}

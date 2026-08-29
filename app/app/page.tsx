import { Button, Stack, Text, Title } from "@mantine/core";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../auth";
import { getHomesForUser } from "./actions";
import { HomeGate } from "./home-gate";

export default async function AppGatePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const homes = await getHomesForUser(session.user.id);

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
            Create a shared space or join one with an invite code.
          </Text>
        </Stack>

        <HomeGate homes={homes} />

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

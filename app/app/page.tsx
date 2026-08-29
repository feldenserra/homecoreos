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
    <main className="app-shell">
      <Stack gap="xl" p="md" pt="xl" maw={480} mx="auto" w="100%">
        <Stack gap={6}>
          <Text
            size="xs"
            tt="uppercase"
            fw={600}
            lts={1.2}
            c="dimmed"
            className="brand-mark"
          >
            HomeCore
          </Text>
          <Title order={1} fz={28} fw={650} lh={1.15}>
            Choose a home
          </Title>
          <Text size="sm" c="dimmed" maw={360}>
            Create a new shared space or join one with an invite code.
          </Text>
        </Stack>

        <HomeGate homes={homes} />

        <form
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

import { Center } from "@mantine/core";
import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/app");
  }

  return (
    <Center mih="100vh" p="md">
      <LoginForm />
    </Center>
  );
}

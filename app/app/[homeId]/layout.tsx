import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { getHomeForMember } from "../actions";
import { isValidHomeId, normalizeHomeId } from "../../../lib/home-id";

export default async function HomeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ homeId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { homeId: raw } = await params;
  const homeId = normalizeHomeId(raw);

  if (!isValidHomeId(homeId)) {
    redirect("/app");
  }

  const home = await getHomeForMember(session.user.id, homeId);
  if (!home) {
    redirect("/app");
  }

  return children;
}

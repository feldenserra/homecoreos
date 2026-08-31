import { createContext, useContext, type ReactNode } from "react";
import type { HomeSummary } from "./api/homes";

/**
 * The household the current screens belong to.
 *
 * Resolved once in app/(app)/home/[homeId]/_layout.tsx. The web app called
 * `getHomeForMember(userId, homeId)` again in the layout and in every child
 * page; a context means one query per navigation instead of four.
 */
const HomeContext = createContext<HomeSummary | null>(null);

export function HomeProvider({
  home,
  children,
}: {
  home: HomeSummary;
  children: ReactNode;
}) {
  return <HomeContext.Provider value={home}>{children}</HomeContext.Provider>;
}

export function useHome(): HomeSummary {
  const home = useContext(HomeContext);
  if (!home) {
    throw new Error("useHome must be used inside a HomeProvider");
  }
  return home;
}

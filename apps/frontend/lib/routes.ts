export const ROUTES = {
  HOME: "/",
  SEARCH: "/search",
  DASHBOARD: "/dashboard",
  ASSISTANT: "/assistant",
  ITINERARIES: "/itineraries",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
} as const;

export const NAV_LINKS = [
  { href: ROUTES.HOME, label: "Home" },
  { href: ROUTES.SEARCH, label: "Search" },
  { href: ROUTES.ITINERARIES, label: "Plan" },
  { href: ROUTES.DASHBOARD, label: "Trips" },
  { href: ROUTES.ASSISTANT, label: "Assistant" },
] as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

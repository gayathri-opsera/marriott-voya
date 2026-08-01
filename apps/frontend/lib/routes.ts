export const ROUTES = {
  HOME: "/",
  BROWSE: "/browse",
  SEARCH: "/search",
  DASHBOARD: "/dashboard",
  ASSISTANT: "/assistant",
  ITINERARIES: "/itineraries",
  PROFILE: "/profile",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
} as const;

export const NAV_LINKS = [
  { href: ROUTES.HOME,       label: "Home" },
  { href: ROUTES.BROWSE,     label: "Browse villas" },
  { href: ROUTES.SEARCH,     label: "Search & book" },
  { href: ROUTES.ASSISTANT,  label: "Plan with AI" },
  { href: ROUTES.DASHBOARD,  label: "My trips" },
  { href: ROUTES.PROFILE,    label: "Account" },
] as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

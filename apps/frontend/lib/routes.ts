export const ROUTES = {
  HOME: "/",
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
  { href: ROUTES.SEARCH,     label: "Search & book" },
  { href: ROUTES.ASSISTANT,  label: "Plan with assistant" },
  { href: ROUTES.DASHBOARD,  label: "My trips" },
  { href: ROUTES.PROFILE,    label: "Account" },
] as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

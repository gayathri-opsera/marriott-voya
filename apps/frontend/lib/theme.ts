const THEME_KEY = "voya-theme";
const THEME_CHANGE_EVENT = "voya-theme-change";

export type ThemePreference = "light" | "dark" | "system";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getTheme(): ThemePreference {
  if (!isBrowser()) return "system";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function setTheme(theme: ThemePreference): void {
  if (!isBrowser()) return;
  localStorage.setItem(THEME_KEY, theme);
  applyThemeClass(theme);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
}

export function resolveTheme(theme: ThemePreference = getTheme()): "light" | "dark" {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  if (!isBrowser()) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemeClass(theme: ThemePreference = getTheme()): void {
  if (!isBrowser()) return;
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function subscribeThemeChange(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, callback);
}

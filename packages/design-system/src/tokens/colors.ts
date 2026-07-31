export const colorTokens = {
  surface: {
    default: "var(--color-surface-default)",
    subtle: "var(--color-surface-subtle)",
    muted: "var(--color-surface-muted)",
    secondary: "var(--color-surface-secondary)",
    tertiary: "var(--color-surface-tertiary)",
  },
  text: {
    primary: "var(--color-text-primary)",
    secondary: "var(--color-text-secondary)",
    muted: "var(--color-text-muted)",
    tertiary: "var(--color-text-tertiary)",
    inverse: "var(--color-text-inverse)",
  },
  brand: {
    primary: "var(--color-brand-primary)",
    secondary: "var(--color-brand-secondary)",
  },
  status: {
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
    info: "var(--color-info)",
  },
  border: {
    default: "var(--color-border-default)",
    subtle: "var(--color-border-subtle)",
  },
} as const;

export type ColorToken = typeof colorTokens;

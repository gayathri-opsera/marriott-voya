import * as React from "react";

export function SkipLink(): React.JSX.Element {
  return (
    <a href="#main-content" className="sr-only focus:not-sr-only">
      Skip to main content
    </a>
  );
}

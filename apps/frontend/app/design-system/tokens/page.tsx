"use client";

import * as React from "react";
import Link from "next/link";
import { getTokensByCategory, TOKEN_MANIFEST, type TokenEntry } from "../../../lib/tokens-manifest";
import { getContrastRatio, LIGHT_TOKEN_VALUES } from "../../../lib/contrast";

const DISPLAY_CATEGORIES = ["surface", "text", "brand", "status", "border"] as const;

function getTokenValue(cssVariable: string): string {
  return LIGHT_TOKEN_VALUES[cssVariable] ?? "#cccccc";
}

function ContrastCell({ token }: { token: TokenEntry }): React.JSX.Element {
  const value = getTokenValue(token.cssVariable);
  const isColorToken = token.category !== "radius" && token.category !== "font";

  if (!isColorToken || !value.startsWith("#")) {
    return <span className="text-text-muted">—</span>;
  }

  const whiteRatio = getContrastRatio("#ffffff", value);
  const blackRatio = getContrastRatio("#000000", value);
  const onWhite = whiteRatio !== null ? whiteRatio.toFixed(2) : "—";
  const onBlack = blackRatio !== null ? blackRatio.toFixed(2) : "—";

  return (
    <span className="text-xs text-text-secondary">
      W: {onWhite}:1 / B: {onBlack}:1
    </span>
  );
}

function TokenSwatch({ token }: { token: TokenEntry }): React.JSX.Element {
  const value = getTokenValue(token.cssVariable);

  if (token.category === "radius") {
    return (
      <div
        className="h-8 w-8 border border-border-default bg-surface-default"
        style={{ borderRadius: `var(${token.cssVariable})` }}
        aria-hidden
      />
    );
  }

  if (token.category === "font") {
    return (
      <span className="text-sm" style={{ fontFamily: `var(${token.cssVariable})` }} aria-hidden>
        Aa
      </span>
    );
  }

  return (
    <div
      className="h-8 w-16 rounded border border-border-default"
      style={{ backgroundColor: `var(${token.cssVariable})` }}
      aria-hidden
    />
  );
}

export default function TokenReferencePage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <Link href="/design-system" className="text-sm text-brand-primary hover:underline">
          ← Back to Design System
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-text-primary">Design Tokens</h1>
        <p className="mt-2 text-text-secondary">
          Visual reference for all semantic tokens with contrast verification against white and black text.
        </p>
      </div>

      {DISPLAY_CATEGORIES.map((category) => {
        const tokens = getTokensByCategory(category);
        if (tokens.length === 0) return null;

        return (
          <section key={category} className="mb-10">
            <h2 className="mb-4 text-xl font-semibold capitalize text-text-primary">{category}</h2>
            <div className="overflow-x-auto rounded-lg border border-border-default">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-subtle">
                  <tr>
                    <th className="px-4 py-3 font-medium text-text-primary">Token</th>
                    <th className="px-4 py-3 font-medium text-text-primary">CSS Variable</th>
                    <th className="px-4 py-3 font-medium text-text-primary">Preview</th>
                    <th className="px-4 py-3 font-medium text-text-primary">Contrast</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => (
                    <tr key={token.name} className="border-t border-border-subtle">
                      <td className="px-4 py-3 font-mono text-text-primary">{token.name}</td>
                      <td className="px-4 py-3 font-mono text-text-secondary">{token.cssVariable}</td>
                      <td className="px-4 py-3">
                        <TokenSwatch token={token} />
                      </td>
                      <td className="px-4 py-3">
                        <ContrastCell token={token} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <p className="text-xs text-text-muted">
        Total tokens in manifest: {TOKEN_MANIFEST.length}
      </p>
    </div>
  );
}

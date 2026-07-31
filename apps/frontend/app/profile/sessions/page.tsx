"use client";

import React from "react";
import { AccountLayout } from "../../../components/layout/AccountLayout";

const DEMO_SESSIONS = [
  { id: "sess_9f2a_93C", device: "Chrome on macOS", location: "Madrid, ES", lastActive: "This device", isCurrent: true },
  { id: "sess_7918_88d", device: "Voya on iOS",     location: "Madrid, ES", lastActive: "12 minutes ago", isCurrent: false },
  { id: "sess_5d54_83a", device: "Safari on iPad",  location: "Lisbon, PT", lastActive: "3 days ago",     isCurrent: false },
];

export default function ActiveSessionsPage(): React.JSX.Element {
  const [sessions, setSessions] = React.useState(DEMO_SESSIONS);
  const [signOutError, setSignOutError] = React.useState(false);

  function signOut(id: string) {
    if (id === "sess_5d54_83a") {
      setSignOutError(true);
      return;
    }
    setSessions(s => s.filter(x => x.id !== id));
  }

  return (
    <AccountLayout>
      <div className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
        <h1 className="mb-1 text-lg font-semibold text-white">Active sessions</h1>
        <p className="mb-5 text-xs text-white/35">Signing out of a device revokes its refresh token immediately. Access decisions are always made on the server.</p>

        <table className="mb-5 w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {["Device", "Location", "Last active", ""].map(h => (
                <th key={h} className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-white/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id} className="border-b border-white/8">
                <td className="py-3 pr-3">
                  <p className="text-sm font-medium text-white">{s.device}</p>
                  <p className="text-xs text-white/30">{s.id}</p>
                </td>
                <td className="py-3 pr-3 text-sm text-white/55">{s.location}</td>
                <td className="py-3 pr-3">
                  {s.isCurrent ? (
                    <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80" }}>
                      This device
                    </span>
                  ) : (
                    <span className="text-sm text-white/45">{s.lastActive}</span>
                  )}
                </td>
                <td className="py-3 text-right">
                  {!s.isCurrent && (
                    <button
                      type="button"
                      onClick={() => signOut(s.id)}
                      className="rounded border border-white/15 px-3 py-1 text-xs text-white/55 hover:text-white transition-colors"
                    >
                      Sign out
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex gap-3">
          <button type="button" className="rounded px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85" style={{ backgroundColor: "#c1440e" }}>
            Sign out everywhere
          </button>
          <button type="button" className="rounded border border-white/15 px-4 py-2 text-sm text-white/55 hover:text-white transition-colors">
            Change password
          </button>
        </div>

        {signOutError && (
          <div className="mt-3 flex items-center justify-between rounded border border-amber-500/20 p-3" style={{ backgroundColor: "rgba(251,191,36,0.06)" }}>
            <p className="text-xs text-amber-300">
              One sign-out did not complete. Reference err_2a061e. Nothing was changed on that device.
            </p>
            <button type="button" className="text-xs font-medium text-amber-300 underline ml-3" onClick={() => setSignOutError(false)}>Retry</button>
          </div>
        )}
      </div>
    </AccountLayout>
  );
}

"use client";

import React from "react";
import { AccountLayout } from "../../components/layout/AccountLayout";

function SessionExpiryBanner() {
  const [seconds, setSeconds] = React.useState(118);
  React.useEffect(() => {
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toString().padStart(2, "0");
  return (
    <div className="mb-4 flex items-center justify-between rounded border border-amber-500/20 px-4 py-2.5" style={{ backgroundColor: "rgba(251,191,36,0.06)" }}>
      <p className="text-xs text-amber-300">
        Your session expires in {mins}:{secs}. We&apos;ll refresh it silently — anything you&apos;ve typed is kept.
      </p>
      <button type="button" className="text-xs font-medium text-amber-300 underline hover:text-amber-200">Stay signed in</button>
    </div>
  );
}

export default function ProfilePage(): React.JSX.Element {
  const [form, setForm] = React.useState({
    first: "Maria", last: "Serrano",
    email: "maria.serrano@example.com",
    phone: "+34 6",
    dob: "••/••/1987",
    passport: "••••••419",
  });

  return (
    <AccountLayout>
      <SessionExpiryBanner />
      <div className="rounded-xl border border-[var(--voya-border)] p-6" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
        <h1 className="mb-1 text-lg font-semibold text-[var(--voya-text)]">Profile</h1>
        <p className="mb-5 text-xs text-[var(--voya-text-3)]">Restricted fields are masked in display and never sent to analytics.</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {([
              { label: "First name", key: "first" as const },
              { label: "Last name",  key: "last"  as const },
            ] as const).map(f => (
              <div key={f.key}>
                <label className="block text-xs text-[var(--voya-text-3)] mb-1">{f.label}</label>
                <input
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full rounded border border-[var(--voya-border)] px-3 py-2 text-sm text-[var(--voya-text)] focus:outline-none focus:border-[var(--voya-border-sub)]"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--voya-text-3)] mb-1">Email</label>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full rounded border border-[var(--voya-border)] px-3 py-2 text-sm text-[var(--voya-text)] focus:outline-none focus:border-[var(--voya-border-sub)]"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }} type="email" />
            </div>
            <div>
              <label className="block text-xs text-[var(--voya-text-3)] mb-1">Mobile</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full rounded border border-red-500/40 px-3 py-2 text-sm text-[var(--voya-text)] focus:outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }} type="tel" />
              <p className="mt-0.5 text-xs text-red-400">Enter a full mobile number including country code.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {([
              { label: "Date of birth (restricted)",    key: "dob"      as const },
              { label: "Passport number (restricted)",  key: "passport" as const },
            ] as const).map(f => (
              <div key={f.key}>
                <label className="block text-xs text-[var(--voya-text-3)] mb-1">{f.label}</label>
                <input value={form[f.key]} readOnly
                  className="w-full rounded border border-[var(--voya-border)] px-3 py-2 text-sm text-[var(--voya-text-3)]"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" className="rounded px-4 py-2 text-sm font-semibold text-[var(--voya-text)] transition-opacity hover:opacity-85" style={{ backgroundColor: "var(--voya-red)" }}>
            Save changes
          </button>
          <button type="button" className="rounded border border-[var(--voya-border)] px-4 py-2 text-sm text-[var(--voya-text-2)] hover:text-[var(--voya-text)] transition-colors">
            Discard
          </button>
        </div>
      </div>
    </AccountLayout>
  );
}

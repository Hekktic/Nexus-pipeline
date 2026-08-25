"use client";

import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ linkError }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(
    linkError ? "That sign-in link was invalid or has expired. Send a new one." : ""
  );

  const submit = async (e) => {
    e.preventDefault();
    const address = email.trim();
    if (!address || sending) return;

    setSending(true);
    setError("");

    const supabase = createClient();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });

    setSending(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 bg-slate-900 px-5 py-4">
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Nexus Pipeline
        </h1>
        <p className="text-xs text-slate-400">Shared contact log &amp; deal tracker</p>
      </div>

      <div className="p-5">
        {sent ? (
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
              <Mail size={18} className="text-amber-400" />
            </div>
            <p className="text-sm text-slate-200">Check your email</p>
            <p className="text-xs text-slate-400">
              We sent a sign-in link to{" "}
              <span className="text-slate-200">{email.trim()}</span>. Open it in
              this browser to finish signing in.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setError("");
              }}
              className="text-xs text-slate-400 underline hover:text-slate-200"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-xs text-slate-400"
              >
                Work email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-500 py-2.5 font-medium text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
            >
              {sending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending link
                </>
              ) : (
                "Email me a sign-in link"
              )}
            </button>

            <p className="text-center text-xs text-slate-500">
              No password. The link signs you in for this browser.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

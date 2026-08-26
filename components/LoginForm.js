"use client";

import { useState, useTransition } from "react";
import { Loader2, Lock } from "lucide-react";
import { login } from "@/app/actions";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (e) => {
    e.preventDefault();
    if (!password || pending) return;

    setError("");
    startTransition(async () => {
      const result = await login(password);
      if (result && !result.ok) setError(result.error || "Something went wrong.");
    });
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
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-xs text-slate-400">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Team password"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-500 py-2.5 font-medium text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in
              </>
            ) : (
              <>
                <Lock size={14} />
                Sign in
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

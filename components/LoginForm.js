"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
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
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
      <div className="border-b border-neutral-800 bg-neutral-900 px-5 py-6">
        <div className="relative mx-auto h-16 w-full max-w-[260px]">
          <Image src="/logo/full.png" alt="Nexus Creator Network" fill sizes="260px" className="object-contain" priority />
        </div>
        <p className="mt-2 text-center text-xs text-neutral-400">Shared contact log &amp; deal tracker</p>
      </div>

      <div className="p-5">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-xs text-neutral-400">
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
            className="btn-accent flex w-full items-center justify-center gap-2 rounded-md py-2.5 font-medium transition-colors disabled:opacity-60"
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

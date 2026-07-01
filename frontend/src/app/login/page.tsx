"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "register") await register(name, email, password);
      else await login(email, password);
      router.replace("/");
    } catch (caught: any) {
      setError(caught?.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-600 text-white">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">FounderOS AI</h1>
            <p className="text-xs text-muted-foreground">Your private fundraising workspace</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1 text-sm">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`rounded-md px-3 py-2 font-semibold ${mode === "login" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(""); }}
            className={`rounded-md px-3 py-2 font-semibold ${mode === "register" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <label className="block text-sm font-medium">
              Your name
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:border-indigo-500"
                placeholder="Aarav Sharma"
              />
            </label>
          )}
          <label className="block text-sm font-medium">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:border-indigo-500"
              placeholder="you@startup.com"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:border-indigo-500"
              placeholder="At least 8 characters"
            />
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
              {error}
            </p>
          )}
          <button
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "register" ? "Create private workspace" : "Log in"}
          </button>
        </form>
      </div>
    </main>
  );
}

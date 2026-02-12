import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request) {
  const url = new URL(request.url);

  // Supabase commonly sends these:
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type"); // "signup" | "recovery" | etc.
  const next = url.searchParams.get("next") || "/app";

  // Decide where to go AFTER callback
  const redirectTo =
    type === "recovery"
      ? "/reset-password"
      : type === "signup"
      ? "/login?confirmed=1"
      : next;

  // If no code, just go where we decided
  if (!code) {
    return NextResponse.redirect(new URL(redirectTo, url.origin));
  }

  // Exchange code for a session (server-side)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // If exchange fails, bounce to login with an error flag
    return NextResponse.redirect(new URL("/login?error=confirm_failed", url.origin));
  }

  return NextResponse.redirect(new URL(redirectTo, url.origin));
}

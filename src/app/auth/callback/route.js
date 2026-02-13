import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/app";

  // Always use production site url if set (prevents localhost redirects)
  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  if (!code) {
    return NextResponse.redirect(new URL(next, origin));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=confirm_failed", origin));
  }

  return NextResponse.redirect(new URL(next, origin));
}

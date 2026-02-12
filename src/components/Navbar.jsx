"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";


function getInitials(user) {
  const fullName = user?.user_metadata?.full_name;

  if (fullName) {
    const parts = fullName.trim().split(" ");
    const first = parts[0]?.[0] || "";
    const second = parts[1]?.[0] || "";
    return (first + second).toUpperCase();
  }

  const email = user?.email || "U";
  return email[0].toUpperCase();
}



export default function Navbar() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    // initial fetch
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));

    // listen for auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub?.subscription?.unsubscribe();
  }, []);

 const initials = useMemo(() => getInitials(user), [user]);


  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
  }

  return (
    <nav className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="Invoice Generator"
            width={32}
            height={32}
            priority
          />
          <span className="text-lg font-semibold tracking-tight text-gray-900">
            Invoice Generator
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Login
              </Link>
             <Link
                href="/login?mode=signup"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
              >
                Get Started
              </Link>

            </>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm transition hover:bg-gray-50"
                aria-haspopup="menu"
                aria-expanded={open}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                  {initials}
                </div>
                <span className="hidden text-sm font-medium text-gray-700 sm:block">
                    {user.user_metadata?.full_name || user.email}

                </span>
                <span className="text-gray-500">▾</span>
              </button>

              {open && (
                <div
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
                  role="menu"
                >
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                  </div>

                  <div className="h-px bg-gray-100" />

                  <Link
                    href="/app"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    role="menuitem"
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    role="menuitem"
                  >
                    Profile
                  </Link>


                  <div className="h-px bg-gray-100" />

                  <button
                    onClick={handleSignOut}
                    className="block w-full px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-gray-50"
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

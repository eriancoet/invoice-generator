import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
            <div className="mt-3 h-4 w-64 rounded bg-gray-200 animate-pulse" />
            <div className="mt-8 space-y-4">
              <div className="h-11 w-full rounded-xl bg-gray-200 animate-pulse" />
              <div className="h-11 w-full rounded-xl bg-gray-200 animate-pulse" />
              <div className="h-11 w-full rounded-xl bg-gray-200 animate-pulse" />
            </div>
          </div>
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}

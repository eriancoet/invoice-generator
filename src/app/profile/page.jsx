"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function initialsFromEmail(email = "") {
  const name = email.split("@")[0] || "U";
  const parts = name.split(/[._-]/).filter(Boolean);
  const first = (parts[0]?.[0] || name[0] || "U").toUpperCase();
  const second = (parts[1]?.[0] || name[1] || "").toUpperCase();
  return (first + second).trim() || "U";
}

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState(null);

  // editable fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // avatar
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  // messages
  const [notice, setNotice] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const initials = useMemo(() => initialsFromEmail(user?.email), [user?.email]);

  const clearMsgs = () => {
    setNotice("");
    setErrorMsg("");
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      clearMsgs();

      const { data, error } = await supabase.auth.getUser();

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (!data?.user) {
        router.push("/login");
        return;
      }

      const u = data.user;
      setUser(u);

      // pull from user_metadata
      setFullName(u.user_metadata?.full_name || "");
      setAvatarUrl(u.user_metadata?.avatar_url || "");
      setEmail(u.email || "");

      setLoading(false);
    };

    load();
  }, [router]);

  async function saveProfile(e) {
    e.preventDefault();
    clearMsgs();
    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
        avatar_url: avatarUrl || "",
      },
    });

    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // refresh user in state so UI stays in sync
    const { data } = await supabase.auth.getUser();
    setUser(data?.user ?? null);

    setNotice("Profile updated.");
  }

  async function changeEmail(e) {
    e.preventDefault();
    clearMsgs();
    setSaving(true);

    const newEmail = email.trim().toLowerCase();
    if (!newEmail) {
      setSaving(false);
      setErrorMsg("Please enter a valid email.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ email: newEmail });

    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setNotice(
      "Email change requested. Please check your inbox to confirm the new email address."
    );
  }

  async function uploadAvatar(file) {
    clearMsgs();
    if (!file) return;

    // basic guard
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Image is too large. Max 2MB.");
      return;
    }

    setAvatarUploading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const u = authData?.user;
      if (!u) {
        router.push("/login");
        return;
      }

      const ext = file.name.split(".").pop() || "png";
      const path = `${u.id}/${Date.now()}.${ext}`;

      // upload
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // get public url
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub?.publicUrl || "";

      if (!publicUrl) throw new Error("Could not get public URL for avatar.");

      // update state + save immediately to user_metadata
      setAvatarUrl(publicUrl);

      const { error: metaError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (metaError) throw metaError;

      setNotice("Avatar updated.");
    } catch (err) {
      setErrorMsg(err?.message || "Failed to upload avatar.");
    } finally {
      setAvatarUploading(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-gray-600">Loading profile…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
     <div className="mb-6">
  <h1 className="text-2xl font-bold text-white">Profile</h1>
  <p className="mt-1 text-sm text-gray-300">
    Update your name, avatar, and email address.
  </p>
</div>


      {(errorMsg || notice) && (
        <div className="mb-6 space-y-3">
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errorMsg}
            </div>
          )}
          {notice && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {notice}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Avatar card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Avatar</h2>
          <p className="mt-1 text-sm text-gray-600">
            Upload a square image for best results.
          </p>

          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-gray-200 bg-gray-900">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                  {initials}
                </div>
              )}
            </div>

            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50">
              {avatarUploading ? "Uploading…" : "Change avatar"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={avatarUploading}
                onChange={(e) => uploadAvatar(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>

        {/* Name card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Name</h2>

          <form onSubmit={saveProfile} className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rian Coetzee"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
              />
            </div>

            <button
              disabled={saving}
              className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save name"}
            </button>
          </form>
        </div>

        {/* Email card (full width) */}
        <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Email</h2>
          <p className="mt-1 text-sm text-gray-600">
            Changing your email requires confirmation. Supabase will send a link
            to verify the new email.
          </p>

          <form onSubmit={changeEmail} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
            />
            <button
              disabled={saving}
              className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60"
            >
              {saving ? "Working…" : "Change email"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

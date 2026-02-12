"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

const emptyItem = { description: "", qty: 1, rate: 0 };

export default function InvoiceForm({
  mode = "create", // "create" | "edit"
  initialValues = null,
  invoiceId = null,
  onSuccess,
  backHref = "/app",
}) {
  // Core
  const [invoiceNumber, setInvoiceNumber] = useState(initialValues?.invoice_number || "INV-0001");
  const [status, setStatus] = useState((initialValues?.status || "draft").toLowerCase());

  // Sender
  const [senderCompany, setSenderCompany] = useState(initialValues?.sender?.company || "");
  const [senderEmail, setSenderEmail] = useState(initialValues?.sender?.email || "");
  const [senderAddress, setSenderAddress] = useState(initialValues?.sender?.address || "");
  const [senderLogoUrl, setSenderLogoUrl] = useState(initialValues?.sender?.logo_url || "");
  const [logoUploading, setLogoUploading] = useState(false);

  // Receiver
  const [receiverCompany, setReceiverCompany] = useState(initialValues?.receiver?.company || "");
  const [receiverName, setReceiverName] = useState(initialValues?.receiver?.name || "");
  const [receiverEmail, setReceiverEmail] = useState(initialValues?.receiver?.email || "");
  const [receiverAddress, setReceiverAddress] = useState(initialValues?.receiver?.address || "");

  // Items + tax
  const [items, setItems] = useState(
    Array.isArray(initialValues?.items) && initialValues.items.length ? initialValues.items : [emptyItem]
  );
  const [taxRate, setTaxRate] = useState(() => {
    if (typeof initialValues?.tax === "number" && typeof initialValues?.subtotal === "number" && initialValues.subtotal > 0) {
      return Number(((initialValues.tax / initialValues.subtotal) * 100).toFixed(2));
    }
    return 0;
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0),
    [items]
  );
  const tax = useMemo(() => subtotal * ((Number(taxRate) || 0) / 100), [subtotal, taxRate]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const updateItem = (index, patch) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };
  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  async function uploadSenderLogo(file) {
    setErrorMsg("");
    if (!file) return;

    if (!file.type.startsWith("image/")) return setErrorMsg("Please upload an image file for the logo.");
    if (file.size > 2 * 1024 * 1024) return setErrorMsg("Logo is too large. Max 2MB.");

    setLogoUploading(true);

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (userErr || !user) throw new Error("Not signed in.");

      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/logo.${ext}`; // overwrite
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from("logos").getPublicUrl(path);
      const publicUrl = pub?.publicUrl;
      if (!publicUrl) throw new Error("Could not get a public URL for the logo.");

      // cache-bust for immediate UI update
      setSenderLogoUrl(`${publicUrl}?v=${Date.now()}`);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to upload logo.");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSubmit() {
    setErrorMsg("");
    setLoading(true);

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (userErr || !user) throw new Error("Not signed in.");

      const payload = {
        user_id: user.id,
        invoice_number: invoiceNumber,
        status,
        sender: {
          company: senderCompany,
          email: senderEmail,
          address: senderAddress,
          logo_url: senderLogoUrl,
        },
        receiver: {
          company: receiverCompany,
          name: receiverName,
          email: receiverEmail,
          address: receiverAddress,
        },
        items,
        subtotal,
        tax,
        total,
      };

      let res;
      if (mode === "edit") {
        res = await supabase.from("invoices").update(payload).eq("id", invoiceId).select("id").single();
      } else {
        res = await supabase.from("invoices").insert(payload).select("id").single();
      }

      if (res.error) throw res.error;

      onSuccess?.(res.data.id);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to save invoice.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === "edit" ? "Edit Invoice" : "New Invoice"}
          </h1>
          <a href={backHref} className="text-sm font-medium text-gray-700 hover:text-gray-900">
            ← Back
          </a>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Invoice details */}
          <div>
            <label className="text-sm font-medium text-gray-700">Invoice #</label>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
            />
          </div>

          {/* Status only on edit (optional) */}
          {mode === "edit" && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          )}

          {/* Sender */}
          <div className="mt-6 rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Your business</p>

              <label className="cursor-pointer text-xs font-semibold text-gray-900 hover:underline">
                {logoUploading ? "Uploading..." : senderLogoUrl ? "Change logo" : "Upload logo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={logoUploading}
                  onChange={(e) => uploadSenderLogo(e.target.files?.[0])}
                />
              </label>
            </div>

            {senderLogoUrl && (
              <div className="mt-3 flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <Image src={senderLogoUrl} alt="Business logo" fill className="object-contain" />
                </div>
                <p className="text-xs text-gray-500">This logo will appear on the invoice.</p>
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Company name" value={senderCompany} onChange={setSenderCompany} />
              <Field label="Business email" value={senderEmail} onChange={setSenderEmail} />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">Business address</label>
              <textarea
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
              />
            </div>
          </div>

          {/* Receiver */}
          <div className="mt-6 rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-900">Client</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Company name" value={receiverCompany} onChange={setReceiverCompany} />
              <Field label="Contact name" value={receiverName} onChange={setReceiverName} />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Client email" value={receiverEmail} onChange={setReceiverEmail} />
              <Field label="Tax %" type="number" value={taxRate} onChange={setTaxRate} />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">Client address</label>
              <textarea
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
              />
            </div>
          </div>

          {/* Items */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Line items</h2>
              <button
                type="button"
                onClick={addItem}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                + Add item
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="grid gap-3 rounded-xl border border-gray-200 p-4 sm:grid-cols-12">
                  <div className="sm:col-span-6">
                    <label className="text-xs font-medium text-gray-600">Description</label>
                    <input
                      value={it.description}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-600">Qty</label>
                    <input
                      type="number"
                      value={it.qty}
                      onChange={(e) => updateItem(idx, { qty: e.target.value })}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-xs font-medium text-gray-600">Rate</label>
                    <input
                      type="number"
                      value={it.rate}
                      onChange={(e) => updateItem(idx, { rate: e.target.value })}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {errorMsg && <p className="mt-4 text-sm text-red-600">{errorMsg}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || logoUploading}
            className="mt-6 w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? "Saving..." : mode === "edit" ? "Save changes" : "Save invoice"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
      />
    </div>
  );
}

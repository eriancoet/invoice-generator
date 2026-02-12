"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import InvoiceForm from "@/components/InvoiceForm";

export default function EditInvoicePage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      setErrorMsg("");

      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes?.user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase.from("invoices").select("*").eq("id", id).single();
      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setInvoice(data);
      setLoading(false);
    };

    if (id) load();
  }, [id, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="h-10 w-72 rounded-xl bg-gray-200 animate-pulse" />
          <div className="mt-6 h-96 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-semibold text-gray-900">Invoice not found</p>
          {errorMsg && <p className="mt-2 text-sm text-red-600">{errorMsg}</p>}
        </div>
      </main>
    );
  }

  return (
    <InvoiceForm
      mode="edit"
      invoiceId={id}
      initialValues={invoice}
      backHref={`/app/invoices/${id}`}
      onSuccess={() => router.push(`/app/invoices/${id}`)}
    />
  );
}

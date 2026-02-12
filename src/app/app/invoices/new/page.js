"use client";

import { useRouter } from "next/navigation";
import InvoiceForm from "@/components/InvoiceForm";

export default function NewInvoicePage() {
  const router = useRouter();

  return (
    <InvoiceForm
      mode="create"
      backHref="/app"
      onSuccess={(newId) => router.push(`/app/invoices/${newId}`)}
    />
  );
}

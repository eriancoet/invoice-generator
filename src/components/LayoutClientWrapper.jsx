"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function LayoutClientWrapper({ children }) {
  const pathname = usePathname();

  const isPrintPage = pathname?.includes("/print");

  return (
    <>
      {!isPrintPage && <Navbar />}
      {children}
    </>
  );
}

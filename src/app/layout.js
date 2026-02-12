import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Invoice Generator",
  description: "Create professional invoices in minutes.",
  icons: {
    icon: "/favicon.ico", // make sure this exists in /public
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Global Navbar (appears on ALL pages) */}
        <Navbar />

        {/* Page Content */}
        <main>{children}</main>
      </body>
    </html>
  );
}

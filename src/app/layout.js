import "./globals.css";
import LayoutClientWrapper from "@/components/LayoutClientWrapper";

export const metadata = {
  title: "Invoice Generator",
  description: "Create professional invoices in minutes.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <LayoutClientWrapper>{children}</LayoutClientWrapper>
      </body>
    </html>
  );
}

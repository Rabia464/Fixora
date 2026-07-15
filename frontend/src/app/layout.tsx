import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "../components/Navbar";

export const metadata: Metadata = {
  title: "Fixora",
  description: "Hostel Complaint Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  );
}

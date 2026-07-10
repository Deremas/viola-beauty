import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Viola Brows and Beauty Booking",
  description: "Appointment booking, payment verification, and calendar management for Viola Brows and Beauty.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

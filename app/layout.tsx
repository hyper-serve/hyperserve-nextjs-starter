import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Hyperserve Next.js Starter",
	description: "Upload a video, watch it play, receive a verified webhook.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
			<body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
				<header className="border-b border-neutral-800">
					<nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4 text-sm">
						<Link href="/" className="font-semibold text-white">Hyperserve Starter</Link>
						<Link href="/webhooks" className="text-neutral-400 hover:text-white">Webhooks</Link>
					</nav>
				</header>
				<main className="mx-auto max-w-5xl px-6">{children}</main>
			</body>
    </html>
  );
}

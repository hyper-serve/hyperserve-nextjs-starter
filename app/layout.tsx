import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
	title: "Hyperserve Next.js Starter",
	description: "Upload and transcode a video, receive webhooks and play it back. A Next.js starter for the Hyperserve API.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
				<header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
					<nav className="mx-auto flex max-w-5xl gap-5 px-6 py-3 text-sm">
						<Link href="/" className="text-neutral-400 underline-offset-4 transition hover:text-white hover:underline">
							Quick start
						</Link>
						<Link
							href="/webhooks"
							className="text-neutral-400 underline-offset-4 transition hover:text-white hover:underline"
						>
							Webhooks
						</Link>
					</nav>
				</header>

				<main className="mx-auto max-w-5xl px-6">
					<div className="pt-10">
						<h1 className="text-2xl font-semibold text-white">Hyperserve Next.js Starter</h1>
						<p className="mt-2 text-sm text-neutral-400">
							Upload and transcode a video, receive webhooks and play it back. A Next.js starter for the Hyperserve
							API.
						</p>
					</div>
					{children}
				</main>
			</body>
		</html>
	);
}

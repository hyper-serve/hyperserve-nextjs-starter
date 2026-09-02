import { cookies } from "next/headers";
import { AutoRefresh } from "@/components/auto-refresh";
import { UploadPanel } from "@/components/upload-panel";
import { VideoCard } from "@/components/video-card";
import { readConfig } from "@/lib/config";
import { RECENT_VIDEOS_COOKIE, parseRecentVideos } from "@/lib/recent-videos";
import { isSettled, loadVideos } from "@/lib/videos";

export const dynamic = "force-dynamic";

export default async function HomePage() {
	const config = readConfig();
	if (config === null) {
		return <SetupScreen />;
	}

	const store = await cookies();
	const ids = parseRecentVideos(store.get(RECENT_VIDEOS_COOKIE)?.value);
	const loaded = await loadVideos(ids);
	const videos = loaded.flatMap((entry) => (entry.ok ? [entry.video] : []));
	const failedCount = loaded.length - videos.length;
	const anyProcessing = videos.some((video) => !isSettled(video));

	return (
		<>
			<UploadPanel />
			<AutoRefresh enabled={anyProcessing} />
			{videos.length > 0 || failedCount > 0 ? (
				<section className="pb-16">
					<h2 className="text-xs uppercase tracking-wide text-neutral-500">Your uploads</h2>
					{videos.length > 0 ? (
						<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{videos.map((video) => (
								<VideoCard key={video.id} video={video} />
							))}
						</div>
					) : null}
					{failedCount > 0 ? (
						// loadVideos never rejects; a rate limit or blip on one call should not blank the
						// whole list, so surface the miss instead of silently rendering nothing.
						<p className="mt-4 text-xs text-amber-400">
							{failedCount} upload{failedCount === 1 ? "" : "s"} could not be loaded. This is usually temporary.
						</p>
					) : null}
					{videos.length > 0 ? (
						<p className="mt-4 text-xs text-neutral-600">
							Tracked in a browser cookie, because the API has no &quot;list my videos&quot; endpoint for API keys. Clearing
							cookies clears this list. The videos themselves are unaffected.
						</p>
					) : null}
				</section>
			) : null}
		</>
	);
}

function SetupScreen() {
	return (
		<div className="mx-auto max-w-xl py-16">
			<h1 className="text-2xl font-semibold text-white">Add your API key to get started</h1>
			<ol className="mt-6 space-y-3 text-sm text-neutral-300">
				<li>
					1. Copy <code className="rounded bg-neutral-800 px-1.5 py-0.5">.env.example</code> to{" "}
					<code className="rounded bg-neutral-800 px-1.5 py-0.5">.env.local</code>
				</li>
				<li>
					2. Paste your key from{" "}
					<a className="text-sky-400 underline" href="https://hyperserve.io/api-keys" target="_blank" rel="noreferrer">
						hyperserve.io/api-keys
					</a>{" "}
					as <code className="rounded bg-neutral-800 px-1.5 py-0.5">HYPERSERVE_API_KEY</code>
				</li>
				<li>3. Restart the dev server</li>
			</ol>
		</div>
	);
}

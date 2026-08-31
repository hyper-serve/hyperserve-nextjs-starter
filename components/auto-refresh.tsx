"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Re-runs the parent server component on an interval. Used while a video is
 * transcoding, so the page picks up the new status without a client-side fetch
 * and without exposing the API key.
 */
export function AutoRefresh({ intervalMs = 5000, enabled }: { intervalMs?: number; enabled: boolean }) {
	const router = useRouter();

	useEffect(() => {
		if (!enabled) {
			return;
		}
		const timer = setInterval(() => router.refresh(), intervalMs);
		return () => clearInterval(timer);
	}, [enabled, intervalMs, router]);

	return null;
}

"use client";

import { useState } from "react";
import { PollingVideoPanel } from "@/components/polling-video-panel";
import { UploadPanel } from "@/components/upload-panel";

/** Holds the id of the video uploaded in this session. Nothing is shown before
 *  that, because before an upload there is nothing to report. */
export function QuickStartDemo() {
	const [videoId, setVideoId] = useState<string | null>(null);

	return (
		<>
			<UploadPanel onUploaded={setVideoId} />
			{videoId === null ? null : <PollingVideoPanel key={videoId} id={videoId} />}
		</>
	);
}

"use client";

import { useState } from "react";
import { UploadPanel } from "@/components/upload-panel";
import { WebhookVideoPanel } from "@/components/webhook-video-panel";

/** Holds the id of the video uploaded in this session. Nothing is shown before
 *  that, so a restarted server cannot claim a video is still transcoding. */
export function WebhookDemo() {
	const [videoId, setVideoId] = useState<string | null>(null);

	return (
		<>
			<UploadPanel onUploaded={setVideoId} />
			{videoId === null ? null : <WebhookVideoPanel key={videoId} id={videoId} />}
		</>
	);
}

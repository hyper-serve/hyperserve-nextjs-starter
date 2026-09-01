import { readFile } from "node:fs/promises";
import { HyperserveClient } from "@hyperserve/hyperserve-js";

const apiKey = process.env.HYPERSERVE_API_KEY;
if (!apiKey) {
	console.log("HYPERSERVE_API_KEY is not set, skipping the live check.");
	process.exit(0);
}

const client = new HyperserveClient({
	apiKey,
	baseUrl: process.env.HYPERSERVE_API_URL ?? "https://api.hyperserve.io/api",
	retries: 2,
});

const file = await readFile("public/sample.mov");

console.log("Uploading sample.mov...");
const result = await client.uploadVideo({
	file,
	filename: "sample.mov",
	resolutions: ["480p"],
	isPublic: true,
	thumbnailTimestampsSeconds: [1],
	customMetadata: { source: "starter-live-check" },
});

// The polling loop can fail partway (a timeout, a dropped connection). Wrap it in
// try/finally so the video is always deleted once it exists, not only on the happy path.
let video;
try {
	const deadlineMs = Date.now() + 10 * 60 * 1000;
	while (Date.now() < deadlineMs) {
		video = await client.getVideo(result.id);
		console.log(`status: ${video.status}`);
		if (video.status === "ready" || video.status === "fail") {
			break;
		}
		await new Promise((resolve) => setTimeout(resolve, 15_000));
	}
} finally {
	// Always clean up, so the live check does not accumulate storage on the account.
	await client.deleteVideo(result.id).catch((error) => console.warn(`cleanup failed: ${error.message}`));
}

if (video?.status !== "ready") {
	console.error(`Live check failed. Final status: ${video?.status ?? "timed out"}`);
	process.exit(1);
}

const rendition = video.resolutions["480p"];
if (!rendition?.videoUrl) {
	console.error("Video reached ready but the 480p rendition has no videoUrl.");
	process.exit(1);
}

console.log("Live check passed.");

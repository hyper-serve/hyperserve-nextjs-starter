import { checkFile } from "@/lib/upload-validation";

export type UploadPhase =
	| { name: "idle" }
	| { name: "creating" }
	| { name: "uploading"; percent: number }
	| { name: "completing" };

/** Injected so the flow can be tested in node, without a DOM or a network. */
export interface UploadDeps {
	postJson(url: string, body: unknown): Promise<Record<string, unknown>>;
	putToStorage(options: {
		uploadUrl: string;
		contentType: string;
		file: File;
		onProgress?: (percent: number) => void;
	}): Promise<void>;
}

export async function runUpload(
	input: { file: File; resolutions: string[]; onPhase: (phase: UploadPhase) => void },
	deps: UploadDeps,
): Promise<string> {
	const check = checkFile({ name: input.file.name, size: input.file.size });
	if (!check.ok) {
		throw new Error(check.message);
	}

	// 1. Ask our own server for a presigned URL. The API key stays server-side.
	input.onPhase({ name: "creating" });
	const created = await deps.postJson("/api/videos", {
		filename: input.file.name,
		fileSizeBytes: input.file.size,
		resolutions: input.resolutions,
	});
	const id = String(created.id);

	// 2. PUT the file straight to storage. No API key involved, and the file
	//    never passes through our server. contentType must be exactly what the
	//    server returned, or the presigned URL rejects the request.
	input.onPhase({ name: "uploading", percent: 0 });
	await deps.putToStorage({
		uploadUrl: String(created.uploadUrl),
		contentType: String(created.contentType),
		file: input.file,
		onProgress: (percent) => input.onPhase({ name: "uploading", percent }),
	});

	// 3. Tell Hyperserve the upload landed, which queues transcoding.
	input.onPhase({ name: "completing" });
	await deps.postJson(`/api/videos/${id}/complete`, {});

	return id;
}

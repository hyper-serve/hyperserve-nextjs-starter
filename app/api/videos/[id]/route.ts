import { NextResponse } from "next/server";
import { hyperserve } from "@/lib/hyperserve";

/*
* Demo only. With no database here, the browser polls Hyperserve for the video URL.
* Normally the webhook would update the video's status in your database, and your UI
* would read the URL from there. For private videos, call
* getVideo(id, { private: true, expirationSeconds: 3600 }) for a fresh signed URL.
*/
export async function GET(_request: Request, context: RouteContext<"/api/videos/[id]">) {
	const { id } = await context.params;

	return NextResponse.json(await hyperserve.getVideo(id));
}

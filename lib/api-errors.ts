import { HyperserveValidationError } from "@hyperserve/hyperserve-js";
import { NextResponse } from "next/server";

export function missingKeyResponse() {
	return NextResponse.json(
		{ error: "HYPERSERVE_API_KEY is not set. Add it to .env.local and restart the dev server." },
		{ status: 500 },
	);
}

/** The SDK has no dedicated auth error class: a rejected key arrives as a 401 validation error. */
export function errorResponse(error: unknown) {
	if (error instanceof HyperserveValidationError && error.statusCode === 401) {
		return NextResponse.json(
			{ error: "Your API key was rejected. Check it at https://hyperserve.io/api-keys" },
			{ status: 401 },
		);
	}
	const message = error instanceof Error ? error.message : "Unexpected error.";
	const status = error instanceof HyperserveValidationError ? (error.statusCode ?? 400) : 502;
	return NextResponse.json({ error: message }, { status });
}

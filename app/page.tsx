import { readConfig } from "@/lib/config";

export default function HomePage() {
	const config = readConfig();

	if (config === null) {
		return <SetupScreen />;
	}

	return <p className="text-sm text-neutral-400">Ready. Upload UI arrives in Task 5.</p>;
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

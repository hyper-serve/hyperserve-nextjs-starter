# Hyperserve Next.js Starter

A small Next.js app that uploads a video to [Hyperserve](https://hyperserve.io),
plays it back, and receives a signed webhook when transcoding finishes.

Paste in an API key and it works. There is no database and nothing to configure
beyond one environment variable.

## Quick start

```bash
git clone https://github.com/hyper-serve/hyperserve-nextjs-starter
cd hyperserve-nextjs-starter
npm install
cp .env.example .env.local
```

Put your API key in `.env.local`. Create one at
[hyperserve.io/api-keys](https://hyperserve.io/api-keys):

```
HYPERSERVE_API_KEY=your-key-here
```

Optional: point the app at a different API base with `HYPERSERVE_API_URL`. It
must include the `/api` suffix, for example `https://api.hyperserve.io/api`.
Leave it unset to use the default, which is correct for almost everyone.

Then:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000) and drop in a video. There is a
`sample.mov` included if you do not have one handy. It is a QuickTime file, and
Hyperserve returns MP4 renditions, so you can see the conversion happen.

## What just happened

Three API calls, all in
[`components/upload-panel.tsx`](components/upload-panel.tsx) and the routes it
posts to.

**1. Ask for a presigned URL.** Server-side, in
[`app/api/videos/route.ts`](app/api/videos/route.ts), so your API key never
reaches the browser:

```typescript
const created = await client.createVideo({
  filename: "sample.mov",
  fileSizeBytes: 187025,
  resolutions: ["480p", "1080p"],
  isPublic: true,
  thumbnailTimestampsSeconds: [1],
});
// -> { id, uploadUrl, contentType }
```

**2. Upload the file straight to storage.** In the browser. No API key is
involved, and the file never passes through your server:

```typescript
import { putVideoToStorage } from "@hyperserve/hyperserve-js/browser";

await putVideoToStorage({
  uploadUrl: created.uploadUrl,
  contentType: created.contentType,
  file,
  // onProgress is optional; see lib/upload-flow.ts for how this app uses it.
});
```

**3. Tell Hyperserve the upload landed**, which queues transcoding. Server-side
again, in
[`app/api/videos/[id]/complete/route.ts`](app/api/videos/%5Bid%5D/complete/route.ts):

```typescript
await client.completeUpload(created.id);
```

After that, [`lib/videos.ts`](lib/videos.ts) reads the video's status with
`client.getVideo(id)`. The pages are server components, so a small
`AutoRefresh` component calls `router.refresh()` every few seconds while
transcoding is in progress. There is no client-side polling endpoint and no
second copy of the read logic.

Accepted upload extensions are `avi, m4v, mkv, mov, mp4, mpg, webm, wmv`, up to
5 GB. See [`lib/upload-validation.ts`](lib/upload-validation.ts).

## Optional: receiving webhooks

Hyperserve posts an event when transcoding finishes. That needs a publicly
reachable URL, so expose your dev server first. Cloudflare quick tunnels need no
account:

```bash
npx cloudflared tunnel --url http://localhost:3000
```

That prints a URL like `https://something-random.trycloudflare.com`. ngrok works
too, but it now requires an account and an authtoken to use, which is the
barrier this starter is meant to avoid.

1. Go to [hyperserve.io/webhooks](https://hyperserve.io/webhooks) and register
   `https://your-tunnel-url/api/hyperserve/webhook`. The
   [`/webhooks`](http://localhost:3000/webhooks) page in this app will build
   that URL for you. Webhooks can only be registered from the dashboard: the
   API has no endpoint that registers one with an API key, because
   `POST /webhook/me` requires a dashboard session, not an API key.
2. Copy the signing secret it shows. It is shown once.
3. Put it in `.env.local` as `HYPERSERVE_WEBHOOK_SECRET` and restart the dev
   server.
4. Upload a video. The event appears on
   [localhost:3000/webhooks](http://localhost:3000/webhooks).

The receiver is
[`app/api/hyperserve/webhook/route.ts`](app/api/hyperserve/webhook/route.ts):

```typescript
export async function POST(request: Request) {
  // Read the raw text. Parsing and re-serializing changes the bytes
  // and breaks the signature.
  const rawBody = await request.text();

  const verified = await verifyWebhookSignature({
    signature: request.headers.get("x-hyperserve-signature") ?? "",
    secret: process.env.HYPERSERVE_WEBHOOK_SECRET!,
    body: rawBody,
  });

  if (!verified) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }
  // ...
}
```

The signature header has the form `{timestampMs}.{hex}`, where `hex` is an
HMAC-SHA256 over the string `{timestampMs}.{rawBody}`, keyed with your webhook
secret. `verifyWebhookSignature` from the SDK does this check for you.

Events that fail verification are logged and shown as rejected rather than
dropped, so a mismatched secret is visible instead of looking like nothing
arrived.

## Using this in your own app

The pieces worth lifting:

| File | What it does |
|---|---|
| `lib/hyperserve.ts` | Constructs the SDK client, server-side only |
| `app/api/videos/route.ts` | Presign step, plus mapping API errors to responses |
| `lib/upload-flow.ts` | The three-call upload sequence |
| `components/upload-panel.tsx` | The browser upload UI, with progress |
| `app/api/hyperserve/webhook/route.ts` | Signature verification |
| `lib/videos.ts` | Reading video status without throwing |

Things you will want to change: this app uploads everything as public
(`isPublic: true`). For private videos, use
`client.getVideo(id, { private: true, expirationSeconds: 3600 })` to get
time-limited signed URLs.

## Deploying

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhyper-serve%2Fhyperserve-nextjs-starter&env=HYPERSERVE_API_KEY&envDescription=Your%20Hyperserve%20API%20key&envLink=https%3A%2F%2Fhyperserve.io%2Fapi-keys)

A deployment gives you a public URL, so webhooks work without a tunnel. One
caveat: the webhook log is held in memory, and on Vercel the receiver and the
page can run on different instances, so the log may look empty there even
though events are arriving. It works reliably when running locally.

## Limitations

This is a reference integration, not a production app.

- No database. Your uploaded video IDs are kept in a browser cookie, because
  the API has no "list my videos" endpoint for API-key callers. Clearing
  cookies clears the list. The videos themselves are unaffected.
- The webhook log is in memory and resets when the server restarts.
- Everything is uploaded as a public video.
- There is no authentication. Do not deploy this somewhere public with a real
  API key in it unless you are comfortable with anyone uploading to your
  account.
- The video page prints the raw API response, including `customMetadata`.
  Since there is no authentication, anyone with a video ID can read it. Do not
  put anything private in `customMetadata` while running this template.

## Running the tests

```bash
npm test
npm run typecheck
npm run lint
```

## License

MIT

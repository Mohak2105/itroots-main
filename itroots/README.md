This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment

Copy `.env.example` and set the values for your environment.

For Coolify, the safest setup is:

- Keep `NEXT_PUBLIC_API_URL` unset so the browser uses same-origin `/api/v1`
- Set `API_PROXY_TARGET` to the internal backend URL, for example `http://itroots-backend:5000`
- Set `NEXT_PUBLIC_SITE_URL` to the public frontend URL

## Zoom LMS Embed

Embedded Zoom live classes use the backend signature endpoint and require backend-only env vars:

- `ZOOM_MEETING_SDK_KEY`
- `ZOOM_MEETING_SDK_SECRET`

Teachers can schedule Zoom live classes by selecting `Zoom Meeting` and pasting the Zoom join URL in the LMS.

## Self-Hosted Jitsi LMS Embed

Embedded Jitsi live classes require a self-hosted Jitsi deployment on its own HTTPS domain.

- Set `NEXT_PUBLIC_JITSI_DOMAIN` on the frontend service, for example `meet.example.com`
- Optionally set `JITSI_ROOM_PREFIX` on the backend service to customize generated room names
- Deploy Jitsi separately from the LMS app container and keep it reachable over HTTPS

Teachers can schedule Jitsi live classes by selecting `Jitsi Meeting`. The LMS generates the room automatically and opens it only from the live-class pages during the scheduled session window.

## Playwright E2E

The frontend workspace includes a Chromium-first Playwright harness for the Jitsi live-class flow on HTTPS staging.

1. Copy [`.env.e2e.example`](./.env.e2e.example) to `.env.e2e`
2. Set `E2E_BASE_URL` to the HTTPS staging LMS origin
3. Confirm the seeded accounts are available:
   - `admin@itroots.com / admin123`
   - `Faculty@itroots.com / Faculty123`
   - `student@itroots.com / student123`
4. Install the Chromium browser once:

```bash
npx playwright install chromium
```

5. Run the suite:

```bash
npm run test:e2e
```

The suite:

- creates disposable course, batch, enrollment, and live-class fixtures through real APIs
- uses separate teacher and student browser contexts
- runs Jitsi with fake browser media enabled for automation
- keeps screenshots, traces, and HTML reports for failures

Real microphone/camera validation stays manual. Use [MANUAL_MEDIA_SMOKE.md](./tests/e2e/MANUAL_MEDIA_SMOKE.md) for the short HTTPS staging smoke pass after the automated suite succeeds.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

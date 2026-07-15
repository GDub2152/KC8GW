# KC8GW Ambient Weather Worker

This Worker keeps the Ambient Weather API credentials off the public GitHub Pages site. It publishes outdoor observations only. Indoor temperature and indoor humidity are deliberately omitted.

## Cloudflare dashboard setup

1. Sign in to Cloudflare and open **Workers & Pages**.
2. Create a Worker named `kc8gw-weather`.
3. Replace the sample code with the contents of `worker.js`, then deploy it.
4. Open the Worker **Settings → Variables and Secrets**.
5. Add these as **Secret** values:
   - `AMBIENT_API_KEY` — your Ambient Weather user API key.
   - `AMBIENT_APPLICATION_KEY` — your Ambient Weather application key.
6. Optional: add `AMBIENT_DEVICE_MAC` as a secret if your account has more than one weather station. If omitted, the Worker uses the first device returned by Ambient.
7. Deploy again after adding the secrets.
8. Test: open `https://YOUR-WORKER.workers.dev/weather`. You should see JSON with outdoor weather values.
9. In the website, edit `assets/js/config.js` and set `ambientWeatherEndpoint` to the Worker URL ending in `/weather`.

Never put either Ambient key in GitHub or in browser JavaScript.

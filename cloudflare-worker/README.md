# KC8GW Weather Underground Worker

This Worker keeps the Weather Underground API key off the public GitHub Pages site.

## Cloudflare dashboard setup

1. Open **Workers & Pages** and select `kc8gw-weather`.
2. Replace the Worker code with the contents of `worker.js`, then deploy it.
3. Open **Settings → Variables and Secrets**.
4. Add a **Secret** named exactly `WU_API_KEY` and paste your Weather Underground API key as its value.
5. Visit `https://kc8gw-weather.nortonnfriends.workers.dev/weather`.
6. A working response contains `"stationId":"KOHWADSW119"` and an `observation` object.

Do not put the API key in `assets/js/config.js`, `weather.js`, HTML, GitHub, or the Worker source code.

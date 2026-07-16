# KC8GW.com

Static GitHub Pages website for `kc8gw.com`.

## Publish

1. Upload all files to the root of the `GDub2152/KC8GW` repository.
2. In **Settings → Pages**, publish from `main` and `/ (root)`.
3. Set the custom domain to `kc8gw.com`.
4. Enable **Enforce HTTPS** after the DNS check succeeds.

The root `CNAME` file contains `kc8gw.com`.

## ADS-B local address

Edit `assets/js/config.js` to change the local feeder dashboard address. Live statistics are intentionally not fabricated; configure a public CORS-enabled JSON endpoint before adding them.


## Weather setup

Current conditions now come from Weather Underground PWS `KOHWADSW119` through the secure Cloudflare Worker in `cloudflare-worker/`. The seven-day forecast remains Open-Meteo and is clearly labeled as forecast data.

1. Deploy `cloudflare-worker/worker.js` to the existing `kc8gw-weather` Worker.
2. Add a secret named `WU_API_KEY` in Cloudflare.
3. Keep the key out of all GitHub files.
4. Confirm `assets/js/config.js` contains the correct Worker URL.

See `cloudflare-worker/README.md` for exact instructions.



## LiveATC
`liveatc.html` uses official launch links only. It does not copy, embed, proxy, or restream LiveATC audio.

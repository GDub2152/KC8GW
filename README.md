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


## Ambient Weather integration

Deploy the secure proxy in `cloudflare-worker/`, then paste its `/weather` URL into `assets/js/config.js`. The site intentionally excludes indoor temperature and humidity.

TBOPARC Secretary Helper v1
================================

This is a responsive, static web app designed for iPad, phone, and PC.

Files:
- index.html
- styles.css
- app.js
- manifest.webmanifest
- sw.js

How to use locally:
Open index.html in a modern browser. For full "install to home screen" and offline PWA behavior,
host the folder over HTTPS (GitHub Pages is suitable).

Current v1 features:
- Manual attendance only; no person is preloaded or automatically marked present.
- Meeting setup and call-to-order fields.
- Previous-minutes motion and voting.
- Add/remove officer reports.
- Add/remove old business, new business, and announcements.
- Presentation/program notes.
- Adjournment motion and vote.
- Automatic local autosave on the current device/browser.
- Generated meeting minutes using the structure of the supplied TBOPARC minutes.
- Print / Save PDF.
- Download Word-compatible .doc.
- Backup/restore a meeting as JSON.
- Responsive touch layout.

Important limitation:
Local autosave is per-device. It does not yet synchronize live between iPad, phone, and PC.
Use Backup Meeting / Restore Meeting to move a meeting between devices, or add a cloud backend
in a future version for seamless multi-device sync.

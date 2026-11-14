# Moncy Reddy Wellness

A static wellness dashboard configured for the supplied Supabase project.

## Included files

- `index.html` — app structure and all views
- `styles.css`, `extras.css`, `sanctuary.css` — styling
- `app.js`, `extras.js`, `sanctuary.js`, `sanctuary-content.js` — app logic and content
- `supabase-config.js` — browser URL and publishable key
- `supabase-setup.sql` — database table, access policies, and Realtime setup
- `assets/photos/` — images used by the birthday experience

## One-time setup

1. Open the Supabase project configured in `supabase-config.js`.
2. Open **SQL Editor** and run the complete `supabase-setup.sql` file.
3. Deploy the contents of this folder to your static host over HTTPS.
4. Open the site in two separate browsers. Add a test journal entry in one browser and confirm it appears in the other; edit/delete another test item and verify the change propagates.

## Shared sync behavior

The app uses one shared `public.wellness_state` row (`id = 1`). All app records, profile photo, learning progress, requests, sanctuary reflections, and appearance preferences are saved in that JSON document. Supabase Realtime pushes updates to browsers that are open at the same time. Reloading another browser loads the latest saved state.

There is no login screen and no per-browser anonymous identity. This is why the same row is shared across browsers. The publishable key is designed for browser use; never put a Supabase secret/service-role key in this folder.

## Important limitations

- This no-login shared-table design allows anyone who can reach the site and project endpoint to read or change the shared row. It is suitable only if the site and its data are intentionally shared. For private wellness records, use authentication and per-user RLS instead.
- The app stores its state as one JSON document. Simultaneous edits from multiple browsers can conflict; avoid editing the same record in two browsers at the exact same time.
- Realtime sync requires the SQL migration to run successfully and the `wellness_state` table to be included in the `supabase_realtime` publication.
- The included Supabase publishable key can be exposed in client code. Never use a secret/service-role key in a browser.


### Cursor styles and desktop navigation
Settings includes Botanical leaf, Petal, Sparkle, Soft outline, and Default cursor choices. On laptops/desktops, the sidebar navigation scrolls independently so Settings remains reachable. Cursor style is saved in the shared Supabase preferences.


## Optional reminders and visual effects
Reminder categories are opt-in in Settings. Browser notifications require permission and the page may need to remain open. The home encryption badge says “Coming soon” because end-to-end encryption is not implemented by this build; the shared Supabase JSON state is not end-to-end encrypted. Blush includes a gentle animated gradient and brief click hearts, respecting reduced-motion preferences.


Theme customisation update: includes theme-scoped cursor/font controls, 320+ rotating Space fact messages and 320+ Bloom cat lines generated from a varied library, randomized on-page timing while the tab is open, and a custom logo uploader that updates the sidebar/settings preview/favicon. The site does not send background messages when the page is closed.


### Whole-site theme fonts
The Space or Bloom font selected in Settings is applied across the entire interface (navigation, headings, body text, cards, labels, and form controls). Switching themes applies that theme's saved font choice.


## Premium upgrade
`premium.js` + `premium.css` add the realistic 3D cat (time-of-day moods) and 3D solar system, paired theme fonts, fixed cursors, smoother page transitions and click effects. They load after the other files and fall back to the old CSS scenes if three.js cannot load. Supabase sync is untouched.

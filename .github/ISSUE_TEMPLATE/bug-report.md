---
name: Bug report
about: Something is broken or behaving incorrectly
labels:
  - "type:bug"
---

<!--
  Pick a priority label after filing: p0-now / p1-week / p2-month / p3-someday.
  Default isn't pre-applied because severity varies by impact.
-->

**What's happening:**

<!-- The actual broken behavior, as observed. Copy-paste error messages verbatim. -->

**Expected:**

<!-- What should happen instead. -->

**Repro steps:**

<!-- Numbered list. Should be reproducible by someone else from a clean state. -->

1. ...
2. ...
3. ...

**Environment:**

- App: renew-pms (staging / production)
- Branch / commit: <!-- e.g., staging @ 9688847 -->
- Browser: <!-- Chrome 120, Safari 17, etc. -->
- User role: <!-- brik_admin / admin / manager / staff -->

**Logs / screenshots:**

<!-- Sentry link if available (https://brikdesigns.sentry.io/...), browser console output,
     server log snippet, or screenshot. Crop screenshots to the relevant area. -->

**Severity guidance:**

- **p0-now** — data loss, security, unable to log in, broken for everyone
- **p1-week** — broken core flow, no workaround, multiple users affected
- **p2-month** — annoying but workable, single workflow affected
- **p3-someday** — cosmetic, edge case, single user

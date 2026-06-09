# Changelog

## [0.3.3](https://github.com/brikdesigns/renew-pms/compare/v0.3.2...v0.3.3) (2026-06-09)


### Bug Fixes

* **feedback:** write post-OPE-29 stable Backlog properties ([#392](https://github.com/brikdesigns/renew-pms/issues/392)) ([bb96659](https://github.com/brikdesigns/renew-pms/commit/bb96659c4ac611a43c3850d3c21312a2515117f0))

## [0.3.2](https://github.com/brikdesigns/renew-pms/compare/v0.3.1...v0.3.2) (2026-06-04)


### Documentation

* **release:** correct release-please trunk comment ([#367](https://github.com/brikdesigns/renew-pms/issues/367)) ([#388](https://github.com/brikdesigns/renew-pms/issues/388)) ([187e56f](https://github.com/brikdesigns/renew-pms/commit/187e56f2b8f9807c4be0aad5262986a5efe17422))

## [0.3.1](https://github.com/brikdesigns/renew-pms/compare/v0.3.0...v0.3.1) (2026-06-03)


### Bug Fixes

* **ci:** repair task-generation-monitor YAML (invalid → parses) ([#382](https://github.com/brikdesigns/renew-pms/issues/382)) ([237d270](https://github.com/brikdesigns/renew-pms/commit/237d2701e56a8e03002edc57ccdf1ff8cacaa0f6))
* **tasks:** durable in-DB task scheduler + watchdog; feat(infra): agent ops access ([#377](https://github.com/brikdesigns/renew-pms/issues/377)) ([a1352ee](https://github.com/brikdesigns/renew-pms/commit/a1352eeaf9d130b35b2792651bbeb86a2fce5833))


### Documentation

* **guide:** add v0.3.0 to user-facing Release Notes ([#372](https://github.com/brikdesigns/renew-pms/issues/372)) ([e2c6ec0](https://github.com/brikdesigns/renew-pms/commit/e2c6ec0c884631a316e8ab33edf5969f56789d59))
* **release:** add post-MVP prod cutover runbook ([#367](https://github.com/brikdesigns/renew-pms/issues/367)) ([#370](https://github.com/brikdesigns/renew-pms/issues/370)) ([219d6ca](https://github.com/brikdesigns/renew-pms/commit/219d6caa6cd475ddbbab1bf1d60d9258ac6ae804))

## [0.3.0](https://github.com/brikdesigns/renew-pms/compare/v0.2.0...v0.3.0) (2026-06-03)


### Features

* **renew:** show app version + Beta label in user menu ([#359](https://github.com/brikdesigns/renew-pms/issues/359)) ([8d3d2ab](https://github.com/brikdesigns/renew-pms/commit/8d3d2abc2284ff87b4a62112654c47fd9d562df1)), closes [#248](https://github.com/brikdesigns/renew-pms/issues/248)


### Bug Fixes

* **infra:** make new-task.sh op run install resilient headless ([#365](https://github.com/brikdesigns/renew-pms/issues/365)) ([#366](https://github.com/brikdesigns/renew-pms/issues/366)) ([7de1382](https://github.com/brikdesigns/renew-pms/commit/7de1382430ea6de2d7546166ca5d305aa69f9229))
* **infra:** narrow secret-scanner Resend regex to stop snake_case false positives ([#368](https://github.com/brikdesigns/renew-pms/issues/368)) ([ab0b7d9](https://github.com/brikdesigns/renew-pms/commit/ab0b7d906e85531aa943ccc69f0514ee3a91aa85))


### Documentation

* **guide:** add user-facing Release Notes page with v0.2.0 ([#361](https://github.com/brikdesigns/renew-pms/issues/361)) ([e53de46](https://github.com/brikdesigns/renew-pms/commit/e53de4682f3a4f60a4f089ddc683e5ebabbf2de5)), closes [#328](https://github.com/brikdesigns/renew-pms/issues/328)
* **release:** document semver mapping + beta-as-label convention ([#360](https://github.com/brikdesigns/renew-pms/issues/360)) ([cf6cb60](https://github.com/brikdesigns/renew-pms/commit/cf6cb603f0eeffa3826e987c1b7fe1f478eea293)), closes [#235](https://github.com/brikdesigns/renew-pms/issues/235)

## [0.2.0](https://github.com/brikdesigns/renew-pms/compare/v0.1.7...v0.2.0) (2026-06-02)


### Features

* **tasks:** ADR + schema + visibility for recurring generators ([#347](https://github.com/brikdesigns/renew-pms/issues/347)) ([064961f](https://github.com/brikdesigns/renew-pms/commit/064961f342de7ed82e834d7a6343c0804f52d346))
* **tasks:** due-date chips on task cards ([#344](https://github.com/brikdesigns/renew-pms/issues/344)) ([#353](https://github.com/brikdesigns/renew-pms/issues/353)) ([6d68f12](https://github.com/brikdesigns/renew-pms/commit/6d68f1228924a26ba679e02149168e327eb19d62))
* **tasks:** monthly task generator + cron ([#341](https://github.com/brikdesigns/renew-pms/issues/341)) ([#350](https://github.com/brikdesigns/renew-pms/issues/350)) ([bbb9f90](https://github.com/brikdesigns/renew-pms/commit/bbb9f90a7f740f77a3970a6f39e1fa9209d7b8bb))
* **tasks:** settings UI + API for per-template reset cadence ([#343](https://github.com/brikdesigns/renew-pms/issues/343)) ([#352](https://github.com/brikdesigns/renew-pms/issues/352)) ([1df98ba](https://github.com/brikdesigns/renew-pms/commit/1df98bacc56c5d4f8640e40533c5814eac6143ae))
* **tasks:** weekly task generator + cron ([#340](https://github.com/brikdesigns/renew-pms/issues/340)) ([#349](https://github.com/brikdesigns/renew-pms/issues/349)) ([762cb43](https://github.com/brikdesigns/renew-pms/commit/762cb438e2b893b9c132239654ab4e28ddb6bdcc))


### Bug Fixes

* **feedback:** remap Notion payload to current Backlog schema ([#355](https://github.com/brikdesigns/renew-pms/issues/355)) ([aa295db](https://github.com/brikdesigns/renew-pms/commit/aa295db1a83d9916fb11df46447eded7b43c78cc))
* **feedback:** surface Notion error status in feedback response ([#356](https://github.com/brikdesigns/renew-pms/issues/356)) ([07f3936](https://github.com/brikdesigns/renew-pms/commit/07f39367b8790e91d583ccb684326093a2fd5121)), closes [#791](https://github.com/brikdesigns/renew-pms/issues/791)

## [0.1.7](https://github.com/brikdesigns/renew-pms/compare/v0.1.6...v0.1.7) (2026-05-23)


### Documentation

* rag canon grounding ([#311](https://github.com/brikdesigns/renew-pms/issues/311)) ([2e4c92d](https://github.com/brikdesigns/renew-pms/commit/2e4c92dec3095f666949ca788b8eb7af92be3ab3))

## [0.1.6](https://github.com/brikdesigns/renew-pms/compare/v0.1.5...v0.1.6) (2026-05-20)


### Features

* **auth:** scaffold Data Access Layer ([#321](https://github.com/brikdesigns/renew-pms/issues/321) PR-A) ([#322](https://github.com/brikdesigns/renew-pms/issues/322)) ([a51a90f](https://github.com/brikdesigns/renew-pms/commit/a51a90f14fb7c171eb817b6b81bca98951acb890))
* **renew:** BDS 0.69.0 — remove SheetHelperText (deprecated ADR-004) ([#319](https://github.com/brikdesigns/renew-pms/issues/319)) ([ebe8c2d](https://github.com/brikdesigns/renew-pms/commit/ebe8c2d5e066c096787d7620adc1e0811edde6e2))


### Bug Fixes

* **tasks:** template spawn race + inventory item UX rework ([#312](https://github.com/brikdesigns/renew-pms/issues/312)) ([4b1e74e](https://github.com/brikdesigns/renew-pms/commit/4b1e74e1c64646079b0eff3241b376c0de61227e))


### Refactors

* **button:** migrate 19 IconButton sites to Button (refs [#661](https://github.com/brikdesigns/renew-pms/issues/661) B) ([#318](https://github.com/brikdesigns/renew-pms/issues/318)) ([626b7b4](https://github.com/brikdesigns/renew-pms/commit/626b7b452353d2977a537e0469db839dc1b52fc2))


### Documentation

* **claude-md:** Phase D renew-pms rewrite (244 → 50 lines) ([#314](https://github.com/brikdesigns/renew-pms/issues/314)) ([c6b28d2](https://github.com/brikdesigns/renew-pms/commit/c6b28d225e82d7784b4aa3f15974409dcb1c98c9))

## [0.1.5](https://github.com/brikdesigns/renew-pms/compare/v0.1.4...v0.1.5) (2026-05-10)


### Features

* **auth:** change password from Settings → Security + SSO-only branch ([#302](https://github.com/brikdesigns/renew-pms/issues/302)) ([68e7a0a](https://github.com/brikdesigns/renew-pms/commit/68e7a0aa4934b837c5a0971b2efa3c97a04f411a))
* **auth:** surface linked sign-in methods on user profile + admin view ([#304](https://github.com/brikdesigns/renew-pms/issues/304)) ([19f2944](https://github.com/brikdesigns/renew-pms/commit/19f29440643b8cb4a896d9eaa508ee311743e207))
* **tasks:** show parent template on expanded children + validate items ([#305](https://github.com/brikdesigns/renew-pms/issues/305)) ([872cc86](https://github.com/brikdesigns/renew-pms/commit/872cc86c065c4b668305cb73c9e23c0cb5c95f7b))


### Bug Fixes

* **tasks:** expanded-mode legacy cleanup — hide phantoms + auto-prune empty items ([#309](https://github.com/brikdesigns/renew-pms/issues/309)) ([335be15](https://github.com/brikdesigns/renew-pms/commit/335be15f2dc2be9b9a1b6e87499d741aa7e22efa))


### Documentation

* **bds:** repoint TOKEN-REFERENCE.md refs to canonical primitives URL ([#308](https://github.com/brikdesigns/renew-pms/issues/308)) ([ec92d59](https://github.com/brikdesigns/renew-pms/commit/ec92d59097c976277c8eb3ff707105c8555216fd))
* **claude-md:** Phase 3.5 trim — 409 → 244 lines ([#310](https://github.com/brikdesigns/renew-pms/issues/310)) ([a6c3317](https://github.com/brikdesigns/renew-pms/commit/a6c3317ddc63844d20723aac5977b2897588bd41))

## [0.1.4](https://github.com/brikdesigns/renew-pms/compare/v0.1.3...v0.1.4) (2026-05-07)


### Features

* **auth:** retire raw_user_meta_data.system_role pattern ([#300](https://github.com/brikdesigns/renew-pms/issues/300)) ([b758989](https://github.com/brikdesigns/renew-pms/commit/b758989cfb51aa51451cfc3e8a360c3ab6b41d81))

## [0.1.3](https://github.com/brikdesigns/renew-pms/compare/v0.1.2...v0.1.3) (2026-05-07)


### Features

* **ux:** templates sheet UX + global edit-sheet outside-click guard ([#298](https://github.com/brikdesigns/renew-pms/issues/298)) ([9b5705d](https://github.com/brikdesigns/renew-pms/commit/9b5705d19b501fbdf34dafa568bdaec675c947ed))


### Documentation

* **process:** add release-runbook for staging→main→staging cycle ([#296](https://github.com/brikdesigns/renew-pms/issues/296)) ([4898ef9](https://github.com/brikdesigns/renew-pms/commit/4898ef931845ef4625229f0fd42ec21216fae223))

## [0.1.2](https://github.com/brikdesigns/renew-pms/compare/v0.1.1...v0.1.2) (2026-05-06)


### Features

* **feedback:** retire NOTION_TOKEN — route /api/feedback to Sentry ([#262](https://github.com/brikdesigns/renew-pms/issues/262)) ([7bca9c5](https://github.com/brikdesigns/renew-pms/commit/7bca9c56ba5d20924cb099c82f1545e7b1c51d51))
* **infra:** add PreToolUse hooks blocking secret leak vectors ([#258](https://github.com/brikdesigns/renew-pms/issues/258)) ([#259](https://github.com/brikdesigns/renew-pms/issues/259)) ([ab65f3a](https://github.com/brikdesigns/renew-pms/commit/ab65f3a550c35dca6182524dec3e46b7a3616528))
* **security:** add gitleaks pre-commit + CI workflow ([#275](https://github.com/brikdesigns/renew-pms/issues/275)) ([9f1004a](https://github.com/brikdesigns/renew-pms/commit/9f1004acd83b2dc200d7e76125a8275c3a884684))
* **settings:** tighten profile read-mode rhythm + drop double-spacing ([#268](https://github.com/brikdesigns/renew-pms/issues/268)) ([6b2b58a](https://github.com/brikdesigns/renew-pms/commit/6b2b58a34612f1562d45b183a50a2643f3b99377))


### Bug Fixes

* **ci:** use GITHUB_TOKEN for GHCR auth (no more PACKAGES_READ_TOKEN) ([#274](https://github.com/brikdesigns/renew-pms/issues/274)) ([78b72a0](https://github.com/brikdesigns/renew-pms/commit/78b72a05583cd9ff92a4a730cdec89927b7c1272))
* **feedback:** flush Sentry events before serverless function returns ([#264](https://github.com/brikdesigns/renew-pms/issues/264)) ([bfe571b](https://github.com/brikdesigns/renew-pms/commit/bfe571b0234f9e345321df89f4ef9692c9d97408))
* **feedback:** restore Notion as feedback destination on staging ([#269](https://github.com/brikdesigns/renew-pms/issues/269)) ([11aa13d](https://github.com/brikdesigns/renew-pms/commit/11aa13d20c0194d1e4b360996c48115a6bd2c03b))
* **infra:** widen bash-leak-guard against secret stores ([#271](https://github.com/brikdesigns/renew-pms/issues/271)) ([42b5f76](https://github.com/brikdesigns/renew-pms/commit/42b5f76473efae534b0d63fec619891ac0a52540))
* **rls:** tighten practice_members + vendor_messages policy scope ([#292](https://github.com/brikdesigns/renew-pms/issues/292)) ([c8934f8](https://github.com/brikdesigns/renew-pms/commit/c8934f886e314aead97765adc70cba10f90739ed))
* **security:** pre-launch QA batch — five small fixes ([#291](https://github.com/brikdesigns/renew-pms/issues/291)) ([a4b07b6](https://github.com/brikdesigns/renew-pms/commit/a4b07b6f3e6c1df2cca672d80128299d03bc485e))
* **security:** replace in-memory rate limiter with Upstash Redis ([#286](https://github.com/brikdesigns/renew-pms/issues/286)) ([ec0e8b2](https://github.com/brikdesigns/renew-pms/commit/ec0e8b20f36db274d0e6a297e27f13768c8c52da))
* **security:** sanitize Supabase error.message in API responses ([#256](https://github.com/brikdesigns/renew-pms/issues/256)) ([2a226d3](https://github.com/brikdesigns/renew-pms/commit/2a226d3abd8aa2e63055cf53366011b450a708a4)), closes [#207](https://github.com/brikdesigns/renew-pms/issues/207)
* **ui:** nav tooltip linger + page-anatomy spacing batch ([#294](https://github.com/brikdesigns/renew-pms/issues/294)) ([859243f](https://github.com/brikdesigns/renew-pms/commit/859243fbe38e620172345e5e697b990e95bcb847))


### Documentation

* **claude:** add Compliance Profile section pointing at BDS canonical ([#289](https://github.com/brikdesigns/renew-pms/issues/289)) ([71049e5](https://github.com/brikdesigns/renew-pms/commit/71049e514b1b2d0795a49d57136bf862e85135a8))
* **claude:** link the canonical 5 security docs ([#287](https://github.com/brikdesigns/renew-pms/issues/287)) ([6f21646](https://github.com/brikdesigns/renew-pms/commit/6f2164616286959a72451f08893f629508df1254))

## [0.1.1](https://github.com/brikdesigns/renew-pms/compare/v0.1.0...v0.1.1) (2026-05-04)


### Features

* add consumer Storybook for Renew theme preview ([10bbbab](https://github.com/brikdesigns/renew-pms/commit/10bbbabe101b986c6b995132ba76ff25912d05eb))
* add consumer Storybook for Renew theme preview ([ae2ed7c](https://github.com/brikdesigns/renew-pms/commit/ae2ed7c8212b091d8845336e4439b5698edcde72))
* add QA infrastructure — Playwright E2E, auth health, seed migration fix ([d2def9f](https://github.com/brikdesigns/renew-pms/commit/d2def9fdf96543be94ace7bb9d7be9b10c83c010))
* add schedule calendar with FullCalendar and event CRUD ([7ea8a53](https://github.com/brikdesigns/renew-pms/commit/7ea8a53722cb9db5c885ded78cac60536519db3b))
* **auth:** emailed invite + password reset flow (Resend pipeline) ([#57](https://github.com/brikdesigns/renew-pms/issues/57)) ([d89b1a9](https://github.com/brikdesigns/renew-pms/commit/d89b1a953e9e2c9beccd1e45c9219a9d779907b4))
* **bds+docs:** bump @brikdesigns/bds to 0.22.0 + add Compliance Profile ([#23](https://github.com/brikdesigns/renew-pms/issues/23)) ([3869977](https://github.com/brikdesigns/renew-pms/commit/38699772e4fff5070280b079d92925a4d4af46d3))
* **bds:** adopt TabBar in PageHeader on tasks + requests; pin FAB ([#206](https://github.com/brikdesigns/renew-pms/issues/206)) ([097d9d3](https://github.com/brikdesigns/renew-pms/commit/097d9d3780296f9693073e78cc13834933def726))
* **bds:** bump to ^0.57.1; PageHeader edge-to-edge ([#220](https://github.com/brikdesigns/renew-pms/issues/220)) ([bd36580](https://github.com/brikdesigns/renew-pms/commit/bd36580ea83d9a732ecfd07a32772974ed9d771b))
* cap dashboard lists at 6, replace compliance card with requests ([68a5663](https://github.com/brikdesigns/renew-pms/commit/68a5663bc2c2b34758f988ae188a6fc52a7cc581))
* clickable ProfileCards with sheet drill-down navigation ([9ecab02](https://github.com/brikdesigns/renew-pms/commit/9ecab025f37b93beb0854e5059defe2ce04d4ccb))
* consolidate settings UI — segmented controls, teams under departments, vendor icon tag ([152e40e](https://github.com/brikdesigns/renew-pms/commit/152e40e66ab27b14d413d7cc0b78bb08c350fc50))
* contact profile sheet with activity, email casing fix, sheet wiring ([3e780c2](https://github.com/brikdesigns/renew-pms/commit/3e780c25b2cb01685b0e75d92c129404baa4ff64))
* contact profile sheet, training card redesign, email casing fix ([32f428f](https://github.com/brikdesigns/renew-pms/commit/32f428f95e125fb7b4478eb5653f13ff6751d4e0))
* contacts and vendor management ([3113214](https://github.com/brikdesigns/renew-pms/commit/3113214538b1b255d8d614ccf6c69bf25e707275))
* ElevenLabs narration pipeline — selectors map, script template, gitignore ([ecbb00d](https://github.com/brikdesigns/renew-pms/commit/ecbb00dee793d071eeeec33fa27a1c591c6b3fab))
* enable persona switcher via env var for staging ([c5c1e53](https://github.com/brikdesigns/renew-pms/commit/c5c1e5353009d69abd65418ebf9fabef2ad813fd))
* **feedback:** port Brik-branded DevFeedbackWidget from portal ([#13](https://github.com/brikdesigns/renew-pms/issues/13)) ([3be952f](https://github.com/brikdesigns/renew-pms/commit/3be952f134dc3fec16c01250a9d02730d7152701))
* global skeleton loading states + ViewTaskSheet headless mode ([b2b888c](https://github.com/brikdesigns/renew-pms/commit/b2b888c4bf04df674419f2b22d0bc64ca78f8401))
* **infra:** add pr-task.sh (push + PR in one step) ([#25](https://github.com/brikdesigns/renew-pms/issues/25)) ([c3163da](https://github.com/brikdesigns/renew-pms/commit/c3163dabf1ca2158124e48da3b65f4e91af5393d))
* **infra:** add schema-to-types drift check in CI ([#243](https://github.com/brikdesigns/renew-pms/issues/243)) ([a873287](https://github.com/brikdesigns/renew-pms/commit/a873287d0d1f0fa190be483f02ec80e3a4d60ce4))
* **infra:** block commits with CRITICAL anti-slop findings ([#22](https://github.com/brikdesigns/renew-pms/issues/22)) ([cdd2ead](https://github.com/brikdesigns/renew-pms/commit/cdd2ead83fa6909bba42cc8a6928c6bb0c0c6c9d))
* **infra:** catch cross-worktree edits in worktree-check hook ([#93](https://github.com/brikdesigns/renew-pms/issues/93)) ([5ea825b](https://github.com/brikdesigns/renew-pms/commit/5ea825b68709729cf081ea13b3f8e64e3be93bb0))
* **infra:** copy .env.local into new worktrees automatically ([#95](https://github.com/brikdesigns/renew-pms/issues/95)) ([8a1d86f](https://github.com/brikdesigns/renew-pms/commit/8a1d86f1febdc988ba2f58faaed12ad0fe6d98ef))
* **infra:** daily task generator scheduler via Netlify cron ([#108](https://github.com/brikdesigns/renew-pms/issues/108)) ([e02fe5c](https://github.com/brikdesigns/renew-pms/commit/e02fe5c463979d7a485e98259cf8ef2253d9c883))
* **infra:** split DevTools gate to enable customer feedback FAB ([#133](https://github.com/brikdesigns/renew-pms/issues/133)) ([c1cce2f](https://github.com/brikdesigns/renew-pms/commit/c1cce2f02a21ddc1ba50a1a40158bd81287596e5))
* **infra:** worktree guard — prevent primary-worktree branch drift ([#24](https://github.com/brikdesigns/renew-pms/issues/24)) ([aa617bd](https://github.com/brikdesigns/renew-pms/commit/aa617bd0b21ce6f23f8c609071e60339a127e95d))
* interactive dashboard cards — click to open item sheets ([f913765](https://github.com/brikdesigns/renew-pms/commit/f91376578f9037c52cf2c5f1ec5728a6d111a490))
* **nav:** gate Schedule/Training/Documents/Analytics to platform admins ([#92](https://github.com/brikdesigns/renew-pms/issues/92)) ([a00e3b3](https://github.com/brikdesigns/renew-pms/commit/a00e3b3c6f3a73a5bc2a021ca89625d4d28af1e9))
* notification system — bell, API, real-time hooks ([a3357ad](https://github.com/brikdesigns/renew-pms/commit/a3357ad1ed22007fa5096439ba32b22445d9c7b0))
* **obs:** wire Web Vitals + Supabase tracing into Sentry ([#128](https://github.com/brikdesigns/renew-pms/issues/128)) ([25b7fc3](https://github.com/brikdesigns/renew-pms/commit/25b7fc33d05222b02f90dc62e7e53077a8cbfb27))
* QA infrastructure, CI pipeline, invite flow fix ([9cc225d](https://github.com/brikdesigns/renew-pms/commit/9cc225d9be2cef0d11ba38ebc5a9e80e443658db))
* record-demo.sh — ffmpeg assembly pipeline + demo config template ([b0ff970](https://github.com/brikdesigns/renew-pms/commit/b0ff9705f0484229284d8973cd058c55814cdac4))
* **renew:** consolidate dev tools onto BDS BrikDevBar ([#34](https://github.com/brikdesigns/renew-pms/issues/34)) ([79144d1](https://github.com/brikdesigns/renew-pms/commit/79144d155f0c86bb847035f9e1f552f667816b18))
* replace native time inputs with BDS TimePicker ([7108d8a](https://github.com/brikdesigns/renew-pms/commit/7108d8aded179a5e10fcf697758126bd0b8cf374))
* request manage/resolve/reject workflow with role-based actions ([27a4347](https://github.com/brikdesigns/renew-pms/commit/27a4347fdd13df47bb940c7299409f1d8dc0ccac))
* request sheet — submitter and assignee names as profile links ([9921472](https://github.com/brikdesigns/renew-pms/commit/99214724286683058326be1d74b9e841b83f94b9))
* requests feature, template seeds, task checklist items ([ef3c670](https://github.com/brikdesigns/renew-pms/commit/ef3c6703da208a19f10c0ac9b123c8fe584f4160))
* requests feature, UI polish, dark mode fixes ([9f7433b](https://github.com/brikdesigns/renew-pms/commit/9f7433b852aaa137f9fce694c85c01ef590a4fda))
* requests UI polish + guide documentation ([5829738](https://github.com/brikdesigns/renew-pms/commit/5829738ca6d9b201256f8e5ceb16abc0228100e1))
* role-based views, global sheet navigation, teams settings page ([b41b2a9](https://github.com/brikdesigns/renew-pms/commit/b41b2a9161458215c20fcad9decc436d3be23191))
* schedule calendar, dark mode fixes, task CRUD, account settings ([c08bf70](https://github.com/brikdesigns/renew-pms/commit/c08bf7038e897b5978bf9b754016e04e4a86b7d5))
* **settings:** page-anatomy compliance pass — 5 admin pages ([#244](https://github.com/brikdesigns/renew-pms/issues/244)) ([641dbf0](https://github.com/brikdesigns/renew-pms/commit/641dbf001d72751fe2a3ad237d3efb742c5b2edf))
* **settings:** segmented controls → PageHeader tabs + Add in actions ([#237](https://github.com/brikdesigns/renew-pms/issues/237)) ([0522a77](https://github.com/brikdesigns/renew-pms/commit/0522a77830cb7f7182166da0e5b19b57301527f7))
* sheet drill-down navigation + equipment request history API ([829f161](https://github.com/brikdesigns/renew-pms/commit/829f161a7b5cac1d8fbbff259a760ea859abfe0f))
* tasks board — pool tasks, filters, checklist view ([22391ae](https://github.com/brikdesigns/renew-pms/commit/22391ae6f3fe9482a11df7a7032452ae49fbcbc3))
* **tasks,schedule,requests:** page-anatomy compliance — batch B ([#246](https://github.com/brikdesigns/renew-pms/issues/246)) ([f0ff47d](https://github.com/brikdesigns/renew-pms/commit/f0ff47df0620d1007b5c4866881c9bb9e56f7bc6))
* **tasks:** scope task visibility by system_role ([#44](https://github.com/brikdesigns/renew-pms/issues/44)) ([009602c](https://github.com/brikdesigns/renew-pms/commit/009602cb1d731eb2267dc7c474d2ab5e4ea55926))
* template-driven task creation, task CRUD API, account settings ([4a1234f](https://github.com/brikdesigns/renew-pms/commit/4a1234fa43def09fff9a2a226e09d2c5b7658f96))
* **users:** add days-in-office picker to user profiles ([#99](https://github.com/brikdesigns/renew-pms/issues/99)) ([f5e36c6](https://github.com/brikdesigns/renew-pms/commit/f5e36c6c4c8c3802389fc901c6a432cafc20c22d))
* vendor portal links — tokenized public access for external vendors ([48cd1de](https://github.com/brikdesigns/renew-pms/commit/48cd1ded6d559ca6773d0733f07b45578a352f54))
* wire dashboard to real task data + logo links to dashboard ([561fa61](https://github.com/brikdesigns/renew-pms/commit/561fa61739a2b52770c9772f8fe3865a6508736b))
* wire feedback widget to Notion Backlog database ([af1af8b](https://github.com/brikdesigns/renew-pms/commit/af1af8bb38f10557e59ccc6068969e814d436a10))
* wire Resend email notifications for request lifecycle ([1b3f8d1](https://github.com/brikdesigns/renew-pms/commit/1b3f8d19eb78f1f336f64d2bb9bbde164693b44d))


### Bug Fixes

* **a11y:** UserAvatar no-department fallback meets WCAG AA contrast ([#170](https://github.com/brikdesigns/renew-pms/issues/170)) ([e5b9d67](https://github.com/brikdesigns/renew-pms/commit/e5b9d67f5cf60380e3b4da69f94f1cba8a01fe6d)), closes [#163](https://github.com/brikdesigns/renew-pms/issues/163)
* add 600ms delay to sidebar and utility bar tooltips ([3a8e114](https://github.com/brikdesigns/renew-pms/commit/3a8e11446358bc25ac361bd96ae4845fbb47498c))
* add tooltips to all board card icon indicators and avatars ([24e7f9b](https://github.com/brikdesigns/renew-pms/commit/24e7f9bb62eac2be8fe51ac9ef1647feb5568408))
* add vendor_id + department_id columns to equipment table ([6a357b5](https://github.com/brikdesigns/renew-pms/commit/6a357b506907d9139d786b4603b40c11f7464c30))
* add vitest config to exclude E2E tests from unit test runner ([4bfc05c](https://github.com/brikdesigns/renew-pms/commit/4bfc05ce251785076782d65cf73913854e115d3b))
* add vitest config to exclude E2E tests from unit test runner ([06255bf](https://github.com/brikdesigns/renew-pms/commit/06255bf97dbc801f9b0123a8d7f3b8a830f3652d))
* add vitest config to exclude E2E tests from unit test runner ([4713dee](https://github.com/brikdesigns/renew-pms/commit/4713dee48bacfc423cdeb5eb0d45d77df6cae745))
* add z-index to sidebar so nav tooltips render above body content ([62e1564](https://github.com/brikdesigns/renew-pms/commit/62e156422147f302e6a8bf468795554ff7291712))
* **auth:** explicitly setSession from URL hash on /reset-password ([#218](https://github.com/brikdesigns/renew-pms/issues/218)) ([15b9ccf](https://github.com/brikdesigns/renew-pms/commit/15b9ccff2f5c55377793dcf88b083061616e6358))
* **auth:** forward request to downstream so refreshed cookies stick ([#82](https://github.com/brikdesigns/renew-pms/issues/82)) ([c6914d0](https://github.com/brikdesigns/renew-pms/commit/c6914d0a6754b031cb9d80f5033c4f0dc8166a8b))
* **auth:** scope email_confirm=true to recovery branch only ([#217](https://github.com/brikdesigns/renew-pms/issues/217)) ([5757102](https://github.com/brikdesigns/renew-pms/commit/575710238b41aa8217bebcf3d828d1a0e5d2e47e))
* **auth:** server-gate admin-only settings routes + tier 0.7 spec ([#41](https://github.com/brikdesigns/renew-pms/issues/41)) ([d029ebe](https://github.com/brikdesigns/renew-pms/commit/d029ebeb5abb11605b8b2fd560cb582587f42e41))
* **auth:** surface OAuth callback exchange error on /login (refs [#195](https://github.com/brikdesigns/renew-pms/issues/195)) ([#204](https://github.com/brikdesigns/renew-pms/issues/204)) ([1af45dd](https://github.com/brikdesigns/renew-pms/commit/1af45dd8757479b86af65e7ab67faf2bb1752a56))
* **auth:** tag Sentry events with deploy environment, not NODE_ENV ([#136](https://github.com/brikdesigns/renew-pms/issues/136)) ([c562b6c](https://github.com/brikdesigns/renew-pms/commit/c562b6c35d653e698c210d1a8e8ac0087eef4b3d))
* **auth:** use window.location.origin for OAuth redirectTo (closes [#195](https://github.com/brikdesigns/renew-pms/issues/195)) ([#205](https://github.com/brikdesigns/renew-pms/issues/205)) ([81cff34](https://github.com/brikdesigns/renew-pms/commit/81cff3426165e75c0230fc5950e8fde24b987c22))
* CI pipeline — env loading for CI, fumadocs type generation ([e6ebc5e](https://github.com/brikdesigns/renew-pms/commit/e6ebc5e4f504343c0dbf590e2331a0f8cddf8957))
* **ci:** add PACKAGES_READ_TOKEN for @brikdesigns/bds npm auth ([28495ab](https://github.com/brikdesigns/renew-pms/commit/28495abfecf0d524a685bcfd3608f5aba36576df))
* **ci:** add PACKAGES_READ_TOKEN for npm auth ([bf9672d](https://github.com/brikdesigns/renew-pms/commit/bf9672dbae88d16f0fa49a8dce699ed30fea04a8))
* **ci:** wipe stale brik-bds dir before build on Netlify ([#14](https://github.com/brikdesigns/renew-pms/issues/14)) ([ec66d4b](https://github.com/brikdesigns/renew-pms/commit/ec66d4b824c6f4e274c50d70113adf79130e61e9))
* dark mode token overrides, UI consistency across pages ([4eae4b7](https://github.com/brikdesigns/renew-pms/commit/4eae4b7881883d64c682064d85017e45f9743567))
* dark mode tokens, UI consistency, delete dialogs, form polish ([c9ffc63](https://github.com/brikdesigns/renew-pms/commit/c9ffc6317e11fa5f5d96fe1ef4905dbb70ed0d2f))
* dashboard card hover states, compact avatars, equal card heights ([3d7d187](https://github.com/brikdesigns/renew-pms/commit/3d7d187805bfbae76804af20f6fe26a92f58049b))
* **dashboard:** semantic-correct card titles + adopt bds-text-link ([#178](https://github.com/brikdesigns/renew-pms/issues/178)) ([13a6ce5](https://github.com/brikdesigns/renew-pms/commit/13a6ce576cf996658b732e22a44b7578d8526033)), closes [#176](https://github.com/brikdesigns/renew-pms/issues/176)
* **dev-tools:** DevPersonaSwitcher dark-mode via semantic tokens ([#102](https://github.com/brikdesigns/renew-pms/issues/102)) ([b121af5](https://github.com/brikdesigns/renew-pms/commit/b121af503369bcf1051d57774cc79473a1608003))
* **dev-tools:** persona row uses InteractiveListItem size=sm ([#86](https://github.com/brikdesigns/renew-pms/issues/86)) ([be3e282](https://github.com/brikdesigns/renew-pms/commit/be3e282d9b85efd9a18017e07364fe22e1208b99))
* equipment form — status mapping, PATCH payload, form pre-population ([0f42e5d](https://github.com/brikdesigns/renew-pms/commit/0f42e5db81e281fd68d16e825f0efe181f03dfe9))
* feedback Notion URL property name + remove emoji from type buttons ([5e73d41](https://github.com/brikdesigns/renew-pms/commit/5e73d412f9fde02cac1364758dce90cdc9d2de49))
* **infra:** pre-push hook fallback to staging instead of main ([#231](https://github.com/brikdesigns/renew-pms/issues/231)) ([a5b651b](https://github.com/brikdesigns/renew-pms/commit/a5b651b9705c1ac20fb7bad3ad7e73ce5e3b2e80))
* inject isAdmin into global sheet stack and wire onNavigate to all page-level sheets ([36443f2](https://github.com/brikdesigns/renew-pms/commit/36443f2d6222a16bc4997f951af43805825ca02b))
* **layout:** replace 96px magic number with flex-fill on board pages ([#191](https://github.com/brikdesigns/renew-pms/issues/191)) ([3f1b781](https://github.com/brikdesigns/renew-pms/commit/3f1b7811ec6e7b77cfcf6fb4da85d9a8e88584e2))
* **loading:** drop loud divider; prevent theme flicker on first paint ([#85](https://github.com/brikdesigns/renew-pms/issues/85)) ([51d761f](https://github.com/brikdesigns/renew-pms/commit/51d761f388abfe77386e775fa88a521b2bfd0761))
* move sheet footer override into [@layer](https://github.com/layer) client-overrides ([7d37630](https://github.com/brikdesigns/renew-pms/commit/7d37630c8a305cf8f67b5dd1aa323d8eddc4ae79))
* practice API — use getPracticeId + admin client ([0fdfc7a](https://github.com/brikdesigns/renew-pms/commit/0fdfc7a40793c393ad4210529babdc2301cce744))
* pre-populate Select values in edit sheets and standardize placeholders ([301e169](https://github.com/brikdesigns/renew-pms/commit/301e169f31aebda30f8bcb948b9a891a8e816071))
* **qa:** auth-health.sh false-positive on auth↔profile cross-check ([#130](https://github.com/brikdesigns/renew-pms/issues/130)) ([2e2afed](https://github.com/brikdesigns/renew-pms/commit/2e2afed4b8f3f2a3b37474ee1f063af7242310f7))
* remove duplicate closing braces in BDS ProgressBar and Select CSS ([95ac63f](https://github.com/brikdesigns/renew-pms/commit/95ac63fe75a024843ebd66c1d402c99a11e0ac4e))
* remove gap between training filter bar and card list ([90c0a59](https://github.com/brikdesigns/renew-pms/commit/90c0a59c1167ef9eb2f498dab49a6a5d7ba05fdb))
* remove output: standalone — crashes Netlify edge functions ([b58876c](https://github.com/brikdesigns/renew-pms/commit/b58876c9c780f5abde5ab6adf834dbaf7d967253))
* **renew:** settings padding/gap regression + .bds-* selector ratchet ([#228](https://github.com/brikdesigns/renew-pms/issues/228)) ([ed08dcb](https://github.com/brikdesigns/renew-pms/commit/ed08dcb6069768ef0d418ba998fcc80aa438745c))
* **renew:** theme toggle race + body color follows theme ([#229](https://github.com/brikdesigns/renew-pms/issues/229)) ([3ae56ca](https://github.com/brikdesigns/renew-pms/commit/3ae56caf0fc24104000aef8c67298e38b74abc16))
* replace generic 'Select option' with contextual placeholders ([c7f0e33](https://github.com/brikdesigns/renew-pms/commit/c7f0e3331d1e54573e6fa94feb949e56d148b46b))
* **requests:** admin-only triage on PATCH /api/requests/[id] ([#52](https://github.com/brikdesigns/renew-pms/issues/52)) ([bf8a2c0](https://github.com/brikdesigns/renew-pms/commit/bf8a2c0ee3954cd388ae9dd5ccfcee91a47206cb))
* **requests:** give MyRequestsList body cells an opaque white surface ([#70](https://github.com/brikdesigns/renew-pms/issues/70)) ([8a247a1](https://github.com/brikdesigns/renew-pms/commit/8a247a1dc53dadecee0d25d99228c4c8634a34f4))
* **requests:** role-aware loading skeleton; reuse cached practice ID ([#84](https://github.com/brikdesigns/renew-pms/issues/84)) ([1a1b31f](https://github.com/brikdesigns/renew-pms/commit/1a1b31fa1177f5b187998836bfbf76ad61060c0d))
* **requests:** wrap staff "My Requests" table in surface shell ([#104](https://github.com/brikdesigns/renew-pms/issues/104)) ([22e03fa](https://github.com/brikdesigns/renew-pms/commit/22e03fad9a118eec3eaa6d165249d20ef8088b2f))
* **security:** block open redirect via path-relative redirect param ([#216](https://github.com/brikdesigns/renew-pms/issues/216)) ([24273a4](https://github.com/brikdesigns/renew-pms/commit/24273a40ab89783128d32593a256424f13b8f7bd))
* **sentry:** add production gate, noise filters, and session replay to client config ([c51c8ca](https://github.com/brikdesigns/renew-pms/commit/c51c8ca2259ea284f086fc5a416ca1a8949e1fff))
* **settings:** smooth skeleton loading across settings table pages ([#89](https://github.com/brikdesigns/renew-pms/issues/89)) ([7c13645](https://github.com/brikdesigns/renew-pms/commit/7c13645b0fddbcb63346a7d5a17d16f41d59b720))
* square icon badges at 28px + portal tooltips for overflow escape ([b95e23e](https://github.com/brikdesigns/renew-pms/commit/b95e23e8239f62bfd70b6b9042aaee473ec5746f))
* standardize all API routes to admin client for DB operations ([d3153f3](https://github.com/brikdesigns/renew-pms/commit/d3153f3658bc3e657f6022780a215df94f1d7c33))
* table action buttons to sm, email lowercase, ProfileCard endContent ([caedcd6](https://github.com/brikdesigns/renew-pms/commit/caedcd6f6acfe3ee7bad48710a714dc938be5f94))
* **tables:** give every Table body cell an opaque white surface ([#72](https://github.com/brikdesigns/renew-pms/issues/72)) ([b507182](https://github.com/brikdesigns/renew-pms/commit/b507182626c88bfa4d3c2727223a1504620b07d3))
* **tasks:** admin-only reassign on PATCH /api/tasks/[id] ([#51](https://github.com/brikdesigns/renew-pms/issues/51)) ([7b0bdca](https://github.com/brikdesigns/renew-pms/commit/7b0bdcaa1bf5ad8d5189c5f288d199e0ace8aeac))
* **tasks:** board checkbox stays resolved + Show Resolved actually works ([#111](https://github.com/brikdesigns/renew-pms/issues/111)) ([cdfc933](https://github.com/brikdesigns/renew-pms/commit/cdfc933ffa3bf64b205902065d0315e54603a966))
* **tasks:** correct broken FK join on GET /api/tasks/[id] ([#48](https://github.com/brikdesigns/renew-pms/issues/48)) ([dcaa2fd](https://github.com/brikdesigns/renew-pms/commit/dcaa2fd94a18dc99b21d58d7bd8ea3c226b1df41))
* **tasks:** disambiguate same-name members in AssignmentPicker ([#110](https://github.com/brikdesigns/renew-pms/issues/110)) ([a0a9bd9](https://github.com/brikdesigns/renew-pms/commit/a0a9bd9f7ece29471301aa27ba27e40c4adb9084))
* **tasks:** persist completion + roll up checklist status to parent task ([#96](https://github.com/brikdesigns/renew-pms/issues/96)) ([8b9bed6](https://github.com/brikdesigns/renew-pms/commit/8b9bed649cc68a0aef3294d8271d1df1b9d8a518))
* **tasks:** propagate template reassignment to today's tasks ([#109](https://github.com/brikdesigns/renew-pms/issues/109)) ([0574232](https://github.com/brikdesigns/renew-pms/commit/057423225fdd1237e381039433c70447378b8212))
* **templates:** harden default DELETE + items PUT persistence ([#90](https://github.com/brikdesigns/renew-pms/issues/90)) ([650ab2e](https://github.com/brikdesigns/renew-pms/commit/650ab2e24bb640e9f6044e3487a9b170db9f5f19))
* update BDS submodule + resolve pre-existing type errors ([165b08a](https://github.com/brikdesigns/renew-pms/commit/165b08af484f05d5ac5960f647d4eb459b99e935))
* update BDS submodule + resolve pre-existing type errors ([9c99d07](https://github.com/brikdesigns/renew-pms/commit/9c99d07bd141cffd36ad968ae473f04b61e1e9e4))
* useVendors hook — add setVendors return + missing interface fields ([a10a548](https://github.com/brikdesigns/renew-pms/commit/a10a5489a0a04038d8c159d6ffa791cc21dba65c))
* vendor PATCH/DELETE — use admin client to avoid RLS timing issue ([ecd276d](https://github.com/brikdesigns/renew-pms/commit/ecd276d845796fa775090d390cde6a08871b9194))
* vendor portal — remove gap between sidebar and content, edge-to-edge columns ([a158694](https://github.com/brikdesigns/renew-pms/commit/a1586949f5ffe24f109e52ab16db91e72f6063a5))
* vendor portal — use portal's StatusBadge, PriorityBadge, and sheet styles ([9274db6](https://github.com/brikdesigns/renew-pms/commit/9274db645a270a606b268912825012b7e934ecfa))
* vendor portal polish — full-height layout, theme toggle, portal styles ([9929d43](https://github.com/brikdesigns/renew-pms/commit/9929d43be5cdafab0703f27f73012236975c283d))
* view toggle icons to sm, sync BDS (radio brand + modal min-width) ([0f0cd75](https://github.com/brikdesigns/renew-pms/commit/0f0cd75f072dfa44f31910a69cb765ec36030749))


### Performance

* **auth:** dedupe getAuthUser per request, skip middleware for docs ([#131](https://github.com/brikdesigns/renew-pms/issues/131)) ([79b10cc](https://github.com/brikdesigns/renew-pms/commit/79b10cca11eb037fe603c8f29e65e439157c1a7b))
* **tasks:** server-render tasks page data; eliminate 4-fetch waterfall ([#87](https://github.com/brikdesigns/renew-pms/issues/87)) ([5c27adb](https://github.com/brikdesigns/renew-pms/commit/5c27adbcd02e4e4c4d708c9d63672a6498405bf8))


### Refactors

* **avatar:** adopt BDS Avatar in renew UserAvatar wrapper ([#179](https://github.com/brikdesigns/renew-pms/issues/179)) ([c4fd31d](https://github.com/brikdesigns/renew-pms/commit/c4fd31d227579e8e28f3bae37a04c5bb90419068)), closes [#174](https://github.com/brikdesigns/renew-pms/issues/174)
* **bds:** adopt AddableFieldRowList for EditTemplateSheet authoring ([#74](https://github.com/brikdesigns/renew-pms/issues/74)) ([2223a8e](https://github.com/brikdesigns/renew-pms/commit/2223a8e0e52a801cdc5a031fba7a62e6703a8554))
* **bds:** adopt BDS Menu for 4 add-menu surfaces (Cat 2a final) ([#76](https://github.com/brikdesigns/renew-pms/issues/76)) ([498ed0f](https://github.com/brikdesigns/renew-pms/commit/498ed0fe6f9b8279dca1bc59e0c10458f5a706f3))
* **bds:** adopt BDS PageHeader, drop renew-local component ([#127](https://github.com/brikdesigns/renew-pms/issues/127)) ([1d57240](https://github.com/brikdesigns/renew-pms/commit/1d5724081f94f93d96f92e2da310e9b103f8550d))
* **bds:** adopt DataSection + drop redundant settings table h3s ([#189](https://github.com/brikdesigns/renew-pms/issues/189)) ([f738f95](https://github.com/brikdesigns/renew-pms/commit/f738f9596ce30bcc169478c794da55fee58e6f16))
* **bds:** adopt InteractiveListItem for 5 drill-down rows (Batch 8) ([#77](https://github.com/brikdesigns/renew-pms/issues/77)) ([8348677](https://github.com/brikdesigns/renew-pms/commit/8348677c9029e8323c22659faddaacc7b77e6580))
* **bds:** adopt Meter for DashboardClient DeptBar (closes [#101](https://github.com/brikdesigns/renew-pms/issues/101) sub) ([#126](https://github.com/brikdesigns/renew-pms/issues/126)) ([9689cf0](https://github.com/brikdesigns/renew-pms/commit/9689cf00a9f667661844a00d752c87c42278e84d))
* **bds:** adopt PageHeader on MyRequestsList (staff /requests view) ([#192](https://github.com/brikdesigns/renew-pms/issues/192)) ([c20926a](https://github.com/brikdesigns/renew-pms/commit/c20926ad6fd6bc7fdca2214d3c510f77299d2bb8))
* **bds:** adopt PageHeader on section pages outside settings ([#147](https://github.com/brikdesigns/renew-pms/issues/147)) ([862aa1f](https://github.com/brikdesigns/renew-pms/commit/862aa1f7ee39cb0ef01083568ac39862c3d8404a))
* **bds:** adopt PageHeader on tasks + requests (Phase A.6) ([#185](https://github.com/brikdesigns/renew-pms/issues/185)) ([b7b30d3](https://github.com/brikdesigns/renew-pms/commit/b7b30d37d047be3b2664997aa8a550b9786e39d8))
* **bds:** batch 1a — sheet skeleton on user + task sheets ([#115](https://github.com/brikdesigns/renew-pms/issues/115)) ([dc9867a](https://github.com/brikdesigns/renew-pms/commit/dc9867ae36d47d8905cc41572818283079cbd113))
* **bds:** batch 1b — sheet skeleton on edit/view sheets ([#116](https://github.com/brikdesigns/renew-pms/issues/116)) ([d271bcc](https://github.com/brikdesigns/renew-pms/commit/d271bcce5b9fbecf0d0d0b20dbf2f516b130060b))
* **bds:** batch 2 — settings tables cell-text slot classes ([#119](https://github.com/brikdesigns/renew-pms/issues/119)) ([4100c73](https://github.com/brikdesigns/renew-pms/commit/4100c73f451d2ad83fd5187c5ddbebb96dc524cf))
* **bds:** batch 3 — sheet skeleton on dashboard + cards ([#117](https://github.com/brikdesigns/renew-pms/issues/117)) ([6d9d4d3](https://github.com/brikdesigns/renew-pms/commit/6d9d4d31fb7dd29c4b38fe17ae665fd8ed7f20b4))
* **bds:** rename DevPersonaSwitcher headerStyle + Cat 6 audit rule ([#66](https://github.com/brikdesigns/renew-pms/issues/66)) ([bed7998](https://github.com/brikdesigns/renew-pms/commit/bed7998a709049155c53f6d5f4a0cec4b71c8085))
* **bds:** rename headingStyle vars to titleStyle + audit rule (Cat 6) ([#56](https://github.com/brikdesigns/renew-pms/issues/56)) ([e10302e](https://github.com/brikdesigns/renew-pms/commit/e10302e61980b8e96eff30556d04b30be4bbb2f9))
* **bds:** replace submodule with @brikdesigns/bds npm pkg ([62e490b](https://github.com/brikdesigns/renew-pms/commit/62e490b274b9be0e00917e803904bc46e2a49bbf))
* **bds:** replace submodule with @brikdesigns/bds npm pkg ([9e8b81f](https://github.com/brikdesigns/renew-pms/commit/9e8b81fe97b7368c20a5906300dbfa0cdf7d8327))
* **bds:** swap assignee MenuItem to BDS MenuItem (Cat 2a partial) ([#58](https://github.com/brikdesigns/renew-pms/issues/58)) ([b5b1e1b](https://github.com/brikdesigns/renew-pms/commit/b5b1e1b85bf0c63d5ecc620742beb25517a502c9))
* **bds:** swap CSSProperties button styles for BDS Button ([#54](https://github.com/brikdesigns/renew-pms/issues/54)) ([9e09512](https://github.com/brikdesigns/renew-pms/commit/9e0951252c8253c2b196799d3e09d9f2a9618410))
* **bds:** swap PageHeader tabs to BDS TabBar variant=text ([#75](https://github.com/brikdesigns/renew-pms/issues/75)) ([519e470](https://github.com/brikdesigns/renew-pms/commit/519e4703f329025d772ac3832df6c514e6c42b17))
* **bds:** swap PageHeader to TabBar variant=text-underline ([#80](https://github.com/brikdesigns/renew-pms/issues/80)) ([59c293b](https://github.com/brikdesigns/renew-pms/commit/59c293b02f8ee95e94ccda3196a2fd711272bbdb))
* **bds:** swap sidebar bottom buttons for IconButton (audit Cat 2c) ([#55](https://github.com/brikdesigns/renew-pms/issues/55)) ([3336d8c](https://github.com/brikdesigns/renew-pms/commit/3336d8c1197eb039d67c46072ea1952812f2accc))
* **bds:** swap ViewTaskSheet checklist row to BDS ChecklistItem ([#69](https://github.com/brikdesigns/renew-pms/issues/69)) ([772e7dd](https://github.com/brikdesigns/renew-pms/commit/772e7dd6e1ee07c921f79cc6f7f993e22af45025))
* **chrome:** migrate global shell elements into sidebar ([#161](https://github.com/brikdesigns/renew-pms/issues/161)) ([#162](https://github.com/brikdesigns/renew-pms/issues/162)) ([ee3aea6](https://github.com/brikdesigns/renew-pms/commit/ee3aea6e5e5e08f6a9cdd2bfbb993824ddd72c42))
* consolidate status/priority/frequency into shared Badge and Tag components ([cda1d88](https://github.com/brikdesigns/renew-pms/commit/cda1d88db0b788de386cf89039e6fda1a6c24fbf))
* consolidate user profiles — remove redundant training detail page ([9c3749b](https://github.com/brikdesigns/renew-pms/commit/9c3749ba3a420f7e2d4a4c8f235f40ad9f422b97))
* **feedback:** swap SegmentedControl for button radiogroup ([#19](https://github.com/brikdesigns/renew-pms/issues/19)) ([43d689b](https://github.com/brikdesigns/renew-pms/commit/43d689b780d3706afea5aaa0dc4420515db4277e))
* **infra:** allowlist bds-sheet__nav-link in token audit ([#33](https://github.com/brikdesigns/renew-pms/issues/33)) ([5222bc6](https://github.com/brikdesigns/renew-pms/commit/5222bc6225464547f099baa180bd672595882899))
* **infra:** canonicalize worktree-guard rule across repos ([#26](https://github.com/brikdesigns/renew-pms/issues/26)) ([8fd37ae](https://github.com/brikdesigns/renew-pms/commit/8fd37ae63d5f3bace71916b69700ce2cc3c4b15d))
* migrate middleware.ts → proxy.ts for Next.js 16 ([2cafe8b](https://github.com/brikdesigns/renew-pms/commit/2cafe8be8916b3cd36766f664969355ad81d501a))
* migrate timeline + notifications to BDS display components ([a5caaf8](https://github.com/brikdesigns/renew-pms/commit/a5caaf8b9bc73cffe0931f605e25ea8c8386bf59))
* rename system_role values across app code and docs ([786082e](https://github.com/brikdesigns/renew-pms/commit/786082e7d078bd261246888436e59bdb278b497f))
* **renew:** housekeeping — remove dead code and unused imports ([#30](https://github.com/brikdesigns/renew-pms/issues/30)) ([19a88fe](https://github.com/brikdesigns/renew-pms/commit/19a88feedea460c611dc9acfcc61d5e32667de1b))
* **renew:** migrate error and global-error pages to tokens ([#31](https://github.com/brikdesigns/renew-pms/issues/31)) ([b8b2748](https://github.com/brikdesigns/renew-pms/commit/b8b274817870407fcb45a24bde8a166cdbb192f2))
* **renew:** use border.radius.circle for vendor profile circle ([#32](https://github.com/brikdesigns/renew-pms/issues/32)) ([f1004a6](https://github.com/brikdesigns/renew-pms/commit/f1004a69733741788de181a53fa379593c778027))
* **tasks:** consolidate overdue indicator, add empty states ([#88](https://github.com/brikdesigns/renew-pms/issues/88)) ([6c0daaa](https://github.com/brikdesigns/renew-pms/commit/6c0daaa26386a8493afa6d1125fd69df2dc34295))
* **tasks:** future-proof pool scope for dept-tagged pool tasks ([#49](https://github.com/brikdesigns/renew-pms/issues/49)) ([458564c](https://github.com/brikdesigns/renew-pms/commit/458564cc36c403d6a6647bc30885fe0731292de2))
* title card — narrative prose paragraphs instead of bullet lists ([d2a5c46](https://github.com/brikdesigns/renew-pms/commit/d2a5c46651cc868c71c4598c08382c9f4d41479c))
* **training:** drop redundant staff sub-header on /training ([#193](https://github.com/brikdesigns/renew-pms/issues/193)) ([f79bf7d](https://github.com/brikdesigns/renew-pms/commit/f79bf7d9b78beca4a6e01047a22d144508d123fc))


### Documentation

* add branching model to CLAUDE.md ([f3ee398](https://github.com/brikdesigns/renew-pms/commit/f3ee398e7369338d6439203ebe30b4fc80cc741c))
* **bds:** note threshold check + [#375](https://github.com/brikdesigns/renew-pms/issues/375) dependency on Deferred Item [#3](https://github.com/brikdesigns/renew-pms/issues/3) ([#124](https://github.com/brikdesigns/renew-pms/issues/124)) ([530b540](https://github.com/brikdesigns/renew-pms/commit/530b540bcab982b9e5347826212bf8ea1c1c6ea0))
* **bds:** use stable MCP URL + add surface-product filter ([#36](https://github.com/brikdesigns/renew-pms/issues/36)) ([f9f24d5](https://github.com/brikdesigns/renew-pms/commit/f9f24d5eeebd717a5386bcb428f66002019c0f60))
* **claude:** codify "page header" vs `<PageHeader>` naming convention ([#148](https://github.com/brikdesigns/renew-pms/issues/148)) ([bc93581](https://github.com/brikdesigns/renew-pms/commit/bc93581cb63e8c331438735766eeffe087b1ea4b))
* **claude:** point LLM calls at @brikdesigns/claude-client ([#28](https://github.com/brikdesigns/renew-pms/issues/28)) ([88c92b0](https://github.com/brikdesigns/renew-pms/commit/88c92b03714ab4124c4214b0a91e648768947b5b))
* **claude:** point Session Discipline to cleanup-workflow.md ([#59](https://github.com/brikdesigns/renew-pms/issues/59)) ([41f159b](https://github.com/brikdesigns/renew-pms/commit/41f159b265ae5b7c20d6b0076d3359d3dba8fe90))
* **claude:** refresh chrome naming convention post-[#162](https://github.com/brikdesigns/renew-pms/issues/162) ([#169](https://github.com/brikdesigns/renew-pms/issues/169)) ([290b081](https://github.com/brikdesigns/renew-pms/commit/290b0810ef8afc49457ceb7688fb99a547a47636))
* **ia:** apply markdown IA framework to renew-pms CLAUDE.md ([#121](https://github.com/brikdesigns/renew-pms/issues/121)) ([4874a4b](https://github.com/brikdesigns/renew-pms/commit/4874a4b8d26d304910b46d6fb8e719597f4758d5))
* **infra:** add beta-launch runbook for Monday cutover ([#135](https://github.com/brikdesigns/renew-pms/issues/135)) ([0704335](https://github.com/brikdesigns/renew-pms/commit/0704335bcc853f419a0eabe875091d91ac17a163))
* **infra:** add GitHub Issue templates for standard work + bug reports ([#146](https://github.com/brikdesigns/renew-pms/issues/146)) ([8e846e1](https://github.com/brikdesigns/renew-pms/commit/8e846e1f7919999b0fe49b12c979d5b0f1d8b82e))
* **infra:** clarify beta email strategy in runbook §5.A ([#167](https://github.com/brikdesigns/renew-pms/issues/167)) ([8be1314](https://github.com/brikdesigns/renew-pms/commit/8be13145529a7a6d0cd6a3fb94d88af56a4d61a1))
* **infra:** correct §6.5 DNS provider + Netlify nomenclature drift ([#164](https://github.com/brikdesigns/renew-pms/issues/164)) ([5b39ff4](https://github.com/brikdesigns/renew-pms/commit/5b39ff46e55b32aeb5ebb52c5c79f8f183ad080a))
* **infra:** fold launch decisions into beta-launch runbook ([#137](https://github.com/brikdesigns/renew-pms/issues/137)) ([4e9acce](https://github.com/brikdesigns/renew-pms/commit/4e9acce7c2cccaab1c1511b6a5a69b3aef0c1c28))
* **infra:** reflect pre-launch staging-first workflow ([#20](https://github.com/brikdesigns/renew-pms/issues/20)) ([682d59a](https://github.com/brikdesigns/renew-pms/commit/682d59a1c519829101f1194dc42d3a1e28436cc2))
* **infra:** runbook progress + cross-machine resume + issue index ([#160](https://github.com/brikdesigns/renew-pms/issues/160)) ([cf5fe5b](https://github.com/brikdesigns/renew-pms/commit/cf5fe5b48e975c987e357b558d42524165a7bae3))
* pass 1 — demo-urgent correctness fixes ([#98](https://github.com/brikdesigns/renew-pms/issues/98)) ([2a98a38](https://github.com/brikdesigns/renew-pms/commit/2a98a3883a71ea8b1289c172bcbb12adb4a168bb))
* **qa:** add launch-readiness QA checklist ([#35](https://github.com/brikdesigns/renew-pms/issues/35)) ([c41e8ac](https://github.com/brikdesigns/renew-pms/commit/c41e8ac750e3d4b2fa33259bb2fe37af9688d028))
* **qa:** cleanup-handoff.md (transient session-state) ([#63](https://github.com/brikdesigns/renew-pms/issues/63)) ([87719f2](https://github.com/brikdesigns/renew-pms/commit/87719f2f8c5906957199b65832eabd885bcd70ee))
* **qa:** close component cleanup audit (status: resolved) ([#78](https://github.com/brikdesigns/renew-pms/issues/78)) ([094e545](https://github.com/brikdesigns/renew-pms/commit/094e5458bc01af346835986052e03cdc3db0e210))
* **qa:** component cleanup audit + reusable cleanup-workflow standard ([#53](https://github.com/brikdesigns/renew-pms/issues/53)) ([f2ffff3](https://github.com/brikdesigns/renew-pms/commit/f2ffff386dfcdae0fc51bbc14934e751c7ee89b2))
* **qa:** correct stale PR [#60](https://github.com/brikdesigns/renew-pms/issues/60)/[#61](https://github.com/brikdesigns/renew-pms/issues/61) refs in cleanup audit ([#71](https://github.com/brikdesigns/renew-pms/issues/71)) ([68bb62e](https://github.com/brikdesigns/renew-pms/commit/68bb62e73738eccb0ae08dc2862a5e45c179dfdb))
* **qa:** document Tier 1.5 shift-filtering gap ([#50](https://github.com/brikdesigns/renew-pms/issues/50)) ([0e24432](https://github.com/brikdesigns/renew-pms/commit/0e244323d6b4bf62d67d010b14c43c27b11d65a1))
* **qa:** flip Tier 0.2 + 0.5 to green (Resend pipeline verified) ([#68](https://github.com/brikdesigns/renew-pms/issues/68)) ([3d176de](https://github.com/brikdesigns/renew-pms/commit/3d176dec771b2a5fbc026ead4c1be2e2f0582692))
* **qa:** flip Tier 0.4 to green — account-edit spec already passes ([#73](https://github.com/brikdesigns/renew-pms/issues/73)) ([2135147](https://github.com/brikdesigns/renew-pms/commit/21351477b675933e9a6057537e18b5f618557a64))
* **qa:** inline-style cleanup audit doc ([#114](https://github.com/brikdesigns/renew-pms/issues/114)) ([cdf2bc2](https://github.com/brikdesigns/renew-pms/commit/cdf2bc2413fbd931a92319af2c1d8fed9104abe7))
* **qa:** link Notion Renew Workflows DB as broader catalog ([#43](https://github.com/brikdesigns/renew-pms/issues/43)) ([55003c2](https://github.com/brikdesigns/renew-pms/commit/55003c2bff56f678051e73655edf9d87e1291dfa))
* **qa:** link Tier 0.1/0.3/0.6 specs and document QA decisions ([#39](https://github.com/brikdesigns/renew-pms/issues/39)) ([30dee5f](https://github.com/brikdesigns/renew-pms/commit/30dee5ff3aa9893bb4e26e1b4873002046353424))
* **qa:** mark PR 2 ✅ merged in inline-style audit ([#120](https://github.com/brikdesigns/renew-pms/issues/120)) ([14b6b93](https://github.com/brikdesigns/renew-pms/commit/14b6b9307df24f0580b467df499722ca018c0fd4))
* **qa:** pivot Resend sender to piggyback brikdesigns.com ([#64](https://github.com/brikdesigns/renew-pms/issues/64)) ([e37134f](https://github.com/brikdesigns/renew-pms/commit/e37134fcad13eac74b39b70a9b204d3ac20a399a))
* **qa:** split Cat 2b — VRSheet resolved, VCSheet to Batch 8 (PR [#67](https://github.com/brikdesigns/renew-pms/issues/67)) ([#67](https://github.com/brikdesigns/renew-pms/issues/67)) ([1b6a7c9](https://github.com/brikdesigns/renew-pms/commit/1b6a7c9f51e669091a26fcf9a9ac5445afe631ad))
* **qa:** table remaining inline-style cleanup work ([#118](https://github.com/brikdesigns/renew-pms/issues/118)) ([d1591c9](https://github.com/brikdesigns/renew-pms/commit/d1591c95132559546581df9586af2841999282d7))
* **qa:** use support@ instead of renew@ for Resend sender ([#65](https://github.com/brikdesigns/renew-pms/issues/65)) ([72273de](https://github.com/brikdesigns/renew-pms/commit/72273de4845e10b757644286834d385d1ceba80b))

# Changes

## 0.1.0 2026-11-20

First entry of this change log. Earlier versions are on npm and in the git history.

* Seneca 4: the peer dependency is `seneca` `^4.0.0` (was
  `>=3||>=4.0.0-rc2`). Seneca 3 users stay on `@seneca/telemetry@0.0.4`.
* Node.js 24 or later (`engines.node` `>=24`, was `>=16`).
* The peer dependency `seneca-promisify` is removed: promises are built
  into Seneca 4 (D4). The tests and `test/quick.js` no longer load it.
* `sys:telemetry,get:msg` for a pattern that has no recorded calls
  returns empty `aggd` and `trace` instead of failing with a `TypeError`.
* The pipeline hooks no longer pass the anchors `after: 'announce'` and
  `before: 'make_error'`, which named no task and had no effect. The hooks
  run where they always ran: last in the inward and outward pipelines.
  They are named `telemetry_inward` and `telemetry_outward`.
* Tests: new tests record nested calls, `prior` chains and a failing
  action, and check `get:msg` and the place of the hooks in the
  pipelines. devDependencies: `seneca` `^4.0.0` and `seneca-msg-test`
  `^5.0.0`; the unused `@seneca/maintain` is removed.
* `repository.url` uses `git+https`, `publishConfig` sets public access,
  and the package includes `README.md` and `CHANGES.md`.

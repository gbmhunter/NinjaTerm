After all changes, run unit tests with:

```bash
npm run test:unit
```

Also make sure there are not any typescript errors by running:

```bash
npx tsc
```

If updating any settings that are stored in the app data, make sure to add the migration code to the app data manager.

Only bump the app data version (`LATEST_VERSION`) once per release. If the latest migration is still unreleased (i.e. `package.json` `version` hasn't shipped with the current `LATEST_VERSION` yet), fold new schema changes into that existing migration function rather than adding a new version step. Only add a fresh migration + `LATEST_VERSION` bump once the current version has actually been released.

When you bump `LATEST_VERSION`, also capture the matching `local-storage-data/appData-v<N>-*.json` default snapshot — the release preflight (`scripts/check-appdata-snapshot.mjs`) requires one for the current version or it aborts the release. Quickest way to generate it without the GUI: run the previous version's snapshot through `migrateAppData` and write the result (`JSON.stringify(appData, null, 2)`), which is identical to a fresh `AppData` at the new version.

Don't update the NinjaTerm application under web/, this is in maintenance mode and not updated unless it's a critical bug.

When making changes that affect behaviour — features, bug fixes, performance changes, dependency drops, anything user- or developer-visible — add a corresponding entry to the `## Unreleased` section of `CHANGELOG.md` under `### Added` / `### Changed` / `### Fixed` as appropriate. Do this in the same PR as the change, not as a separate follow-up — once it's merged the context fades and the entry never gets written. Internal-only refactors with zero outward impact (e.g. renaming a private helper) don't need a CHANGELOG entry.

**Keep entries terse.** Aim for one to two sentences total — the ones currently in the `## Unreleased` section are the model, not the older release sections (which got long). The standard shape is one bold-led clause that names the user-visible outcome, followed by ≤1 sentence of technical detail (key file / function names are fine; full paragraphs of context are not). Numbers and methodology that don't fit go in a linked file (e.g. `performance-profiles/THROUGHPUT_BASELINES.md`), not the entry. If an entry runs to three sentences or more, cut it back before merging.

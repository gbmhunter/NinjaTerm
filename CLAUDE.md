After all changes, run unit tests with:

```bash
npm run test:unit
```

Also make sure there are not any typescript errors by running:

```bash
npx tsc
```

If updating any settings that are stored in the app data, make sure to add the migration code to the app data manager.

Don't update the NinjaTerm application under web/, this is in maintenance mode and not updated unless it's a critical bug.

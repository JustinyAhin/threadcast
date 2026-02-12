# Releasing Threadcast CLI

## Prerequisites

- Push access to `JustinyAhin/threadcast`
- All changes merged to `main`

## Steps

1. **Bump version** in `packages/cli/package.json`

2. **Commit and push**

   ```bash
   git add packages/cli/package.json
   git commit -m "cli: bump to vX.Y.Z"
   git push
   ```

3. **Trigger the release workflow**

   ```bash
   gh workflow run release-cli.yml -f version=X.Y.Z
   ```

   This builds standalone binaries on CI for all platforms (macOS ARM/Intel, Linux x64/ARM) and creates a GitHub Release at `cli-vX.Y.Z` with the binaries attached.

4. **Verify the release**

   ```bash
   gh release view cli-vX.Y.Z
   ```

## Local build (current platform only)

```bash
bun run --filter @threadcast/cli build
# Output: packages/cli/dist/threadcast-<platform>-<arch>
```

# Lobot

IM-only Channel desktop client by [LobeHub](https://lobehub.com): chat with your agents and your team's Channels in one place.

## Download

Get the latest build from the [Releases](../../releases) page.

| Platform              | Artifact                    |
| --------------------- | --------------------------- |
| macOS (Apple Silicon) | `Lobot-*-arm64.dmg`         |
| Windows               | `Lobot-*-setup.exe`         |
| Linux                 | `Lobot-*.AppImage` / `.deb` |

## Development

Requires Node.js 24, [pnpm](https://pnpm.io) 12 and [Bun](https://bun.sh).

```bash
pnpm install      # install dependencies
bun run dev       # start the Electron app with the Vite dev server
bun run start     # build once and run the built app
```

Layout:

- `src/`: renderer (React SPA)
- `electron/`: Electron main, preload and overlay processes
- `packages/`: shared workspace packages

Package locally without signing:

```bash
bun run package:local
```

## Release

`.github/workflows/auto-release.yml` tags a patch version (`vX.Y.Z`) when CI passes on `main` and user-facing commits landed since the last tag. The tag push runs `.github/workflows/release-desktop.yml`, which compares the shell ABI with the last full release on the channel:

- **Shell unchanged**: it ships only the core as an incremental (OTA) update through `release-desktop-core-ota.yml`.
- **Shell changed, or no full release yet**: it builds macOS, Windows and Linux packages, publishes them to a GitHub Release and syncs them to the S3 update server. With `SPARKLE_ED_PUBLIC_KEY` / `SPARKLE_ED_PRIVATE_KEY` set, macOS builds embed Sparkle and the release also publishes a signed appcast with delta patches.

Release Desktop can also run by hand from the Actions tab with a version and channel (`stable` / `beta` / `canary`); `mode: full` forces a full release.

## Contributing

Issues and pull requests are welcome. Branch from `main` and open the pull request against `main`; commit messages start with a [gitmoji](https://gitmoji.dev).

## License

[LobeHub Community License](./LICENSE)

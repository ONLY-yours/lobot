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

`.github/workflows/release-desktop.yml` builds macOS, Windows and Linux packages from this repository, publishes them to a GitHub Release and syncs them to the S3 update server. It runs on a `v*` tag push, or by hand from the Actions tab with a version and channel (`stable` / `beta` / `canary`).

## Contributing

Issues and pull requests are welcome. Branch from `main` and open the pull request against `main`; commit messages start with a [gitmoji](https://gitmoji.dev).

## License

[LobeHub Community License](./LICENSE)

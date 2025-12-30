# Scrivenry

**Your notes. Your data. Your control.**

Scrivenry is a self-hosted documentation platform with a block-based editor. All your data stays on your machine - no cloud, no subscriptions, no tracking.

## Download

Download the latest version for your platform:

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | [Scrivenry-0.1.0-arm64.dmg](https://github.com/justynroberts/scrivenry/releases/latest) |
| Windows | [Scrivenry-Setup-0.1.0.exe](https://github.com/justynroberts/scrivenry/releases/latest) |
| Linux (AppImage) | [Scrivenry-0.1.0.AppImage](https://github.com/justynroberts/scrivenry/releases/latest) |
| Linux (Debian) | [scrivenry_0.1.0_amd64.deb](https://github.com/justynroberts/scrivenry/releases/latest) |

Or visit the [Releases page](https://github.com/justynroberts/scrivenry/releases) for all versions.

## Features

- **Block-based Editor** - Type `/` to insert headings, lists, code blocks, tables, charts, and more
- **Nested Pages** - Organize your content with unlimited page hierarchy
- **Animated Covers** - 21 beautiful animated backgrounds for your pages
- **Dark Mode** - Easy on the eyes, always
- **Local Storage** - All data stored in SQLite on your machine
- **Keyboard Shortcuts** - `Cmd+K` search, `Cmd+/` shortcuts, `Cmd+.` zen mode
- **Export** - Export pages as Markdown or HTML
- **Tags & Favorites** - Organize and quickly access your pages

## Getting Started

1. **Download** the app for your platform from the links above
2. **Install** by opening the downloaded file
   - macOS: Open the `.dmg` and drag Scrivenry to Applications
   - Windows: Run the installer
   - Linux: Make the AppImage executable or install the `.deb`
3. **Launch** Scrivenry and create your account (stored locally)
4. **Start writing** - your first page is ready

## Editor Basics

| Action | How |
|--------|-----|
| Insert block | Type `/` then select a block type |
| Bold text | `Cmd+B` or `**text**` |
| Italic text | `Cmd+I` or `*text*` |
| Code | `` `code` `` |
| Link | `Cmd+K` while text selected |
| Search | `Cmd+K` |
| Zen mode | `Cmd+.` |

### Block Types

- Headings (H1, H2, H3)
- Bullet and numbered lists
- Task lists with checkboxes
- Code blocks with syntax highlighting
- Tables
- Blockquotes
- Dividers
- Mermaid diagrams
- Charts

## Screenshots

*Coming soon*

## Running from Source

For developers who want to run from source:

```bash
# Clone the repository
git clone https://github.com/justynroberts/scrivenry.git
cd scrivenry

# Install dependencies
npm install

# Initialize the database
npm run db:init

# Start the development server
npm run dev

# Or run as desktop app
npm run electron:dev
```

## Building from Source

```bash
# Build for your platform
npm run electron:build:mac    # macOS
npm run electron:build:win    # Windows
npm run electron:build:linux  # Linux
```

Built artifacts will be in `dist-electron/`.

## Data Location

Your data is stored locally:

| Platform | Location |
|----------|----------|
| macOS | `~/Library/Application Support/Scrivenry/` |
| Windows | `%APPDATA%/Scrivenry/` |
| Linux | `~/.config/Scrivenry/` |

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Made with care. Your knowledge deserves a home that respects your privacy.

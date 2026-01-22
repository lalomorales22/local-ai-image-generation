# FLUX Studio

A sleek, local AI image generation app powered by [FLUX.2 Klein](https://ollama.com/x/flux2-klein) running on [Ollama](https://ollama.com).

![FLUX Studio](https://img.shields.io/badge/FLUX-Studio-white?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTEyIDMtMS45MTIgNS44MTNhMiAyIDAgMCAxLTEuMjc1IDEuMjc1TDMgMTJsNS44MTMgMS45MTJhMiAyIDAgMCAxIDEuMjc1IDEuMjc1TDEyIDIxbDEuOTEyLTUuODEzYTIgMiAwIDAgMSAxLjI3NS0xLjI3NUwyMSAxMmwtNS44MTMtMS45MTJhMiAyIDAgMCAxLTEuMjc1LTEuMjc1TDEyIDN6Ii8+PC9zdmc+)
![macOS](https://img.shields.io/badge/macOS-only-black?style=for-the-badge&logo=apple)
![License](https://img.shields.io/badge/license-MIT-white?style=for-the-badge)

## Features

- **Local AI Image Generation** - Generate images entirely on your machine using FLUX.2 Klein
- **Beautiful Gallery** - Browse, organize, and manage your generated images
- **Categories** - Create custom categories to organize your creations
- **Favorites** - Mark your best images as favorites
- **Image Details** - View prompts, timestamps, and navigate through images
- **Keyboard Shortcuts** - Quick generation with `⌘ + Enter`, navigate gallery with arrow keys
- **Clean UI** - Minimalist black & white design with a widget-style interface

## Screenshots

```
┌─────────────────────────────────────────────────────────────┐
│  ○ Generate                    ○ Gallery (12)               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Create an image                          │
│                  Powered by FLUX.2 Klein                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Describe your image...                              │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    ✦ Generate                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Requirements

- **macOS** (FLUX image generation currently only works on macOS)
- **Node.js** 18 or higher
- **Ollama** installed and running

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/lalomorales22/flux-studio.git
cd flux-studio
```

### 2. Run the start script

```bash
./start.sh
```

This will:
- Check for and install Ollama if needed
- Pull the FLUX.2 Klein model (~5.7GB)
- Install all dependencies
- Start the app and open it in your browser

## Manual Installation

If you prefer to install manually:

### 1. Install Ollama

```bash
# Download from https://ollama.com or use Homebrew
brew install ollama
```

### 2. Pull the FLUX model

```bash
ollama pull x/flux2-klein
```

### 3. Install dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

### 4. Start the app

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

## Creating the `flux` Command

To start the app by simply typing `flux` in your terminal:

### Option 1: Add alias to your shell (recommended)

```bash
# For zsh (default on macOS)
echo 'alias flux="/path/to/flux-studio/flux"' >> ~/.zshrc
source ~/.zshrc

# For bash
echo 'alias flux="/path/to/flux-studio/flux"' >> ~/.bashrc
source ~/.bashrc
```

Replace `/path/to/flux-studio` with the actual path where you cloned the repo.

### Option 2: Add to PATH

```bash
# Create a symlink in /usr/local/bin
sudo ln -s /path/to/flux-studio/flux /usr/local/bin/flux
```

Now you can start the app from anywhere:

```bash
flux
```

## Usage

### Generating Images

1. Click the **Generate** tab
2. Enter a description of the image you want to create
3. Click **Generate** or press `⌘ + Enter`
4. Wait for the image to be generated (typically 15-60 seconds depending on your hardware)

### Tips for Better Prompts

FLUX.2 Klein excels at:
- **Text rendering** - "A neon sign reading 'OPEN 24 HOURS' in a rainy alley"
- **UI mockups** - "Mobile app interface showing account balance with clean iOS design"
- **Product photography** - "Luxury watch on dark velvet, dramatic side lighting"
- **Specific colors** - Use hex codes like "gradient background #FF6B35 to #F7C59F"

### Managing Your Gallery

- **Categories** - Click `+ New` to create custom categories
- **Favorites** - Click the heart icon to favorite images
- **Navigation** - Use `←` `→` arrow keys to browse in the modal
- **Actions** - Download, copy prompt, or use prompt for new generation

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘ + Enter` | Generate image |
| `←` `→` | Navigate images in modal |
| `Esc` | Close modal |

## Project Structure

```
flux-studio/
├── server/
│   └── index.js          # Express backend with Ollama integration
├── client/
│   ├── src/
│   │   ├── App.jsx       # Main React component
│   │   └── index.css     # Tailwind styles
│   └── package.json
├── public/
│   └── images/           # Generated images stored here
├── gallery.json          # Gallery metadata
├── flux                  # CLI launcher script
├── start.sh              # Installation & start script
└── package.json
```

## Configuration

### Changing the Model

To use a different FLUX model variant, edit `server/index.js`:

```javascript
// Default model
const DEFAULT_MODEL = 'x/flux2-klein'

// For higher quality (larger, slower)
const DEFAULT_MODEL = 'x/flux2-klein:9b'
```

### Changing Ports

- **Backend**: Edit `PORT` in `server/index.js` (default: 3001)
- **Frontend**: Edit `server.port` in `client/vite.config.js` (default: 5173)

## Troubleshooting

### "Model not found" error

Make sure the FLUX model is installed:

```bash
ollama list | grep flux
# Should show: x/flux2-klein:latest
```

If not, pull it:

```bash
ollama pull x/flux2-klein
```

### "Connection refused" error

Make sure Ollama is running:

```bash
ollama serve
```

### Images not generating

Check that you're on macOS. FLUX image generation currently only works on macOS due to MLX requirements.

### Slow generation

Generation speed depends on your Mac's hardware:
- M1/M2/M3 Macs: 15-45 seconds per image
- Intel Macs: May be significantly slower or unsupported

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Credits

- [FLUX.2 Klein](https://blackforestlabs.ai/) by Black Forest Labs
- [Ollama](https://ollama.com) for local model hosting
- Built with React, Vite, Tailwind CSS, and Framer Motion

---

Made with ✦ by [@lalomorales22](https://github.com/lalomorales22)

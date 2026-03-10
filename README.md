# 🎞️ Klipy GIF Search — Chrome Extension

> Search, preview, and copy GIF links without leaving the page.

A lightweight Chrome extension that lets you search for GIFs using the [Klipy API](https://klipy.com), save favorites, and quickly copy links — all from a sleek popup with dark mode support.

![Chrome](https://img.shields.io/badge/Platform-Chrome-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **GIF Search** | Search millions of GIFs powered by the Klipy API |
| ♾️ **Infinite Scroll** | Automatically loads more results as you scroll |
| ❤️ **Favorites** | Save your favorite GIFs for quick access |
| 🌗 **Dark / Light Mode** | Toggle between themes with one click |
| 🔗 **Copy Link** | Click any GIF to preview it and copy its URL |
| ⌨️ **Keyboard Shortcut** | Open the popup with `Ctrl+Shift+Y` |
| ⚡ **Local Cache** | Results are cached for 24 hours to reduce API calls |
| ⚙️ **Settings Page** | Configure your API key from a dedicated options page |

---

## 📸 Screenshots

<!-- Add your screenshots here -->
<!-- ![Search](screenshots/search.png) -->
<!-- ![Dark Mode](screenshots/dark-mode.png) -->

---

## 🚀 Installation

### From the Chrome Web Store

> _Coming soon!_

### Development Installation

1. **Clone** this repository:
   ```bash
   git clone https://github.com/Klysman08/TenorExtension.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (toggle in the top-right corner)

4. Click **Load unpacked** and select the cloned project folder

5. The extension icon will appear in your toolbar — click it to start searching!

---

## 🔑 API Key Setup

This extension uses the **Klipy API** to fetch GIFs. You'll need a free API key:

1. Visit the [Klipy Partner Panel](https://partner.klipy.com/api-keys) and create a free key
2. Click the **⚙️ Settings** button in the extension popup
3. Paste your API key and click **Save Settings**

Alternatively, you can set your key directly in `config.js`:

```js
const config = {
    apiKey: 'YOUR_API_KEY_HERE'
};
```

> **Note:** Never commit your API key to a public repository. The `config.js` file ships with an empty key by default.

---

## 📁 Project Structure

```
TenorExtension/
├── manifest.json       # Chrome Extension manifest (v3)
├── popup.html          # Main popup UI
├── popup.js            # Search logic, favorites, modal, state management
├── options.html        # Settings / options page
├── options.js          # API key save/restore logic
├── config.js           # API key configuration (empty by default)
├── style.css           # All styles (light & dark themes)
├── images/
│   ├── icon16.png      # Toolbar icon (16×16)
│   ├── icon48.png      # Extensions page icon (48×48)
│   └── icon128.png     # Chrome Web Store icon (128×128)
├── LICENSE             # MIT License
├── CONTRIBUTING.md     # Contribution guidelines
├── CODE_OF_CONDUCT.md  # Contributor Covenant
├── PRIVACY.md          # Privacy policy
└── README.md           # This file
```

---

## 🛠️ Tech Stack

- **Vanilla JavaScript** — no frameworks, no build step
- **Chrome Extensions Manifest V3** — modern extension architecture
- **Klipy API** — GIF search provider
- **CSS Custom Properties** — theme system with light/dark mode
- **Google Fonts (Kanit)** — typography

---

## 🤝 Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) and follow the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🔒 Privacy

This extension does not collect or transmit personal data. See the full [Privacy Policy](PRIVACY.md).

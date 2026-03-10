# Privacy Policy — Klipy GIF Search Extension

**Last updated:** March 2025

## Data Collection

This extension collects and stores the following data **locally on your device**:

| Data | Storage | Purpose |
|------|---------|---------|
| Klipy API Key | `chrome.storage.sync` | Authenticate API requests |
| Search results cache | `localStorage` | Improve performance and reduce API calls |
| Favorite GIFs | `localStorage` | Persist your saved GIFs |
| Theme preference | `localStorage` | Remember dark/light mode choice |

## External Requests

- Search queries are sent to the **Klipy API** (`https://api.klipy.com`) to fetch GIF results.
- No data is sent to any other third-party service.
- No analytics or tracking is performed.

## Data Sharing

This extension does **not** sell, share, or transmit your personal data to any third party.

## Permissions

| Permission | Reason |
|------------|--------|
| `activeTab` | Required by Chrome extensions for popup functionality |
| `storage` | Save your API key across devices via Chrome sync |

## Contact

If you have questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/Klysman08/TenorExtension).

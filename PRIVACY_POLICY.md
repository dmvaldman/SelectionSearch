# Privacy Policy for Selection Search

**Last Updated:** December 2024

## Overview

Selection Search ("we", "our", or "the Extension") is committed to protecting your privacy. This Privacy Policy explains how we handle your data when you use our Chrome extension.

## Data Collection

### What We Collect

- **Exa API Key**: Your Exa API key is stored locally on your device using Chrome's `chrome.storage.local` API
- **Selected Text**: When you use the extension, the text you highlight is sent to Exa's API for semantic search
- **Search Results**: Links and snippets are retrieved from Exa's API and displayed to you

### What We DON'T Collect

- Personal information
- Browsing history
- Search history
- Device information
- Location data
- Account credentials (other than your API key for Exa)

## How We Use Your Data

### Local Storage
- Your Exa API key is stored securely on your device using Chrome's local storage
- This data never leaves your device
- You can delete this data at any time using the extension's popup

### API Requests
- When you perform a search, your selected text is sent to Exa's API (`https://api.exa.ai/search`)
- This is necessary to provide search functionality
- Your API key is used to authenticate the request with Exa
- No data is sent to any other third-party services

## Data Storage

- **Exa API Key**: Stored locally on your device via Chrome's storage API
- **No data is stored on our servers** - we do not operate any servers or databases
- All processing happens locally on your device or through Exa's API

## Third-Party Services

This extension uses the following third-party service:

### Exa AI
- **Purpose**: Providing semantic search results
- **Data Sent**: Your selected text and API key for authentication
- **Privacy Policy**: https://exa.ai/privacy
- **Terms of Service**: https://exa.ai/terms

## Your Rights

You have the right to:
- Delete your API key at any time using the extension
- Access your stored API key through the extension's popup
- Uninstall the extension at any time (which removes all locally stored data)

## Security

- Your API key is stored using Chrome's secure local storage
- All API communications use HTTPS encryption
- We do not have access to your API key or any of your data

## Children's Privacy

This extension is not intended for children under 13 years of age. We do not knowingly collect personal information from children.

## Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date.

## Contact

If you have questions about this Privacy Policy, please open an issue on our GitHub repository.

## Data Deletion

To delete all data associated with this extension:
1. Click the extension icon
2. Click "Delete Key" button
3. Or simply uninstall the extension

Upon uninstallation, all locally stored data is immediately removed from your device.


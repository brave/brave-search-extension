# Brave Search Extension

This repository contains the source code for the Brave Search browser extension. The extension integrates Brave Search into your browser, providing a seamless and private search experience.

The extension is available from:

- [Chrome Web Store](https://chromewebstore.google.com/detail/brave-search/imoinfjmpciaeboldbfaakmmjkijkeff)
- [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/bravesearch/)
- [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/brave-search/bjpekkhcepneihdjkpoenkejgaalgaae)

## Project Structure

#### `/build` directory

Contains various scripts for the purpose of constructing browser-specific extension packages.

#### `/src` directory

Source for the browser extension. This is presently only a manifest.jsonc file (and icons), which serves as the base/template for the browser-specific manifest files generated during the *packaging* process.

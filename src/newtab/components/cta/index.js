import '../download/index.js';
import { loadStyleSheet, replaceDataI18nAttributes } from '../utils.js';
import { preferences } from '../preferences.js';

const styles = await loadStyleSheet(new URL('./styles.css', import.meta.url));

class CTA extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [styles];

    // Respect the user's own choice (persisted via the context menu); there's
    // no author-set default to fall back to here, so unlike search-box,
    // absence of a stored preference just means "shown."
    this.hidden = preferences.showDownloadOffer === false;

    this.shadowRoot.innerHTML = `
      <img class="cta-logo" data-i18n='{ "key": "ctaLogoAlt", "where": "alt" }' width="21" height="24" src="../icons/brave_64x64.png" />
      <div class="cta-text">
        <div class="cta-title" data-i18n='{ "key": "ctaTitle", "where": "text" }'>
          Brave Browser
        </div>
        <div class="cta-subtitle" data-i18n='{ "key": "ctaSubtitle", "where": "text" }'>
          Enjoying private search? Try the browser that puts you first.
        </div>
      </div>
      <download-button></download-button>
    `;

    replaceDataI18nAttributes(this.shadowRoot);
  }
}

customElements.define('cta-banner', CTA);

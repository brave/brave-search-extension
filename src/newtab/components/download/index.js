import styles from './styles.css' with { type: 'css' };
import { replaceDataI18nAttributes } from '../utils.js';

const BASE_URL = 'https://brave.com/download/now/';

const PARAMS = new URLSearchParams({
  mtm_campaign: 'download',
  mtm_source: 'extension-ntp',
});

class DownloadButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [styles];
    this.shadowRoot.innerHTML = `
      <a class="download-button" href="${BASE_URL}?${PARAMS.toString()}">
        <span data-i18n='{ "key": "downloadButtonLabel", "where": "text" }'>Download</span>
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
          <path stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" d="M8 2v8m0 0 3-3M8 10 5 7M3 12.5h10" />
        </svg>
      </a>
    `;

    replaceDataI18nAttributes(this.shadowRoot);
  }
}

customElements.define('download-button', DownloadButton);

import '../ask-ai/index.js';
import styles from './styles.css' with { type: 'css' };
import { replaceDataI18nAttributes } from '../utils.js';
import { preferences } from '../preferences.js';

const EXT_SOURCE = 'extension-ntp'; // Identifies the source of the search traffic
const SEARCH_URL = 'https://search.brave.com/search';
const ASK_AI_URL = 'https://search.brave.com/ask';

class SearchBox extends HTMLElement {
  static get observedAttributes() {
    return ['ai-enabled'];
  }

  // Whether or not to show/suggest AI-related content. The user's own
  // choice (persisted via the context menu) takes precedence over the
  // ai-enabled attribute, which just sets the default.
  get aiEnabled() {
    const stored = preferences.showAskAi;
    return stored === null
      ? this.getAttribute('ai-enabled') !== 'false'
      : stored;
  }

  set aiEnabled(value) {
    this.setAttribute('ai-enabled', value ? 'true' : 'false');
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [styles];

    this.shadowRoot.innerHTML = `
      <img class="logo logo-light" src="../icons/brave-logo-light.svg" data-i18n='{ "key": "searchLogoAlt", "where": "alt" }' alt="" />
      <img class="logo logo-dark" src="../icons/brave-logo-dark.svg" data-i18n='{ "key": "searchLogoAlt", "where": "alt" }' alt="" />
      <form action="${SEARCH_URL}" method="GET">
        <input type="search" data-i18n='{ "key": "searchPlaceholder", "where": "placeholder, aria-label" }' name="q" autofocus autocomplete="off" />
        <input type="hidden" name="source" value="${EXT_SOURCE}" />
      </form>
    `;

    replaceDataI18nAttributes(this.shadowRoot);

    // Bind the ask-ai event to the form
    this.shadowRoot.querySelector('form').addEventListener('ask-ai', () => {
      const query = this.shadowRoot.querySelector('input[name="q"]').value;
      const params = new URLSearchParams({
        q: query,
        source: EXT_SOURCE,
      });
      location.href = `${ASK_AI_URL}?${params.toString()}`;
    });

    this.updateAskAi();
  }

  attributeChangedCallback(name) {
    if (name === 'ai-enabled') this.updateAskAi();
  }

  updateAskAi() {
    const form = this.shadowRoot.querySelector('form');
    const existing = form.querySelector('ask-button');

    if (this.aiEnabled && !existing) {
      form.insertAdjacentHTML('beforeend', '<ask-button></ask-button>');
    } else if (!this.aiEnabled && existing) {
      existing.remove();
    }
  }
}

customElements.define('search-box', SearchBox);

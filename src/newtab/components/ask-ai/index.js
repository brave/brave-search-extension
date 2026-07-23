import styles from './styles.css' with { type: 'css' };
import { replaceDataI18nAttributes } from '../utils.js';

class AskButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [styles];
    this.shadowRoot.innerHTML = `
      <button class="ask-ai-button" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="icon" viewBox="0 0 16 16">
          <path fill="currentColor" fill-rule="evenodd" d="M5.196.465a7.86 7.86 0 0 1 3.6-.409.843.843 0 0 1-.2 1.672 6.18 6.18 0 0 0-6.647 4.34 6.175 6.175 0 1 0 12.04 1.028.841.841 0 1 1 1.67-.209 7.86 7.86 0 0 1-1.68 5.902l1.775 1.774a.842.842 0 0 1-1.191 1.19l-1.775-1.774c-.546.44-1.15.804-1.799 1.086l-.1.043q-.15.063-.304.119l-.095.035-.046.018q-.03.01-.06.017a7.85 7.85 0 0 1-6.076-.427A7.86 7.86 0 0 1 2.16 2.448 7.9 7.9 0 0 1 5.196.465m2.667 3.61c.3 0 .563.204.636.495l.227.904a2.29 2.29 0 0 0 1.67 1.666l.906.226a.655.655 0 0 1 0 1.27l-.904.227a2.29 2.29 0 0 0-1.668 1.669l-.225.904a.656.656 0 0 1-1.273 0l-.226-.902a2.29 2.29 0 0 0-1.67-1.666l-.905-.226a.655.655 0 0 1-.001-1.27l.904-.227a2.3 2.3 0 0 0 1.668-1.669l.226-.904a.656.656 0 0 1 .635-.497m3.92-2.39c.171 0 .32.117.363.283l.128.515c.118.467.484.832.952.949l.515.128a.373.373 0 0 1 .001.724l-.515.128a1.3 1.3 0 0 0-.95.95l-.129.515a.373.373 0 0 1-.723.001l-.13-.514a1.31 1.31 0 0 0-.951-.95l-.516-.127a.373.373 0 0 1 0-.724l.515-.129c.468-.117.833-.483.95-.95l.128-.515a.374.374 0 0 1 .362-.283" clip-rule="evenodd"></path>
        </svg>
        <span data-i18n='{ "key": "askAiButtonLabel", "where": "text" }'>Ask</span>
      </button>
    `;

    replaceDataI18nAttributes(this.shadowRoot);

    // Bind the button click event to the ask-ai event
    this.shadowRoot.querySelector('button').addEventListener('click', () => {
      this.dispatchEvent(
        new CustomEvent('ask-ai', { bubbles: true, composed: true }),
      );
    });
  }
}

customElements.define('ask-button', AskButton);

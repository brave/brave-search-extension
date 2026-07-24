import { loadStyleSheet, replaceDataI18nAttributes } from '../utils.js';
import { preferences } from '../preferences.js';

const styles = await loadStyleSheet(new URL('./styles.css', import.meta.url));

class ContextMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [styles];
    this.shadowRoot.innerHTML = `
      <div class="menu">
        <label class="menu-item">
          <input type="checkbox" />
          <span data-i18n='{ "key": "contextMenuAskAiOption", "where": "text" }'>Ask AI button</span>
        </label>
        <label class="menu-item">
          <input type="checkbox" />
          <span data-i18n='{ "key": "contextMenuDownloadOption", "where": "text" }'>Download offer</span>
        </label>
      </div>
    `;

    replaceDataI18nAttributes(this.shadowRoot);

    const [askAiCheckbox, downloadCheckbox] =
      this.shadowRoot.querySelectorAll('input');
    this.askAiCheckbox = askAiCheckbox;
    this.downloadCheckbox = downloadCheckbox;

    askAiCheckbox.addEventListener('change', () => {
      preferences.showAskAi = askAiCheckbox.checked;
      document.querySelector('search-box').aiEnabled = askAiCheckbox.checked;
    });

    downloadCheckbox.addEventListener('change', () => {
      preferences.showDownloadOffer = downloadCheckbox.checked;
      document.querySelector('cta-banner').hidden = !downloadCheckbox.checked;
    });

    // Only take over the browser's native context menu for the page in
    // general - inputs/textareas need it for copy/paste/spellcheck.
    window.addEventListener('contextmenu', (event) => {
      const target = event.composedPath()[0];
      if (target.matches?.('input, textarea, [contenteditable="true"]')) return;
      this.open(event);
    });

    window.addEventListener('mousedown', (event) => {
      if (this.hasAttribute('open') && !event.composedPath().includes(this)) {
        this.close();
      }
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.close();
    });
  }

  open(event) {
    event.preventDefault();

    this.askAiCheckbox.checked = preferences.showAskAi !== false;
    this.downloadCheckbox.checked = preferences.showDownloadOffer !== false;

    // Measure the menu's natural size (still laid out while visibility:
    // hidden) before positioning it, so it can be clamped to the viewport
    // instead of guessing its dimensions ahead of time.
    this.style.left = '0px';
    this.style.top = '0px';
    const { width, height } = this.getBoundingClientRect();

    const left = Math.max(
      8,
      Math.min(event.clientX, window.innerWidth - width - 8),
    );
    const top = Math.max(
      8,
      Math.min(event.clientY, window.innerHeight - height - 8),
    );

    this.style.left = `${left}px`;
    this.style.top = `${top}px`;
    this.setAttribute('open', '');
  }

  close() {
    this.removeAttribute('open');
  }
}

customElements.define('context-menu', ContextMenu);

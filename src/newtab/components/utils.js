const styleSheetCache = new Map();

/**
 * Fetches a CSS file and returns a constructed CSSStyleSheet suitable for
 * adoptedStyleSheets - the runtime equivalent of `import ... with { type:
 * 'css' }`, which requires Firefox 147+. Results are cached by URL so a
 * given stylesheet is only fetched and parsed once. When `strict_min_version`
 * exceeds 147, this can be replaced with a simple `import` statement.
 */
export function loadStyleSheet(url) {
  const key = url.toString();
  let sheet = styleSheetCache.get(key);

  if (!sheet) {
    sheet = fetch(url)
      .then((response) => response.text())
      .then((cssText) => {
        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(cssText);
        return styleSheet;
      });
    styleSheetCache.set(key, sheet);
  }

  return sheet;
}

/**
 * Finds all elements with a [data-i18n] attribute. The content of this
 * attribute is then parsed as JSON, expecting the following schema:
 *  { key: string, where: 'text' | 'html' | string[] }
 *
 * The 'key' value is used to lookup the message, and 'where' is used to
 * determine where it should be placed. If the 'where' value is a list of
 * strings, it will be split on commas and trimmed. Each string in the list
 * will be evaluated as either text, html, or an attribute name.
 */
export function replaceDataI18nAttributes(element) {
  const elements = element.querySelectorAll('[data-i18n]');

  for (const el of elements) {
    let key, where;

    try {
      ({ key, where } = JSON.parse(el.getAttribute('data-i18n')));
    } catch (error) {
      console.warn(
        `Invalid data-i18n attribute: ${el.getAttribute('data-i18n')}`,
      );
      continue;
    }

    const message = chrome.i18n.getMessage(key);

    if (!message) {
      console.warn(`Message not found for key: ${key}`);
      continue;
    }

    // The 'where' value may be a list of placements.
    const placements = where.split(/,\s*/).map((place) => {
      return place.toLowerCase().trim();
    });

    for (const place of placements) {
      switch (place) {
        case 'text':
          el.textContent = message;
          break;
        case 'html':
          el.innerHTML = message;
          break;
        default:
          el.setAttribute(place, message);
          break;
      }
    }
  }
}

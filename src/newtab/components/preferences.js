/**
 * Persisted user preferences for optional New Tab page elements, backed by
 * localStorage rather than chrome.storage - this page already runs at the
 * extension's own stable origin, so no additional permission is needed.
 *
 * Each getter returns `null` when the user hasn't made a choice yet, so
 * callers can fall back to their own default (e.g. an author-set attribute)
 * instead of assuming a value.
 */

const kShowAskAiKey = 'brave-search-show-ask-ai';
const kShowDownloadOfferKey = 'brave-search-show-download-offer';

function getStoredBoolean(key) {
  const stored = localStorage.getItem(key);
  return stored === null ? null : stored === 'true';
}

function setStoredBoolean(key, value) {
  localStorage.setItem(key, value ? 'true' : 'false');
}

export const preferences = {
  get showAskAi() {
    return getStoredBoolean(kShowAskAiKey);
  },

  set showAskAi(value) {
    setStoredBoolean(kShowAskAiKey, value);
  },

  get showDownloadOffer() {
    return getStoredBoolean(kShowDownloadOfferKey);
  },

  set showDownloadOffer(value) {
    setStoredBoolean(kShowDownloadOfferKey, value);
  },
};

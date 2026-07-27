import './components/search/index.js';
import './components/cta/index.js';
import './components/context-menu/index.js';

document.documentElement.lang = chrome.i18n.getUILanguage() || 'en';
document.title = chrome.i18n.getMessage('pageTitle');

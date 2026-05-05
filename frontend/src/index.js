// EMERGENT REMOVER - TEMPORAL
(function() {
  const TEXT_RE = /made\s+with\s+emergent/i;
  const SELECTOR_CANDIDATES = [
    '.emergent-badge',
    '#emergent-badge',
    '[class*="emergent"]',
    '[id*="emergent"]'
  ];

  function removeByNode(node) {
    try {
      if (!node) return false;
      // If element text matches, remove it
      if (node.nodeType === 1) {
        const text = (node.innerText || node.textContent || '').trim();
        if (TEXT_RE.test(text)) {
          if (node.parentNode) node.parentNode.removeChild(node);
          return true;
        }
      }
      return false;
    } catch (e) { return false; }
  }

  function scanAndRemove(root = document) {
    try {
      // 1) quick remove by candidate selectors
      SELECTOR_CANDIDATES.forEach(sel => {
        Array.from(root.querySelectorAll ? root.querySelectorAll(sel) : []).forEach(n => {
          try { if (n && n.parentNode) n.parentNode.removeChild(n); } catch(e){}
        });
      });

      // 2) remove by text match (covers badges without predictable classes)
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
      const toRemove = [];
      while (walker.nextNode()) {
        const el = walker.currentNode;
        const txt = (el.innerText || el.textContent || '').trim();
        if (txt && TEXT_RE.test(txt)) toRemove.push(el);
      }
      toRemove.forEach(el => { try { if (el.parentNode) el.parentNode.removeChild(el); } catch(e){} });

    } catch (e) { /* ignore */ }
  }

  // Run immediately and on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scanAndRemove(document));
  } else {
    scanAndRemove(document);
  }

  // Observe future additions and remove them
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            // direct check
            if (removeByNode(node)) return;
            // check subtree
            try { scanAndRemove(node); } catch(e){}
            // if script tag, neutralize it
            if (node.tagName === 'SCRIPT') {
              try { node.type = 'javascript/blocked'; node.removeAttribute('src'); node.textContent = ''; if (node.parentNode) node.parentNode.removeChild(node); } catch(e){}
            }
          }
        });
      }
    }
  });

  observer.observe(document.documentElement || document, { childList: true, subtree: true });

  // Best-effort interception of dynamic script insertion
  try {
    const origCreate = Document.prototype.createElement;
    Document.prototype.createElement = function(tagName, options) {
      const el = origCreate.call(this, tagName, options);
      if (String(tagName).toLowerCase() === 'script') {
        const origSet = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src')?.set;
        if (origSet) {
          Object.defineProperty(el, 'src', {
            set(value) {
              if (String(value).toLowerCase().includes('emergent') || String(value).toLowerCase().includes('dotenvx') || String(value).toLowerCase().includes('vestauth')) {
                try { this.type = 'javascript/blocked'; this.removeAttribute('src'); } catch(e){}
              } else if (origSet) {
                origSet.call(this, value);
              }
            },
            get() { return null; },
            configurable: true
          });
        }
      }
      return el;
    };
  } catch (e) { /* ignore */ }

  window.__EMERGENT_REMOVER_ACTIVE = true;
})();
// EMERGENT CLEANER - TEMPORAL
(function() {
  const SELECTORS = [
    '.emergent-badge',
    '#emergent-badge',
    '[class*="emergent"]',
    '[id*="emergent"]',
    'script[src*="emergent"]',
    'script[src*="dotenvx"]',
    'script[src*="vestauth"]'
  ];

  function removeMatches(root = document) {
    try {
      SELECTORS.forEach(sel => {
        const nodes = Array.from(root.querySelectorAll ? root.querySelectorAll(sel) : []);
        nodes.forEach(n => {
          try {
            if (n && n.parentNode) n.parentNode.removeChild(n);
          } catch (e) { }
        });
      });
    } catch (e) { }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => removeMatches(document));
  } else {
    removeMatches(document);
  }

  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            removeMatches(node);
            if (node.tagName === 'SCRIPT') {
              try {
                node.type = 'javascript/blocked';
                node.removeAttribute('src');
                node.textContent = '';
                if (node.parentNode) node.parentNode.removeChild(node);
              } catch (e) { }
            }
          }
        });
      }
    }
  });

  observer.observe(document.documentElement || document, {
    childList: true,
    subtree: true
  });

  try {
    const origCreate = Document.prototype.createElement;
    Document.prototype.createElement = function(tagName, options) {
      const el = origCreate.call(this, tagName, options);
      if (String(tagName).toLowerCase() === 'script') {
        const origSet = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src')?.set;
        if (origSet) {
          Object.defineProperty(el, 'src', {
            set(value) {
              if (String(value).includes('emergent') || String(value).includes('dotenvx') || String(value).includes('vestauth')) {
                try { this.type = 'javascript/blocked'; this.removeAttribute('src'); } catch(e){}
              } else if (origSet) {
                origSet.call(this, value);
              }
            },
            get() { return null; },
            configurable: true
          });
        }
      }
      return el;
    };
  } catch (e) { }

  window.__EMERGENT_CLEANER_ACTIVE = true;
})();
import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);




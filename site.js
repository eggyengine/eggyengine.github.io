// Theme switch: follows the system until flipped, then remembers the choice.
const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const systemDark = matchMedia('(prefers-color-scheme: dark)');

function isDark() {
  return root.dataset.theme ? root.dataset.theme === 'dark' : systemDark.matches;
}
function syncToggle() {
  themeToggle.setAttribute('aria-checked', String(isDark()));
}
themeToggle.addEventListener('click', () => {
  root.dataset.theme = isDark() ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch {}
  syncToggle();
});
systemDark.addEventListener('change', syncToggle);
syncToggle();

// Code tabs, with arrow-key movement between them.
for (const list of document.querySelectorAll('[role="tablist"]')) {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const select = (tab) => {
    for (const other of tabs) {
      const selected = other === tab;
      other.setAttribute('aria-selected', String(selected));
      other.tabIndex = selected ? 0 : -1;
      document.getElementById(other.getAttribute('aria-controls')).hidden = !selected;
    }
  };
  list.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(tab);
  });
  list.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    const next = tabs[(tabs.indexOf(document.activeElement) + step + tabs.length) % tabs.length];
    select(next);
    next.focus();
  });
}

// A small Zig highlighter: comments, strings, keywords and builtins.
const zigKeywords = new Set(['const', 'var', 'pub', 'fn', 'struct', 'enum', 'return', 'try', 'if', 'else', 'while', 'for', 'switch', 'defer', 'catch', 'orelse', 'unreachable', 'test']);
const zigToken = /(\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*")|(@\w+)|([A-Za-z_]\w*)/g;

function escapeHtml(text) {
  return text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
}

for (const block of document.querySelectorAll('pre[data-lang="zig"]')) {
  const source = block.textContent;
  let html = '';
  let last = 0;
  for (const match of source.matchAll(zigToken)) {
    const [text, comment, string, builtin, word] = match;
    const kind = comment ? 'c' : string ? 's' : builtin ? 'k' : zigKeywords.has(word) ? 'k' : null;
    html += escapeHtml(source.slice(last, match.index));
    html += kind ? `<span class="tok-${kind}">${escapeHtml(text)}</span>` : escapeHtml(text);
    last = match.index + text.length;
  }
  block.innerHTML = html + escapeHtml(source.slice(last));
}

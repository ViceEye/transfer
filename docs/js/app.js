(function () {
  'use strict';

  const contentEl = document.getElementById('content');
  const navEl = document.getElementById('nav');
  let navData = [];

  // Load navigation
  async function loadNav() {
    try {
      const res = await fetch('nav.json');
      navData = await res.json();
      renderNav(navData);
    } catch (e) {
      console.error('Failed to load nav.json:', e);
    }
  }

  // Render sidebar navigation
  function renderNav(items) {
    const ul = document.createElement('ul');
    items.forEach(item => {
      if (item.children) {
        // Group with children
        const li = document.createElement('li');
        const label = document.createElement('span');
        label.className = 'group-label';
        label.textContent = item.title;
        li.appendChild(label);

        const childUl = document.createElement('ul');
        childUl.className = 'children';
        item.children.forEach(child => {
          const childLi = document.createElement('li');
          const a = document.createElement('a');
          a.href = '#/' + child.path;
          a.textContent = child.title;
          a.dataset.path = child.path;
          childLi.appendChild(a);
          childUl.appendChild(childLi);
        });
        li.appendChild(childUl);
        ul.appendChild(li);
      } else {
        // Single item
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#/' + item.path;
        a.textContent = item.title;
        a.dataset.path = item.path;
        li.appendChild(a);
        ul.appendChild(li);
      }
    });
    navEl.innerHTML = '';
    navEl.appendChild(ul);
  }

  // Highlight active sidebar link
  function highlightActive(path) {
    const links = navEl.querySelectorAll('a');
    links.forEach(a => {
      if (a.dataset.path === path) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });
  }

  // Strip frontmatter (--- blocks) if present
  function stripFrontmatter(md) {
    if (md.startsWith('---')) {
      const end = md.indexOf('---', 3);
      if (end !== -1) {
        return md.slice(end + 3).trim();
      }
    }
    return md;
  }

  // Get current path from hash
  function getPath() {
    const hash = window.location.hash;
    if (!hash || hash === '#' || hash === '#/') {
      return 'index';
    }
    // Remove #/ prefix
    return hash.replace(/^#\/?/, '');
  }

  // Load and render markdown
  async function loadPage() {
    const path = getPath();
    highlightActive(path);

    const url = 'pages/' + path + '.md';
    try {
      const res = await fetch(url);
      if (!res.ok) {
        show404(path);
        return;
      }
      let md = await res.text();
      md = stripFrontmatter(md);
      const html = marked.parse(md);
      contentEl.innerHTML = html;
      interceptLinks();
      window.scrollTo(0, 0);
    } catch (e) {
      show404(path);
    }
  }

  // Show 404 page
  function show404(path) {
    contentEl.innerHTML =
      '<div class="not-found">' +
      '<h1>404</h1>' +
      '<p>页面未找到: ' + path + '.md</p>' +
      '</div>';
  }

  // Intercept relative .md links and convert to hash routes
  function interceptLinks() {
    const links = contentEl.querySelectorAll('a[href]');
    links.forEach(a => {
      const href = a.getAttribute('href');
      // Convert relative .md links to hash routes
      if (href && !href.startsWith('http') && !href.startsWith('#') && href.endsWith('.md')) {
        const route = href.replace(/\.md$/, '').replace(/^\.\//, '').replace(/^\//, '');
        a.setAttribute('href', '#/' + route);
      }
    });
  }

  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
    // Close sidebar when clicking a link on mobile
    navEl.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && window.innerWidth <= 768) {
        sidebar.classList.remove('open');
      }
    });
  }

  // Router
  window.addEventListener('hashchange', loadPage);

  // Init
  loadNav().then(() => {
    loadPage();
  });
})();

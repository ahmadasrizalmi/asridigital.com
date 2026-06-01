// Admin Shared Utilities
// Auto-loaded by all admin pages

(function() {
  const API_BASE = '/api';

  // Toast notification system
  function showToast(message, type = 'success') {
    const existing = document.getElementById('admin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'admin-toast';
    const bgColor = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-amber-600';
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠';
    toast.className = `fixed top-4 right-4 z-[9999] ${bgColor} text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 text-sm font-medium transform transition-all duration-300 translate-x-[120%]`;
    toast.innerHTML = `<span class="text-lg">${icon}</span><span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-[120%]');
      toast.classList.add('translate-x-0');
    });

    setTimeout(() => {
      toast.classList.remove('translate-x-0');
      toast.classList.add('translate-x-[120%]');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Check auth and redirect if expired
  function checkAuth() {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      window.location.href = '/admin/login';
      return false;
    }
    // Check JWT expiry client-side
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        showToast('Sesi habis, silakan login kembali', 'error');
        setTimeout(() => window.location.href = '/admin/login', 1500);
        return false;
      }
    } catch (e) {
      // Token format invalid, redirect to login
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
      return false;
    }
    return true;
  }

  // Wrapper for admin API calls with auth handling
  async function adminFetch(url, options = {}) {
    const token = localStorage.getItem('admin_token');
    const headers = {
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    if (options.body && typeof options.body === 'string') {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      showToast('Sesi habis, silakan login kembali', 'error');
      setTimeout(() => window.location.href = '/admin/login', 1500);
      throw new Error('Auth expired');
    }

    return response;
  }

  // Format number as Indonesian Rupiah
  function formatIDR(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Expose globally
  window.adminUtils = { showToast, checkAuth, adminFetch, formatIDR, API_BASE };
  window.showToast = showToast;
  window.checkAuth = checkAuth;
  window.adminFetch = adminFetch;
  window.formatIDR = formatIDR;

  // Auto-check auth on page load
  checkAuth();
})();

// Action menu (kebab dropdown) for mobile admin tables
(function() {
  var style = document.createElement('style');
  style.textContent = [
    '.action-menu { position: relative; display: inline-block; }',
    '.action-menu-btn { cursor: pointer; display: flex; align-items: center; justify-content: center; }',
    '.action-dropdown {',
    '  display: none;',
    '  position: absolute;',
    '  right: 0;',
    '  top: 100%;',
    '  min-width: 130px;',
    '  background: #fff;',
    '  border: 1px solid #e5e7eb;',
    '  border-radius: 8px;',
    '  box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08);',
    '  z-index: 1000;',
    '  overflow: hidden;',
    '  margin-top: 4px;',
    '}',
    '.action-dropdown.show { display: block; }',
    '.action-dropdown-item {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 8px;',
    '  width: 100%;',
    '  padding: 10px 14px;',
    '  text-align: left;',
    '  font-size: 13px;',
    '  font-weight: 500;',
    '  color: #374151;',
    '  cursor: pointer;',
    '  border: none;',
    '  background: none;',
    '  white-space: nowrap;',
    '  transition: background 0.15s;',
    '  text-decoration: none;',
    '}',
    '.action-dropdown-item:hover { background: #f3f4f6; }',
    '.action-dropdown-item.text-red-600 { color: #dc2626; }',
    '.action-dropdown-item.text-red-600:hover { background: #fef2f2; }'
  ].join('\n');
  document.head.appendChild(style);

  window.toggleActionMenu = function(event) {
    event.stopPropagation();
    var btn = event.currentTarget;
    var menu = btn.closest('.action-menu');
    if (!menu) return;
    var dropdown = menu.querySelector('.action-dropdown');
    if (!dropdown) return;
    // Close all other open dropdowns
    document.querySelectorAll('.action-dropdown.show').forEach(function(d) {
      if (d !== dropdown) d.classList.remove('show');
    });
    dropdown.classList.toggle('show');
  };

  // Close when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.action-menu')) {
      document.querySelectorAll('.action-dropdown.show').forEach(function(d) {
        d.classList.remove('show');
      });
    }
  });

  // Close when clicking a dropdown item
  document.addEventListener('click', function(e) {
    if (e.target.closest('.action-dropdown-item')) {
      document.querySelectorAll('.action-dropdown.show').forEach(function(d) {
        d.classList.remove('show');
      });
    }
  });
})();

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

  // Expose globally
  window.adminUtils = { showToast, checkAuth, adminFetch, API_BASE };
  window.showToast = showToast;
  window.checkAuth = checkAuth;
  window.adminFetch = adminFetch;

  // Auto-check auth on page load
  checkAuth();
})();

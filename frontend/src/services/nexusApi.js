/**
 * Nexus API Service
 * Connects frontend UI components to the Nexus FastAPI backend.
 */

// Base API endpoint - uses proxy path /api by default, or an explicit env override
const API_BASE = import.meta.env.VITE_API_URL || '/api';
const DIRECT_BACKEND = import.meta.env.VITE_DIRECT_BACKEND_URL || 'http://127.0.0.1:8000/api';

/**
 * Robust fetch helper that tries relative proxy first, then direct backend fallback if needed.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.detail || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }
    return response;
  } catch (err) {
    // If running in development and proxy might not have caught it, attempt direct backend call
    if (API_BASE.startsWith('/') && !options._retried) {
      try {
        const directUrl = `${DIRECT_BACKEND}${endpoint}`;
        const fallbackRes = await fetch(directUrl, { ...options, _retried: true });
        if (!fallbackRes.ok) {
          const errorData = await fallbackRes.json().catch(() => ({}));
          throw new Error(errorData.detail || `Fallback failed with status ${fallbackRes.status}`);
        }
        return fallbackRes;
      } catch {
        // rethrow original
        throw err;
      }
    }
    throw err;
  }
}

// In-memory cache for languages
let cachedLanguages = null;

export const nexusApi = {
  /**
   * Check backend health and system state
   */
  async checkHealth() {
    const res = await request('/health');
    return res.json();
  },

  /**
   * Get offline model cache status and hardware acceleration info
   */
  async getModelsStatus() {
    const res = await request('/models/status');
    return res.json();
  },

  /**
   * Fetch all 41+ supported languages from backend registry
   */
  async getLanguages() {
    if (cachedLanguages && cachedLanguages.length > 0) {
      return cachedLanguages;
    }
    const res = await request('/languages');
    const data = await res.json();
    const list = Array.isArray(data) ? data : (Array.isArray(data?.languages) ? data.languages : []);
    if (list.length > 0) {
      cachedLanguages = list;
    }
    return list;
  },

  /**
   * Submit a document file for neural translation & layout preservation
   * Supports: .pdf, .docx, .doc, .txt, .rtf, .odt
   * Strictly disallows: image formats (.png, .jpg, etc.)
   * @param {File} file - Document file object
   * @param {string} srcLang - Source language code (e.g. 'en')
   * @param {string} tgtLang - Target language code (e.g. 'gu', 'hi')
   * @param {number|null} maxPages - Optional max pages limit
   */
  async submitTranslation(file, srcLang = 'en', tgtLang = 'gu', maxPages = null) {
    const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|tiff|svg)$/i.test(file.name);
    if (isImage) {
      throw new Error('Image files (PNG, JPG, etc.) are not supported. Only documents (.pdf, .docx, .txt, .doc, .rtf, .odt) are supported.');
    }

    const isDoc = /\.(pdf|docx|doc|txt|rtf|odt)$/i.test(file.name);
    if (!isDoc) {
      throw new Error('Unsupported document format. Only documents (.pdf, .docx, .txt, .doc, .rtf, .odt) are supported.');
    }

    const currentUserRaw = localStorage.getItem('nexus_ocr_user');
    let currentUser = null;
    try {
      if (currentUserRaw) currentUser = JSON.parse(currentUserRaw);
    } catch {}
    const isGuest = !currentUser;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('src_lang', srcLang);
    formData.append('tgt_lang', tgtLang);
    if (maxPages && Number(maxPages) > 0) {
      formData.append('max_pages', String(maxPages));
    }
    if (isGuest) {
      formData.append('is_guest', 'true');
    } else {
      if (currentUser?.email) formData.append('user_email', currentUser.email);
      if (currentUser?.name) formData.append('user_name', currentUser.name);
    }

    const headers = {};
    if (isGuest) {
      headers['X-Guest-Mode'] = 'true';
    }

    const res = await request('/translate', {
      method: 'POST',
      body: formData,
      headers,
    });
    return res.json();
  },

  /**
   * Poll current status of a translation job
   * @param {string} jobId - e.g. 'job_a1b2c3d4'
   */
  async getJobStatus(jobId) {
    const res = await request(`/jobs/${jobId}`);
    return res.json();
  },

  /**
   * Get rendered preview image URL for a specific translated page
   */
  getRenderedPageUrl(jobId, pageNum = 1, timestamp = null) {
    const qs = timestamp ? `?t=${timestamp}` : '';
    return `${API_BASE}/jobs/${jobId}/pages/${pageNum}/rendered${qs}`;
  },

  /**
   * Direct backend fallback URL (bypasses Vite proxy if needed)
   */
  getRenderedPageUrlDirect(jobId, pageNum = 1, timestamp = null) {
    const qs = timestamp ? `?t=${timestamp}` : '';
    return `${DIRECT_BACKEND}/jobs/${jobId}/pages/${pageNum}/rendered${qs}`;
  },

  /**
   * Get original page preview image URL
   */
  getOriginalPageUrl(jobId, pageNum = 1, timestamp = null) {
    const qs = timestamp ? `?t=${timestamp}` : '';
    return `${API_BASE}/jobs/${jobId}/pages/${pageNum}/original${qs}`;
  },

  /**
   * Direct backend fallback URL for original page preview
   */
  getOriginalPageUrlDirect(jobId, pageNum = 1, timestamp = null) {
    const qs = timestamp ? `?t=${timestamp}` : '';
    return `${DIRECT_BACKEND}/jobs/${jobId}/pages/${pageNum}/original${qs}`;
  },

  /**
   * Fetch extracted blocks, translated text and metadata for a specific page
   */
  async getPageData(jobId, pageNum = 1) {
    const res = await request(`/jobs/${jobId}/pages/${pageNum}/data`);
    return res.json();
  },

  /**
   * Fetch list of all completed/available pages for a job
   */
  async getJobPages(jobId) {
    const res = await request(`/jobs/${jobId}/pages`);
    return res.json();
  },

  /**
   * Get URL to download the translated PDF
   */
  getDownloadUrl(jobId) {
    return `${API_BASE}/jobs/${jobId}/download`;
  },

  /**
   * Download the translated PDF blob directly to user's device
   */
  async downloadTranslatedPdf(jobId, customFilename) {
    const res = await request(`/jobs/${jobId}/download`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = customFilename || `translated_${jobId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Local history management in localStorage (RESTRICTED TO AUTHENTICATED USERS)
   */
  getLocalJobs() {
    try {
      const currentUser = localStorage.getItem('nexus_ocr_user');
      // Guest sessions DO NOT have history
      if (!currentUser) {
        try {
          localStorage.removeItem('nexus_translation_jobs');
        } catch {}
        return [];
      }
      const userObj = JSON.parse(currentUser);
      const userKey = userObj.email ? `nexus_jobs_${userObj.email}` : 'nexus_translation_jobs';
      const stored = localStorage.getItem(userKey) || localStorage.getItem('nexus_translation_jobs');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      // Strictly exclude any guest jobs from user history
      return (parsed || []).filter(j => !j.is_guest && !(j.job_id && j.job_id.startsWith('guest_')));
    } catch {
      return [];
    }
  },

  saveJobToHistory(job) {
    try {
      const currentUser = localStorage.getItem('nexus_ocr_user');
      // Translation history is NEVER saved for guest sessions
      if (!currentUser || job.is_guest || (job.job_id && job.job_id.startsWith('guest_'))) {
        return;
      }

      const userObj = JSON.parse(currentUser);
      const userKey = userObj.email ? `nexus_jobs_${userObj.email}` : 'nexus_translation_jobs';
      const jobs = this.getLocalJobs();
      const existingIdx = jobs.findIndex(j => j.job_id === job.job_id);
      if (existingIdx >= 0) {
        jobs[existingIdx] = { ...jobs[existingIdx], ...job, updated_at: Date.now() };
      } else {
        jobs.unshift({ ...job, created_at: job.created_at || Date.now() });
      }
      localStorage.setItem(userKey, JSON.stringify(jobs.slice(0, 50)));
    } catch (e) {
      console.warn('Failed to save job to localStorage', e);
    }
  },

  removeLocalJob(jobId) {
    try {
      const currentUser = localStorage.getItem('nexus_ocr_user');
      if (!currentUser) return;
      const userObj = JSON.parse(currentUser);
      const userKey = userObj.email ? `nexus_jobs_${userObj.email}` : 'nexus_translation_jobs';
      const jobs = this.getLocalJobs().filter(j => j.job_id !== jobId);
      localStorage.setItem(userKey, JSON.stringify(jobs));
    } catch (e) {
      console.warn('Failed to remove job from localStorage', e);
    }
  },

  _getAdminHeaders() {
    try {
      const user = JSON.parse(localStorage.getItem('nexus_ocr_user') || '{}');
      if (user?.isAdmin) {
        return {
          'X-Admin-Role': 'admin',
          'X-Admin-Email': user.email || 'admin.root@nexusocr.ai'
        };
      }
    } catch {}
    return {};
  },

  /**
   * Admin Global Translation Audit APIs (Access to all translations, including guest)
   */
  async adminGetAllJobs() {
    const res = await request('/admin/jobs', { headers: this._getAdminHeaders() });
    return res.json();
  },

  async adminDeleteJob(jobId) {
    const res = await request(`/admin/jobs/${jobId}`, { method: 'DELETE', headers: this._getAdminHeaders() });
    return res.json();
  },

  async adminPurgeGuestJobs() {
    const res = await request('/admin/jobs/purge-guests', { method: 'POST', headers: this._getAdminHeaders() });
    return res.json();
  }
};

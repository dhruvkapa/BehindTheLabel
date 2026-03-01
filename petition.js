// ✅ Google Apps Script Web App URL
const API_URL = "https://script.google.com/macros/s/AKfycbxMXsgOkaAjcoYWYqODzAzvbP6SM0zv6Wv863DwpnX98hXtXciF1HRqVYTqs6tcaIZthA/exec";

const form  = document.getElementById("petitionForm");
const msgEl = document.getElementById("petitionMsg");

// How long to wait before giving up on a network request.
// 8s for submissions (user is waiting), 6s for loading the list.
const SUBMIT_TIMEOUT_MS = 8000;
const FETCH_TIMEOUT_MS  = 6000;

/* --------------------------------------------------
   fetchWithTimeout — wraps fetch() with an AbortController
   so slow connections don't hang forever.
   Throws a TimeoutError if the deadline is exceeded.
-------------------------------------------------- */
async function fetchWithTimeout(url, options = {}, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      const e = new Error('Request timed out — connection too slow');
      e.name = 'TimeoutError';
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/* --------------------------------------------------
   SERVICE WORKER — asset caching only
   (fast loads on slow wifi after first visit)
-------------------------------------------------- */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .catch(err => console.warn('[BTL] SW registration failed:', err));
}

/* --------------------------------------------------
   OFFLINE QUEUE — stored in localStorage
   Used for both fully-offline and slow-wifi timeouts.
-------------------------------------------------- */
const QUEUE_KEY = 'btl-signature-queue';

function queueGet() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
  catch { return []; }
}

function queueAdd(payload) {
  const q = queueGet();
  q.push({ payload, ts: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

function queueClear() {
  localStorage.removeItem(QUEUE_KEY);
}

/* --------------------------------------------------
   flushQueue — send any queued signatures to the API.
   Called on page load and when we come back online.
-------------------------------------------------- */
async function flushQueue() {
  const q = queueGet();
  if (!q.length) return;

  const failed = [];
  for (const item of q) {
    try {
      const res  = await fetchWithTimeout(API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body:    item.payload,
      }, SUBMIT_TIMEOUT_MS);
      const data = await res.json();
      if (!data.ok) failed.push(item);
    } catch {
      failed.push(item); // Still offline or too slow — keep in queue
      break;
    }
  }

  if (failed.length === 0) {
    queueClear();
    showOfflineBanner(false);
    await fetchSignatures();
  } else {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
  }
}

/* --------------------------------------------------
   Offline / slow-wifi banner
-------------------------------------------------- */
function showOfflineBanner(offline) {
  let banner = document.getElementById('btl-offline-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'btl-offline-banner';
    Object.assign(banner.style, {
      position:      'fixed',
      top:           0,
      left:          0,
      right:         0,
      zIndex:        10000,
      padding:       '0.6rem 1.5rem',
      fontFamily:    "'DM Mono', monospace",
      fontSize:      '0.7rem',
      letterSpacing: '0.1em',
      textAlign:     'center',
      transition:    'transform 0.3s ease',
      transform:     'translateY(-100%)',
      color:         '#f0ebe0',
    });
    document.body.prepend(banner);
  }

  if (offline) {
    banner.style.background = '#7b1e14';
    banner.textContent = "⚡ Slow or no connection — your signature is saved and will sync automatically when reconnected.";
    banner.style.transform = 'translateY(0)';
  } else {
    banner.style.background = '#1a4a2a';
    banner.textContent = '✓ Back online — signatures synced!';
    banner.style.transform = 'translateY(0)';
    setTimeout(() => { banner.style.transform = 'translateY(-100%)'; }, 3000);
  }
}

if (!navigator.onLine || queueGet().length > 0) showOfflineBanner(true);

window.addEventListener('online',  () => flushQueue());
window.addEventListener('offline', () => showOfflineBanner(true));

/* --------------------------------------------------
   Escape HTML to prevent XSS
-------------------------------------------------- */
function escapeText(s) {
  return (s || "").replace(/[<>&"]/g, c =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c])
  );
}

/* --------------------------------------------------
   render(signatures)
-------------------------------------------------- */
function render(signatures) {
  const total = signatures.length;
  window.updateCount(total);

  const list = document.getElementById("signatureList");
  list.innerHTML = "";
  signatures.slice(0, 30).forEach((s, i) => {
    list.appendChild(window.renderSignature(s, i, total));
  });

  window.renderBgNames(signatures);
  window.updateTicker(signatures);
}

/* --------------------------------------------------
   fetchSignatures — loads data from Google Sheets.
   Times out gracefully on slow connections.
-------------------------------------------------- */
async function fetchSignatures() {
  try {
    const res  = await fetchWithTimeout(API_URL, {}, FETCH_TIMEOUT_MS);
    const data = await res.json();
    if (!data.ok) throw new Error("Failed to fetch signatures");
    render(data.signatures);
  } catch (err) {
    if (msgEl) {
      const msg = err.name === 'TimeoutError'
        ? "Connection too slow to load signatures — they'll appear once wifi improves."
        : "Could not load signatures — you may be offline.";
      msgEl.textContent = msg;
      msgEl.classList.add("show");
    }
  }
}

/* --------------------------------------------------
   submitSignature — tries the API with a timeout,
   queues locally if offline OR too slow.
-------------------------------------------------- */
async function submitSignature(name, city) {
  const payloadStr = JSON.stringify({ name, city, userAgent: navigator.userAgent });

  if (!navigator.onLine) {
    queueAdd(payloadStr);
    return { queued: true };
  }

  try {
    const res  = await fetchWithTimeout(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body:    payloadStr,
    }, SUBMIT_TIMEOUT_MS);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Failed to submit");
    return data;
  } catch {
    // Offline, timed out, or network dropped — queue it
    queueAdd(payloadStr);
    return { queued: true };
  }
}

/* --------------------------------------------------
   Form submit handler
-------------------------------------------------- */
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name    = document.getElementById("sigName").value.trim();
    const city    = document.getElementById("sigCity").value.trim();
    const consent = document.getElementById("sigConsent").checked;

    if (!consent) {
      msgEl.textContent = "Please check the consent box.";
      msgEl.classList.add("show");
      return;
    }

    window.setSubmitLoading(true);
    msgEl.classList.remove("show");

    try {
      const result = await submitSignature(name, city);
      form.reset();

      if (result.queued) {
        showOfflineBanner(true);
        msgEl.textContent = "Saved! Your signature will be submitted automatically when your connection improves.";
        msgEl.classList.add("show");
      } else {
        await fetchSignatures();
        window.showSuccessOverlay();
      }
    } catch (err) {
      msgEl.textContent = `Error: ${err.message}`;
      msgEl.classList.add("show");
    } finally {
      window.setSubmitLoading(false);
    }
  });
}

/* --------------------------------------------------
   Boot — flush any leftover queue, then load sigs.
-------------------------------------------------- */
(async () => {
  if (navigator.onLine && queueGet().length > 0) {
    await flushQueue();
  }
  fetchSignatures();
})();

// ✅ Google Apps Script Web App URL
const API_URL = "https://script.google.com/macros/s/AKfycbxMXsgOkaAjcoYWYqODzAzvbP6SM0zv6Wv863DwpnX98hXtXciF1HRqVYTqs6tcaIZthA/exec";

const form    = document.getElementById("petitionForm");
const msgEl   = document.getElementById("petitionMsg");

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
   Called after every fetch or submit.
   Hands off to the global UI helpers defined in petition.html.
-------------------------------------------------- */
function render(signatures) {
  const total = signatures.length;

  // 1. Progress bar + count
  window.updateCount(total);

  // 2. Signature list (most recent first, capped at 30)
  const list = document.getElementById("signatureList");
  list.innerHTML = "";
  signatures.slice(0, 30).forEach((s, i) => {
    // Normalise: petition.js receives { name, city, date } from the API
    list.appendChild(window.renderSignature(s, i, total));
  });

  // 3. Ghost name watermark in the background of the list panel
  window.renderBgNames(signatures);

  // 4. Live ticker strip
  window.updateTicker(signatures);
}

/* --------------------------------------------------
   fetchSignatures — loads data from Google Sheets
-------------------------------------------------- */
async function fetchSignatures() {
  try {
    const res  = await fetch(API_URL);
    const data = await res.json();
    if (!data.ok) throw new Error("Failed to fetch signatures");
    render(data.signatures);
  } catch (err) {
    if (msgEl) {
      msgEl.textContent = "Could not load signatures yet. Check your API URL.";
      msgEl.classList.add("show");
    }
  }
}

/* --------------------------------------------------
   submitSignature — POSTs to Google Apps Script
-------------------------------------------------- */
async function submitSignature(name, city) {
  const payload = { name, city, userAgent: navigator.userAgent };
  const res = await fetch(API_URL, {
    method:  "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body:    JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to submit");
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

    // Loading state
    window.setSubmitLoading(true);
    msgEl.classList.remove("show");

    try {
      await submitSignature(name, city);

      // Reset form
      form.reset();

      // Refresh the full list from the API (source of truth)
      await fetchSignatures();

      // Show the animated success overlay
      window.showSuccessOverlay();

    } catch (err) {
      msgEl.textContent = `Error: ${err.message}`;
      msgEl.classList.add("show");
    } finally {
      window.setSubmitLoading(false);
    }
  });
}

/* --------------------------------------------------
   Boot — load signatures on page load
-------------------------------------------------- */
fetchSignatures();
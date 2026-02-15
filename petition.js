// ✅ Paste your Apps Script Web App URL here:
const API_URL = "https://script.google.com/macros/s/AKfycbxMXsgOkaAjcoYWYqODzAzvbP6SM0zv6Wv863DwpnX98hXtXciF1HRqVYTqs6tcaIZthA/exec";
const form = document.getElementById("petitionForm");
const msg = document.getElementById("petitionMsg");
const sigCount = document.getElementById("sigCount");
const sigList = document.getElementById("signatureList");
const sigBg = document.getElementById("signatureBackground");

function escapeText(s) {
  return (s || "").replace(/[<>&"]/g, c => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", "\"":"&quot;" }[c]));
}

function addNameToBackground(name) {
  const tag = document.createElement("div");
  tag.className = "sig-tag";
  tag.textContent = name;

  tag.style.left = `${Math.random() * 92}%`;
  tag.style.top = `${Math.random() * 92}%`;

  const rot = (Math.random() * 14) - 7;
  const scale = 0.9 + Math.random() * 0.35;
  tag.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`;
  tag.style.opacity = String(0.10 + Math.random() * 0.12);

  sigBg.appendChild(tag);
}

function render(signatures) {
  // Count
  sigCount.textContent = String(signatures.length);

  // Recent list (top 10)
  sigList.innerHTML = "";
  signatures.slice(0, 10).forEach(s => {
    const li = document.createElement("li");
    li.textContent = s.city ? `${s.name} — ${s.city}` : s.name;
    sigList.appendChild(li);
  });

  // ===== TICKER =====
  const ticker = document.getElementById("tickerTrack");
  if (ticker) {
    ticker.innerHTML = "";

    const recent = signatures.slice(0, 10);

    if (recent.length === 0) {
      ticker.innerHTML = "<span>Be the first to sign the petition.</span>";
    } else {
      recent.forEach(s => {
        const span = document.createElement("span");
        span.textContent = s.city ? `${s.name} — ${s.city}` : s.name;
        ticker.appendChild(span);
      });

      // Duplicate content so scroll is seamless
      recent.forEach(s => {
        const span = document.createElement("span");
        span.textContent = s.city ? `${s.name} — ${s.city}` : s.name;
        ticker.appendChild(span);
      });
    }
  }

  // Background names
  sigBg.innerHTML = "";
  signatures.slice(0, 200).forEach(s => addNameToBackground(s.name));
}


async function fetchSignatures() {
  const res = await fetch(API_URL);
  const data = await res.json();
  if (!data.ok) throw new Error("Failed to fetch signatures");
  render(data.signatures);
}

async function submitSignature(name, city) {
  const payload = { name, city, userAgent: navigator.userAgent };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to submit");
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";

    const name = document.getElementById("sigName").value.trim();
    const city = document.getElementById("sigCity").value.trim();
    const consent = document.getElementById("sigConsent").checked;

    if (!consent) {
      msg.textContent = "Please check the consent box.";
      return;
    }

    try {
      await submitSignature(name, city);
      msg.textContent = "Thank you — your signature was added!";
      form.reset();
      await fetchSignatures(); // refresh UI + background
    } catch (err) {
      msg.textContent = `Error: ${err.message}`;
    }
  });
}

// Load existing signatures on page load
fetchSignatures().catch(err => {
  if (msg) msg.textContent = "Could not load signatures yet. Check your API URL.";
});

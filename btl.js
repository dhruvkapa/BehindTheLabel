// btl.js — cleaned

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded fired - btl.js loaded");

  /* =========================
     Learn More Button (scroll to About)
  ========================= */
  const learnMoreBtn = document.getElementById("learnMoreBtn");
  const aboutSection = document.getElementById("about");

  if (learnMoreBtn && aboutSection) {
    learnMoreBtn.addEventListener("click", () => {
      aboutSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* =========================
     Partner logo reveal (if you still use .partner-logo anywhere)
  ========================= */
  const partnerLogo = document.querySelector(".partner-logo");
  if (partnerLogo) {
    const logoObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          partnerLogo.classList.add("visible");
          logoObserver.unobserve(partnerLogo);
        }
      },
      { threshold: 0.4 }
    );
    logoObserver.observe(partnerLogo);
  }

  /* =========================
     Counter — animate ONLY when counter section enters view
  ========================= */
  const counterEl = document.getElementById("childCounter");
  if (counterEl) {
    const targetNumber = 160000000; // 160M
    const duration = 4000; // ms
    let hasAnimated = false;

    const startCounter = () => {
      if (hasAnimated) return;
      hasAnimated = true;

      let start = 0;
      const startTime = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const value = Math.floor(progress * targetNumber);
        counterEl.textContent = value.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          counterEl.textContent = targetNumber.toLocaleString();
        }
      };

      requestAnimationFrame(tick);
    };

    // Observe the whole counter section if possible (more reliable than observing the number)
    const counterSection = counterEl.closest(".counter-section") || counterEl;

    const counterObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startCounter();
          counterObserver.unobserve(counterSection);
        }
      },
      { threshold: 0.25 }
    );

    counterObserver.observe(counterSection);
  }

  /* =========================
     Leaflet Map
  ========================= */
  const mapEl = document.getElementById("map");
  if (mapEl) {
    // If Leaflet isn't loaded yet, wait a moment and retry once.
    const initMap = () => {
      if (typeof L === "undefined") {
        console.warn("Leaflet not available yet.");
        return false;
      }

      try {
        const map = L.map("map", { zoomControl: false }).setView([20, 0], 2);

        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
          { attribution: "© Esri, USGS" }
        ).addTo(map);

        const regions = [
          { name: "South Asia", coords: [22, 78], description: "High prevalence in agriculture and manufacturing." },
          { name: "Sub-Saharan Africa", coords: [1, 20], description: "Highest proportion of children in child labour globally." },
          { name: "East Asia & Pacific", coords: [15, 105], description: "Risks linked to manufacturing and supply chains." },
          { name: "Latin America", coords: [-10, -55], description: "Child labour persists in informal economies." },
          { name: "Middle East & North Africa", coords: [25, 45], description: "Migrant labour vulnerability and forced labour risks." }
        ];

        regions.forEach((r) => {
          L.circleMarker(r.coords, {
            radius: 10,
            color: "#000000",
            fillColor: "#FF1044",
            fillOpacity: 1,
            weight: 2
          })
            .addTo(map)
            .bindPopup(`<strong>${r.name}</strong><br><em>Elevated risk</em><br>${r.description}`);
        });

        // Fix sizing if map loads while offscreen
        setTimeout(() => map.invalidateSize(), 200);

        return true;
      } catch (e) {
        console.error("Map init error:", e);
        return true; // stop retrying
      }
    };

    const ok = initMap();
    if (!ok) {
      setTimeout(() => initMap(), 600);
    }
  }

  /* =========================
     Camera Scanner (TensorFlow + Tesseract)
  ========================= */
  const cameraBtn = document.getElementById("cameraBtn");
  const cameraModal = document.getElementById("cameraModal");
  const closeModal = document.getElementById("closeModal");
  const cameraFeed = document.getElementById("cameraFeed");
  const captureBtn = document.getElementById("captureBtn");
  const canvas = document.getElementById("canvas");
  const resultsContainer = document.getElementById("resultsContainer");
  const analysisResults = document.getElementById("analysisResults");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const scanAgainBtn = document.getElementById("scanAgainBtn");

  let currentStream = null;
  let model = null;

  const stopCamera = () => {
    if (currentStream) {
      currentStream.getTracks().forEach((t) => t.stop());
      currentStream = null;
    }
  };

  const startCamera = async () => {
    try {
      currentStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      cameraFeed.srcObject = currentStream;
    } catch (err) {
      console.error("Camera error:", err);
      alert("Unable to access camera. Check browser permissions.");
      if (cameraModal) cameraModal.classList.remove("active");
    }
  };

  if (cameraBtn && cameraModal) {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn("Camera not supported");
      cameraBtn.style.display = "none";
    } else {
      cameraBtn.addEventListener("click", () => {
        cameraModal.classList.add("active");
        startCamera();
      });
    }
  }

  if (closeModal && cameraModal) {
    closeModal.addEventListener("click", () => {
      cameraModal.classList.remove("active");
      stopCamera();
    });

    cameraModal.addEventListener("click", (e) => {
      if (e.target === cameraModal) {
        cameraModal.classList.remove("active");
        stopCamera();
      }
    });
  }

  // Minimal brand list (keep your long one if you want)
  const KNOWN_BRANDS = [
    "Nike","Adidas","Puma","H&M","Zara","Forever 21","Shein","Uniqlo","Gap",
    "Patagonia","The North Face","Levi's","Allbirds"
  ];

  function levenshteinDistance(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  }

  function filterBrands(extractedText) {
    const text = extractedText.toUpperCase();
    const words = text.split(/\s+/).filter((w) => w.length > 2);
    const detected = [];

    KNOWN_BRANDS.forEach((brand) => {
      const B = brand.toUpperCase();
      if (text.includes(B)) {
        detected.push({ name: brand, confidence: "high" });
        return;
      }
      for (const w of words) {
        const dist = levenshteinDistance(w, B);
        const maxLen = Math.max(w.length, B.length);
        const sim = 1 - dist / maxLen;
        if (sim > 0.82 && w.length > 3) {
          detected.push({ name: brand, confidence: sim > 0.9 ? "high" : "medium" });
          return;
        }
      }
    });

    // unique by name
    return detected.filter((v, i, arr) => arr.findIndex((x) => x.name === v.name) === i);
  }

  async function extractTextFromImage() {
    if (typeof Tesseract === "undefined") {
      throw new Error("Tesseract.js not loaded");
    }
    const imageData = canvas.toDataURL("image/png");
    const result = await Tesseract.recognize(imageData, "eng");
    const extractedText = result.data.text || "";
    return {
      fullText: extractedText,
      detectedBrands: filterBrands(extractedText),
      confidence: result.data.confidence || 0
    };
  }

  function displayResults(predictions, textResults) {
    let html = "";

    if (predictions?.length) {
      html += "<p><strong>🔍 Detected Items:</strong></p><ul>";
      const counts = {};
      predictions.forEach((p) => {
        counts[p.class] = counts[p.class] || [];
        counts[p.class].push(p.score);
      });
      Object.entries(counts).forEach(([k, arr]) => {
        const avg = (arr.reduce((a, b) => a + b, 0) / arr.length) * 100;
        html += `<li><strong>${k}</strong> - ${avg.toFixed(1)}% confidence</li>`;
      });
      html += "</ul>";
    }

    if (textResults?.detectedBrands?.length) {
      html += "<p style='margin-top:16px;'><strong>🏷️ Brand Detected:</strong></p><ul>";
      textResults.detectedBrands.slice(0, 5).forEach((b) => {
        html += `<li><strong>${b.name}</strong> <span style="color:#777;font-size:0.85rem;">(${b.confidence})</span></li>`;
      });
      html += `</ul><p style="color:#777;font-size:0.85rem;">OCR Confidence: ${textResults.confidence.toFixed(1)}%</p>`;
    } else {
      html += "<p style='margin-top:16px;color:#666;'>No known brand detected — try aiming at the label/tag.</p>";
    }

    analysisResults.innerHTML = html;
  }

  if (captureBtn && cameraFeed && canvas && resultsContainer && analysisResults && loadingSpinner) {
    captureBtn.addEventListener("click", async () => {
      const ctx = canvas.getContext("2d");
      canvas.width = cameraFeed.videoWidth || 640;
      canvas.height = cameraFeed.videoHeight || 480;
      ctx.drawImage(cameraFeed, 0, 0);

      loadingSpinner.style.display = "block";
      captureBtn.style.display = "none";

      try {
        if (!model) {
          if (typeof cocoSsd === "undefined") throw new Error("COCO-SSD not loaded");
          model = await cocoSsd.load();
        }
        const preds = await model.detect(canvas);
        const textResults = await extractTextFromImage();
        displayResults(preds, textResults);
      } catch (e) {
        console.error(e);
        analysisResults.innerHTML = `<p style="color:red;">${e.message}</p>`;
      } finally {
        loadingSpinner.style.display = "none";
        resultsContainer.style.display = "block";
      }
    });
  }

  if (scanAgainBtn && resultsContainer && captureBtn) {
    scanAgainBtn.addEventListener("click", () => {
      resultsContainer.style.display = "none";
      captureBtn.style.display = "block";
    });
  }

  /* =========================
     Brand Search Modal (your existing structure)
  ========================= */
  const brandSearchBtn = document.getElementById("brandSearchBtn");
  const brandSearchModal = document.getElementById("brandSearchModal");
  const closeBrandModal = document.getElementById("closeBrandModal");
  const brandSearchInput = document.getElementById("brandSearchInput");
  const searchBrandBtn = document.getElementById("searchBrandBtn");
  const brandResultsContainer = document.getElementById("brandResultsContainer");
  const brandResults = document.getElementById("brandResults");
  const brandLoadingSpinner = document.getElementById("brandLoadingSpinner");

  if (brandSearchBtn && brandSearchModal && brandSearchInput) {
    brandSearchBtn.addEventListener("click", () => {
      brandSearchModal.classList.add("active");
      brandSearchInput.focus();
    });
  }

  if (closeBrandModal && brandSearchModal) {
    closeBrandModal.addEventListener("click", () => {
      brandSearchModal.classList.remove("active");
      if (brandSearchInput) brandSearchInput.value = "";
      if (brandResultsContainer) brandResultsContainer.style.display = "none";
    });

    brandSearchModal.addEventListener("click", (e) => {
      if (e.target === brandSearchModal) {
        brandSearchModal.classList.remove("active");
        if (brandSearchInput) brandSearchInput.value = "";
        if (brandResultsContainer) brandResultsContainer.style.display = "none";
      }
    });
  }

  // keep your brandDatabase if you want — this is just a safe stub
  const brandDatabase = window.brandDatabase || {};

  const runBrandSearch = () => {
    if (!brandSearchInput || !brandResults) return;
    const q = brandSearchInput.value.trim().toLowerCase();
    if (!q) return alert("Please enter a brand name.");

    if (brandLoadingSpinner) brandLoadingSpinner.style.display = "block";
    if (brandResultsContainer) brandResultsContainer.style.display = "none";

    setTimeout(() => {
      if (brandLoadingSpinner) brandLoadingSpinner.style.display = "none";
      if (brandResultsContainer) brandResultsContainer.style.display = "block";

      const data = brandDatabase[q];
      if (!data) {
        brandResults.innerHTML = `<h3>"${q}"</h3><p style="color:#666;">Not found in database yet.</p>`;
        return;
      }
      brandResults.innerHTML = `
        <h3>${data.name}</h3>
        <p><strong>Risk:</strong> ${data.risk}</p>
        <ul>${(data.issues || []).map((x) => `<li>${x}</li>`).join("")}</ul>
      `;
    }, 450);
  };

  if (searchBrandBtn) searchBrandBtn.addEventListener("click", runBrandSearch);
  if (brandSearchInput) {
    brandSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") runBrandSearch();
    });
  }

  /* =========================
     Lanyard drag (strap + badge)
  ========================= */
  (function initLanyardDrag() {
    const lanyard = document.getElementById("ijmLanyard");
    if (!lanyard) return;

    const strap = document.getElementById("ijmStrap");
    const badge = lanyard.querySelector(".lanyard-badge");
    const handles = [strap, badge].filter(Boolean);

    lanyard.classList.add("is-idle");

    let dragging = false;
    let targetX = 0, targetY = 0;
    let curX = 0, curY = 0;
    let lastX = 0, lastY = 0;
    let raf = null;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const animate = () => {
      curX += (targetX - curX) * 0.12;
      curY += (targetY - curY) * 0.12;
      lanyard.style.transform = `rotateX(${curY}deg) rotateY(${curX}deg)`;
      raf = requestAnimationFrame(animate);
    };

    const startAnim = () => {
      if (!raf) raf = requestAnimationFrame(animate);
    };

    const stopAnim = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };

    const begin = (e) => {
      dragging = true;
      lanyard.classList.remove("is-idle");
      lastX = e.clientX;
      lastY = e.clientY;
      try { e.target.setPointerCapture(e.pointerId); } catch {}
      startAnim();
    };

    const move = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      targetX = clamp(targetX + dx * 0.18, -18, 18);
      targetY = clamp(targetY - dy * 0.14, -14, 14);
    };

    const end = (e) => {
      dragging = false;
      try { e.target.releasePointerCapture(e.pointerId); } catch {}

      const settle = () => {
        targetX *= 0.86;
        targetY *= 0.86;

        if (Math.abs(targetX) < 0.25 && Math.abs(targetY) < 0.25) {
          targetX = 0; targetY = 0;
          lanyard.style.transform = `rotateX(0deg) rotateY(0deg)`;
          stopAnim();
          lanyard.classList.add("is-idle");
          return;
        }
        requestAnimationFrame(settle);
      };

      requestAnimationFrame(settle);
    };

    handles.forEach((el) => {
      el.addEventListener("pointerdown", (e) => {
        el.style.cursor = "grabbing";
        begin(e);
      });
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", (e) => {
        el.style.cursor = "grab";
        end(e);
      });
      el.addEventListener("pointercancel", (e) => {
        el.style.cursor = "grab";
        end(e);
      });
    });
  })();

  /* =========================
     Flashlight blur title
  ========================= */
  const flashlight = document.getElementById("flashlightTitle");
  if (flashlight) {
    flashlight.addEventListener("mousemove", (e) => {
      const rect = flashlight.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      flashlight.style.setProperty("--x", `${x}%`);
      flashlight.style.setProperty("--y", `${y}%`);
    });

    flashlight.addEventListener("mouseleave", () => {
      flashlight.style.setProperty("--x", `50%`);
      flashlight.style.setProperty("--y", `50%`);
    });
  }

  /* =========================
     Scroll-triggered animations (ONE system)
     - applies to: .animate-on-scroll
     - fixes: blank-until-refresh
  ========================= */
  const animated = document.querySelectorAll(".animate-on-scroll");
  if (animated.length) {
    const reveal = (el) => el.classList.add("active");

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
            io.unobserve(entry.target); // run once
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    animated.forEach((sec) => io.observe(sec));

    // If already visible (fast refresh / deep link)
    animated.forEach((sec) => {
      const r = sec.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) reveal(sec);
    });
  }

  console.log("btl.js init complete");
});

/* =========================
     FAQ Accordion
  ========================= */
  const toggleFaq = (id) => {
    const item = document.getElementById(id);
    if (!item) return;
    const isOpen = item.classList.contains('open');

    // Close all
    document.querySelectorAll('.faq-item').forEach(el => {
      el.classList.remove('open');
      el.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
    });

    // Open clicked if it was closed
    if (!isOpen) {
      item.classList.add('open');
      item.querySelector('.faq-question')?.setAttribute('aria-expanded', 'true');
    }
  };

  // Expose to global scope so onclick="toggleFaq(...)" works in HTML
  window.toggleFaq = toggleFaq;


document.getElementById("learnMoreBtn").addEventListener("click", () => {
  document.getElementById("about").scrollIntoView({
    behavior: "smooth"
  });
});


// Partner logo reveal on scroll
const partnerLogo = document.querySelector('.partner-logo');

const observer = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) {
      partnerLogo.classList.add('visible');
    }
  },
  { threshold: 0.4 }
);

if (partnerLogo) {
  observer.observe(partnerLogo);
}


const targetNumber = 160000000; // 160 million (ILO estimate)
const duration = 4000; // 4 seconds animation
const counterElement = document.getElementById("childCounter");

let start = 0;
const increment = targetNumber / (duration / 16);
let hasAnimated = false;

function updateCounter() {
  start += increment;

  if (start < targetNumber) {
    counterElement.textContent = Math.floor(start).toLocaleString();
    requestAnimationFrame(updateCounter);
  } else {
    counterElement.textContent = targetNumber.toLocaleString();
  }
}

// Observe counter section for scroll animation
const counterObserver = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting && !hasAnimated) {
      hasAnimated = true;
      updateCounter();
    }
  },
  { threshold: 0.3 }
);

if (counterElement) {
  counterObserver.observe(counterElement);
}


const map = L.map("map", {
  zoomControl: false
}).setView([20, 0], 2);

L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "© Esri, USGS"
  }
).addTo(map);


const regions = [
  {
    name: "South Asia",
    coords: [22, 78],
    risk: "High",
    description: "High prevalence of child labour in agriculture and manufacturing."
  },
  {
    name: "Sub-Saharan Africa",
    coords: [1, 20],
    risk: "High",
    description: "Highest proportion of children in child labour globally."
  },
  {
    name: "East Asia & Pacific",
    coords: [15, 105],
    risk: "Medium",
    description: "Forced labour linked to supply chains and manufacturing."
  },
  {
    name: "Latin America",
    coords: [-10, -55],
    risk: "Medium",
    description: "Child labour persists in informal economies."
  },
  {
    name: "Middle East & North Africa",
    coords: [25, 45],
    risk: "Medium",
    description: "Migrant labour vulnerability and forced labour risks."
  }
];

regions.forEach(region => {
  L.circleMarker(region.coords, {
    radius: 10,
    color: "#000000",        // black outline for contrast
    fillColor: "#FF1044",    // bright neon red fill
    fillOpacity: 1,
    weight: 2
  })
    .addTo(map)
    .bindPopup(`
      <strong>${region.name}</strong><br>
      <em>Elevated risk of forced or child labour</em><br>
      ${region.description}
    `);
});

/* =========================
   CAMERA SCANNER
========================= */

// Using TensorFlow.js with COCO-SSD for FREE object detection (no API key needed)
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

// Open camera modal
cameraBtn.addEventListener("click", () => {
  cameraModal.classList.add("active");
  startCamera();
});

// Close camera modal
closeModal.addEventListener("click", () => {
  cameraModal.classList.remove("active");
  stopCamera();
});

// Click outside modal to close
cameraModal.addEventListener("click", (e) => {
  if (e.target === cameraModal) {
    cameraModal.classList.remove("active");
    stopCamera();
  }
});

// Start camera feed
async function startCamera() {
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    cameraFeed.srcObject = currentStream;
  } catch (error) {
    alert("Error accessing camera: " + error.message);
  }
}

// Stop camera feed
function stopCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
}

// Capture image from camera
captureBtn.addEventListener("click", async () => {
  const ctx = canvas.getContext("2d");
  canvas.width = cameraFeed.videoWidth;
  canvas.height = cameraFeed.videoHeight;
  ctx.drawImage(cameraFeed, 0, 0);
  
  loadingSpinner.style.display = "block";
  captureBtn.style.display = "none";
  
  // Load model if not already loaded
  if (!model) {
    try {
      model = await cocoSsd.load();
    } catch (error) {
      loadingSpinner.style.display = "none";
      analysisResults.innerHTML = `<p style="color: red;">Error loading AI model: ${error.message}</p>`;
      resultsContainer.style.display = "block";
      return;
    }
  }
  
  analyzeWithTensorFlow();
});

// Analyze image with TensorFlow.js (FREE - no API key needed)
async function analyzeWithTensorFlow() {
  try {
    // Run object detection on the captured image
    const predictions = await model.detect(canvas);
    
    console.log("Predictions:", predictions);
    
    // Extract text from image using OCR (for brand detection)
    const textResults = await extractTextFromImage();
    
    displayResults(predictions, textResults);
    
    loadingSpinner.style.display = "none";
    resultsContainer.style.display = "block";
  } catch (error) {
    console.error("Error:", error);
    loadingSpinner.style.display = "none";
    analysisResults.innerHTML = `<p style="color: red;">Error analyzing image: ${error.message}</p>`;
    resultsContainer.style.display = "block";
  }
}

// Extract text from image using OCR (Tesseract.js)
async function extractTextFromImage() {
  try {
    const imageData = canvas.toDataURL("image/png");
    
    const result = await Tesseract.recognize(imageData, "eng", {
      logger: m => console.log("OCR Progress:", m)
    });
    
    console.log("OCR Result:", result);
    
    // Extract brand-relevant keywords from the text
    const extractedText = result.data.text.toUpperCase();
    const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
    
    return {
      fullText: extractedText,
      lines: lines,
      confidence: result.data.confidence
    };
  } catch (error) {
    console.error("OCR Error:", error);
    return { fullText: "", lines: [], confidence: 0 };
  }
}

// Display analysis results
function displayResults(predictions, textResults = { fullText: "", lines: [], confidence: 0 }) {
  let html = "";
  
  // SECTION 1: Detected Objects
  if (predictions && predictions.length > 0) {
    html += "<p><strong>🔍 Detected Items:</strong></p>";
    html += "<ul>";
    
    // Group predictions by class
    const itemCounts = {};
    predictions.forEach(pred => {
      const className = pred.class;
      const confidence = (pred.score * 100).toFixed(1);
      
      if (!itemCounts[className]) {
        itemCounts[className] = [];
      }
      itemCounts[className].push(confidence);
    });
    
    // Display grouped items
    Object.entries(itemCounts).forEach(([item, confidences]) => {
      const avgConfidence = (confidences.reduce((a, b) => parseFloat(a) + parseFloat(b)) / confidences.length).toFixed(1);
      html += `<li><strong>${item}</strong> - ${avgConfidence}% confidence</li>`;
    });
    
    html += "</ul>";
  }
  
  // SECTION 2: Extracted Text / Brand Information
  if (textResults && textResults.lines && textResults.lines.length > 0) {
    html += "<p style='margin-top: 20px;'><strong>🏷️ Text/Brand Information Detected:</strong></p>";
    
    // Filter for likely brand names (short, meaningful text)
    const brandCandidates = textResults.lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 2 && trimmed.length < 50 && /[A-Z]/.test(trimmed);
    }).slice(0, 10);
    
    if (brandCandidates.length > 0) {
      html += "<ul>";
      brandCandidates.forEach(brand => {
        html += `<li><strong>${brand}</strong></li>`;
      });
      html += "</ul>";
    } else {
      html += "<p style='color: #666; font-size: 0.9rem;'>No clear text detected. Try a clearer photo of the label or brand tag.</p>";
    }
    
    html += `<p style='font-size: 0.85rem; color: #999;'>OCR Confidence: ${(textResults.confidence).toFixed(1)}%</p>`;
  } else if (!predictions || predictions.length === 0) {
    html += "<p>No items detected. Try capturing a clearer image with visible brand labels.</p>";
  } else {
    html += "<p style='color: #666; font-size: 0.9rem;'>No text detected. Position the camera directly on the brand label for better results.</p>";
  }
  
  html += "<p style='margin-top: 20px; padding: 12px; background-color: #fef3c7; border-radius: 8px; font-size: 0.9rem;'>";
  html += "<strong>💡 Tip:</strong> For best results, photograph the brand label or tag directly. This will extract visible text and brand information from your clothing.";
  html += "</p>";
  
  html += `<button id="fallbackSearchBrandBtn" class="search-brand-fallback-btn">🔍 Search Brand Database Instead</button>`;
  
  analysisResults.innerHTML = html;
  
  // Add event listener to fallback button
  const fallbackBtn = document.getElementById("fallbackSearchBrandBtn");
  if (fallbackBtn) {
    fallbackBtn.addEventListener("click", () => {
      cameraModal.classList.remove("active");
      stopCamera();
      setTimeout(() => {
        brandSearchModal.classList.add("active");
        brandSearchInput.focus();
      }, 300);
    });
  }
}

// Scan again
scanAgainBtn.addEventListener("click", () => {
  resultsContainer.style.display = "none";
  captureBtn.style.display = "block";
  cameraFeed.style.display = "block";
});

/* =========================
   BRAND SEARCH
========================= */

// Brand ethics database
const brandDatabase = {
  "nike": {
    name: "Nike",
    risk: "High",
    issues: [
      "History of labor rights violations and poor working conditions in manufacturing facilities",
      "Children have been found working in Nike factories",
      "Reports of wage theft and excessive working hours"
    ],
    sources: [
      { title: "International Labour Organization (ILO) Report", url: "https://www.ilo.org/" },
      { title: "Human Rights Watch - Nike Labor Issues", url: "https://www.hrw.org/" },
      { title: "Clean Clothes Campaign", url: "https://cleanclothes.org/" }
    ]
  },
  "h&m": {
    name: "H&M",
    risk: "High",
    issues: [
      "Documented cases of child labor in supplier factories",
      "Poor wages and working conditions for garment workers",
      "Supply chain transparency concerns"
    ],
    sources: [
      { title: "Walk Free Foundation - Modern Slavery Index", url: "https://www.walkfree.org/" },
      { title: "Change.org - H&M Labor Concerns", url: "https://www.change.org/" },
      { title: "Business & Human Rights Resource Centre", url: "https://www.business-humanrights.org/" }
    ]
  },
  "zara": {
    name: "Zara",
    risk: "Medium",
    issues: [
      "Factory workers report low wages and long hours",
      "Limited transparency in supply chain operations",
      "Ongoing monitoring required for ethical compliance"
    ],
    sources: [
      { title: "Clean Clothes Campaign", url: "https://cleanclothes.org/" },
      { title: "Ethical Consumer", url: "https://www.ethicalconsumer.org/" }
    ]
  },
  "forever 21": {
    name: "Forever 21",
    risk: "High",
    issues: [
      "Multiple investigations into labor violations",
      "Garment workers report poverty wages",
      "Child labor concerns in supply chains",
      "Poor working conditions and unsafe facilities"
    ],
    sources: [
      { title: "International Labour Organization (ILO)", url: "https://www.ilo.org/" },
      { title: "Global Labour Justice", url: "https://globallabour.org/" }
    ]
  },
  "shein": {
    name: "Shein",
    risk: "High",
    issues: [
      "Severe labor rights violations documented",
      "Extreme underpayment of garment workers",
      "Child labor allegations",
      "Unsafe working conditions in factories",
      "No formal audits or transparency"
    ],
    sources: [
      { title: "ILO Report on Supply Chain Violations", url: "https://www.ilo.org/" },
      { title: "Labour Rights Investigation", url: "https://www.laborrights.org/" }
    ]
  },
  "adidas": {
    name: "Adidas",
    risk: "Medium",
    issues: [
      "Labor rights concerns in manufacturing facilities",
      "Workers report wage and working hour issues",
      "Ongoing improvements in ethical compliance"
    ],
    sources: [
      { title: "Clean Clothes Campaign Adidas Update", url: "https://cleanclothes.org/" },
      { title: "Human Rights Watch", url: "https://www.hrw.org/" }
    ]
  },
  "puma": {
    name: "Puma",
    risk: "Medium",
    issues: [
      "Supply chain labor concerns",
      "Wage fairness issues reported",
      "Transparency improvements ongoing"
    ],
    sources: [
      { title: "Business & Human Rights Resource Centre", url: "https://www.business-humanrights.org/" }
    ]
  },
  "fast fashion": {
    name: "Fast Fashion (General)",
    risk: "High",
    issues: [
      "Industry-wide child labor problems",
      "Systemic wage theft and abuse",
      "Poor safety standards causing deaths",
      "Environmental destruction from overproduction"
    ],
    sources: [
      { title: "UN Report on Fast Fashion", url: "https://www.un.org/" },
      { title: "Fashion Revolution", url: "https://www.fashionrevolution.org/" }
    ]
  }
};

const brandSearchBtn = document.getElementById("brandSearchBtn");
const brandSearchModal = document.getElementById("brandSearchModal");
const closeBrandModal = document.getElementById("closeBrandModal");
const brandSearchInput = document.getElementById("brandSearchInput");
const searchBrandBtn = document.getElementById("searchBrandBtn");
const brandResultsContainer = document.getElementById("brandResultsContainer");
const brandResults = document.getElementById("brandResults");
const brandLoadingSpinner = document.getElementById("brandLoadingSpinner");

// Open brand search modal
brandSearchBtn.addEventListener("click", () => {
  brandSearchModal.classList.add("active");
  brandSearchInput.focus();
});

// Close brand search modal
closeBrandModal.addEventListener("click", () => {
  brandSearchModal.classList.remove("active");
  brandSearchInput.value = "";
  brandResultsContainer.style.display = "none";
});

// Click outside modal to close
brandSearchModal.addEventListener("click", (e) => {
  if (e.target === brandSearchModal) {
    brandSearchModal.classList.remove("active");
    brandSearchInput.value = "";
    brandResultsContainer.style.display = "none";
  }
});

// Search for brand
searchBrandBtn.addEventListener("click", searchBrand);
brandSearchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchBrand();
  }
});

function searchBrand() {
  const searchQuery = brandSearchInput.value.trim().toLowerCase();
  
  if (!searchQuery) {
    alert("Please enter a brand name");
    return;
  }
  
  brandLoadingSpinner.style.display = "block";
  brandResultsContainer.style.display = "none";
  
  // Simulate API delay for realism
  setTimeout(() => {
    const brandData = brandDatabase[searchQuery];
    
    brandLoadingSpinner.style.display = "none";
    brandResultsContainer.style.display = "block";
    
    if (brandData) {
      displayBrandResults(brandData);
    } else {
      // If brand not in database, show generic message
      brandResults.innerHTML = `
        <h3>"${searchQuery}" - Information</h3>
        <p style="color: #666;">
          This brand is not currently in our detailed database. However, we recommend:
        </p>
        <ul>
          <li>Check the <a href="https://www.walkfree.org/" target="_blank">Walk Free Foundation</a> Modern Slavery Index</li>
          <li>Review <a href="https://cleanclothes.org/" target="_blank">Clean Clothes Campaign</a> reports</li>
          <li>Visit <a href="https://www.ethicalconsumer.org/" target="_blank">Ethical Consumer</a> for ratings</li>
          <li>Search <a href="https://www.business-humanrights.org/" target="_blank">Business & Human Rights Resource Centre</a></li>
        </ul>
        <p style="margin-top: 20px; font-size: 0.9rem; color: #999;">
          💡 Tip: Search for similar brands or use the general "fast fashion" search for industry-wide insights.
        </p>
      `;
    }
  }, 500);
}

function displayBrandResults(brandData) {
  let html = `
    <h3>${brandData.name}</h3>
    <div class="warning-box">
      <p><strong>Ethical Risk Level: ${brandData.risk}</strong></p>
    </div>
    
    <p><strong>Key Issues:</strong></p>
    <ul>
  `;
  
  brandData.issues.forEach(issue => {
    html += `<li>${issue}</li>`;
  });
  
  html += `
    </ul>
    
    <p><strong>📚 Sources & Resources:</strong></p>
    <ul>
  `;
  
  brandData.sources.forEach(source => {
    html += `<li><a href="${source.url}" target="_blank">${source.title}</a></li>`;
  });
  
  html += `
    </ul>
    
    <div class="info-box">
      <strong>💡 What You Can Do:</strong>
      <p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Support ethical brands that prioritize worker welfare</li>
          <li>Buy secondhand or vintage clothing</li>
          <li>Choose quality over quantity</li>
          <li>Research brands before making purchases</li>
          <li>Share this information with friends and family</li>
        </ul>
      </p>
    </div>
  `;
  
  brandResults.innerHTML = html;
}

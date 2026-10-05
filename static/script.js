(() => {
  // ---------- DOM Element References ----------
  const form = document.getElementById("riskForm");
  const submitBtn = document.getElementById("submitBtn");
  const errorNote = document.getElementById("errorNote");
  const verdict = document.getElementById("verdict");
  const standbyCard = document.getElementById("standbyCard");

  const incomeInput = document.getElementById("person_income");
  const amountInput = document.getElementById("loan_amnt");
  const percentInput = document.getElementById("loan_percent_income");
  const dtiStatusBadge = document.getElementById("dtiStatusBadge");

  const gaugeFill = document.getElementById("gaugeFill");
  const gaugeThreshold = document.getElementById("gaugeThreshold");
  const probNumber = document.getElementById("probNumber");
  const stampBadge = document.getElementById("stampBadge");
  const stampText = document.getElementById("stampText");

  const factProb = document.getElementById("factProb");
  const factThreshold = document.getElementById("factThreshold");
  const factResult = document.getElementById("factResult");
  const verdictSummaryText = document.getElementById("verdictSummaryText");

  const auditIncome = document.getElementById("auditIncome");
  const auditLoan = document.getElementById("auditLoan");
  const auditDti = document.getElementById("auditDti");
  const auditDefault = document.getElementById("auditDefault");

  const apiDot = document.getElementById("apiDot");
  const apiStatusText = document.getElementById("apiStatusText");

  // Presets
  const presetLowRisk = document.getElementById("presetLowRisk");
  const presetHighRisk = document.getElementById("presetHighRisk");
  const presetReset = document.getElementById("presetReset");

  const GAUGE_CIRCUMFERENCE = 540.35; // 2 * PI * 86

  // ---------- Currency Formatter ----------
  function formatINR(val) {
    if (isNaN(val)) return "—";
    return "₹" + Number(val).toLocaleString("en-IN");
  }

  // ---------- Auto-calculate & badge loan-to-income ratio ----------
  function recalcPercent() {
    const income = parseFloat(incomeInput.value);
    const amount = parseFloat(amountInput.value);
    if (income > 0 && amount >= 0) {
      const ratio = amount / income;
      percentInput.value = ratio.toFixed(2);
      updateDtiBadge(ratio);
    }
  }

  function updateDtiBadge(ratio) {
    if (!dtiStatusBadge) return;
    const pct = Math.round(ratio * 100);
    if (ratio <= 0.25) {
      dtiStatusBadge.textContent = `Optimal (${pct}%)`;
      dtiStatusBadge.style.borderColor = "var(--cobalt-border-strong)";
      dtiStatusBadge.style.color = "var(--color-white)";
    } else if (ratio <= 0.45) {
      dtiStatusBadge.textContent = `Moderate (${pct}%)`;
      dtiStatusBadge.style.borderColor = "var(--cobalt-bright)";
      dtiStatusBadge.style.color = "var(--text-secondary)";
    } else {
      dtiStatusBadge.textContent = `Elevated (${pct}%)`;
      dtiStatusBadge.style.borderColor = "var(--risk-high)";
      dtiStatusBadge.style.color = "var(--risk-high)";
    }
  }

  incomeInput.addEventListener("input", recalcPercent);
  amountInput.addEventListener("input", recalcPercent);
  percentInput.addEventListener("input", () => {
    const ratio = parseFloat(percentInput.value) || 0;
    updateDtiBadge(ratio);
  });
  recalcPercent();

  // ---------- Service Health Check ----------
  function checkService() {
    fetch("/openapi.json", { method: "GET" })
      .then((res) => {
        if (res.ok) {
          apiDot.className = "status-dot ok";
          apiStatusText.textContent = "ENGINE ONLINE";
        } else {
          throw new Error("bad status");
        }
      })
      .catch(() => {
        apiDot.className = "status-dot";
        apiStatusText.textContent = "LOCAL STANDBY";
      });
  }
  checkService();

  // ---------- Presets Management ----------
  const presets = {
    prime: {
      person_age: 38,
      person_income: 1200000,
      person_home_ownership: "MORTGAGE",
      person_emp_length: 10,
      loan_intent: "PERSONAL",
      loan_grade: "A",
      loan_amnt: 150000,
      loan_int_rate: 7.8,
      loan_percent_income: 0.13,
      cb_person_default_on_file: "N",
      cb_person_cred_hist_length: 12,
    },
    subprime: {
      person_age: 23,
      person_income: 300000,
      person_home_ownership: "RENT",
      person_emp_length: 1,
      loan_intent: "DEBTCONSOLIDATION",
      loan_grade: "D",
      loan_amnt: 220000,
      loan_int_rate: 17.5,
      loan_percent_income: 0.73,
      cb_person_default_on_file: "Y",
      cb_person_cred_hist_length: 2,
    },
    baseline: {
      person_age: 30,
      person_income: 600000,
      person_home_ownership: "RENT",
      person_emp_length: 5,
      loan_intent: "PERSONAL",
      loan_grade: "B",
      loan_amnt: 100000,
      loan_int_rate: 11.5,
      loan_percent_income: 0.17,
      cb_person_default_on_file: "N",
      cb_person_cred_hist_length: 6,
    }
  };

  function applyPreset(data) {
    document.getElementById("person_age").value = data.person_age;
    incomeInput.value = data.person_income;
    document.getElementById("person_home_ownership").value = data.person_home_ownership;
    document.getElementById("person_emp_length").value = data.person_emp_length;
    document.getElementById("loan_intent").value = data.loan_intent;
    document.getElementById("loan_grade").value = data.loan_grade;
    amountInput.value = data.loan_amnt;
    document.getElementById("loan_int_rate").value = data.loan_int_rate;
    percentInput.value = data.loan_percent_income;
    document.getElementById("cb_person_default_on_file").value = data.cb_person_default_on_file;
    document.getElementById("cb_person_cred_hist_length").value = data.cb_person_cred_hist_length;
    
    updateDtiBadge(data.loan_percent_income);
    clearError();
  }

  if (presetLowRisk) {
    presetLowRisk.addEventListener("click", () => {
      applyPreset(presets.prime);
      presetLowRisk.style.borderColor = "var(--cobalt-bright)";
      setTimeout(() => presetLowRisk.style.borderColor = "", 400);
    });
  }

  if (presetHighRisk) {
    presetHighRisk.addEventListener("click", () => {
      applyPreset(presets.subprime);
      presetHighRisk.style.borderColor = "var(--risk-high)";
      setTimeout(() => presetHighRisk.style.borderColor = "", 400);
    });
  }

  if (presetReset) {
    presetReset.addEventListener("click", () => {
      applyPreset(presets.baseline);
      if (verdict) verdict.hidden = true;
      if (standbyCard) standbyCard.hidden = false;
    });
  }

  // ---------- UI State Helpers ----------
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle("loading", isLoading);
    const label = submitBtn.querySelector(".btn-label");
    if (label) {
      label.textContent = isLoading ? "Computing Inferences…" : "Evaluate Credit Risk";
    }
  }

  function showError(message) {
    errorNote.textContent = message;
    errorNote.hidden = false;
  }

  function clearError() {
    errorNote.hidden = true;
    errorNote.textContent = "";
  }

  function animateNumber(el, from, to, duration) {
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (to - from) * eased;
      el.textContent = value.toFixed(1);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = to.toFixed(1);
    }
    requestAnimationFrame(tick);
  }

  // ---------- Render Verdict Presentation ----------
  function renderVerdict(data, rawPayload) {
    const probabilityPct = data.default_probability * 100;
    // Calibrated threshold boundary (defaults to 40% if file threshold is uncalibrated/near 1.0)
    const effectiveThreshold = (data.threshold > 0.90) ? 0.40 : data.threshold;
    const thresholdPct = effectiveThreshold * 100;
    const isHighRisk = data.default_prediction === 1 || data.Result === "High Risk" || probabilityPct >= thresholdPct;

    // Toggle standby card & show verdict
    if (standbyCard) standbyCard.hidden = true;
    verdict.hidden = false;
    verdict.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Radial Gauge Fill Animation
    const offset = GAUGE_CIRCUMFERENCE * (1 - Math.min(100, Math.max(0, probabilityPct)) / 100);
    gaugeFill.style.stroke = isHighRisk ? "var(--risk-high)" : "var(--cobalt-electric)";
    requestAnimationFrame(() => {
      gaugeFill.style.strokeDashoffset = offset;
    });

    // Threshold indicator line on circular arc
    gaugeThreshold.style.transform = `rotate(${thresholdPct * 3.6}deg)`;

    // Digital readout counter
    animateNumber(probNumber, 0, probabilityPct, 1000);

    // Decision Stamp / Badge
    stampBadge.classList.remove("stamp--in", "risk-high");
    void stampBadge.offsetWidth; // Force re-render for clean CSS animation
    
    if (isHighRisk) {
      stampBadge.classList.add("risk-high");
      stampText.textContent = "HIGH RISK";
      if (verdictSummaryText) verdictSummaryText.textContent = "Predicted risk exceeds safe cutoff";
    } else {
      stampText.textContent = "LOW RISK";
      if (verdictSummaryText) verdictSummaryText.textContent = "Within approved risk variance bounds";
    }
    requestAnimationFrame(() => stampBadge.classList.add("stamp--in"));

    // Key quantitative metrics
    factProb.textContent = `${probabilityPct.toFixed(1)}%`;
    factThreshold.textContent = `${thresholdPct.toFixed(1)}%`;
    factResult.textContent = isHighRisk ? "High Risk" : "Low Risk";
    factResult.style.color = isHighRisk ? "var(--risk-high)" : "var(--color-white)";

    // Audit parameter summary
    if (auditIncome) auditIncome.textContent = formatINR(rawPayload.person_income);
    if (auditLoan) auditLoan.textContent = formatINR(rawPayload.loan_amnt);
    if (auditDti) auditDti.textContent = `${(rawPayload.loan_percent_income * 100).toFixed(1)}%`;
    if (auditDefault) auditDefault.textContent = rawPayload.cb_person_default_on_file === "Y" ? "Yes (Adverse)" : "No (Clean)";
  }

  // ---------- Form Submission & API Request ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    const payload = {
      person_age: parseInt(document.getElementById("person_age").value, 10),
      person_income: parseFloat(incomeInput.value),
      person_home_ownership: document.getElementById("person_home_ownership").value,
      person_emp_length: parseFloat(document.getElementById("person_emp_length").value),
      loan_intent: document.getElementById("loan_intent").value,
      loan_grade: document.getElementById("loan_grade").value,
      loan_amnt: parseFloat(amountInput.value),
      loan_int_rate: parseFloat(document.getElementById("loan_int_rate").value),
      loan_percent_income: parseFloat(percentInput.value),
      cb_person_default_on_file: document.getElementById("cb_person_default_on_file").value,
      cb_person_cred_hist_length: parseInt(document.getElementById("cb_person_cred_hist_length").value, 10),
    };

    try {
      const res = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const detail = body && body.detail ? JSON.stringify(body.detail) : `HTTP ${res.status}`;
        throw new Error(detail);
      }

      const data = await res.json();
      renderVerdict(data, payload);
      apiDot.className = "status-dot ok";
      apiStatusText.textContent = "ENGINE ONLINE";
    } catch (err) {
      console.warn("Backend error or offline, testing connection...", err);
      showError(`Underwriting API: ${err.message || "Connection refused"}. Ensure main.py server is active.`);
    } finally {
      setLoading(false);
    }
  });
})();

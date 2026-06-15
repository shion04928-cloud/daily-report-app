const times    = ["朝", "昼", "夜"];
const services = ["身１", "身２", "家１", "家２", "生１", "生２"];
const svcNeedsBath = (svc) => svc.startsWith("身");

let sel = { time: null, svc: null, bath: null };
let toastTimer = null;
const lastPicked = JSON.parse(localStorage.getItem('lastPicked') || '{}');

function pickRandom(arr, key) {
  if (arr.length === 1) return arr[0];
  const prev = lastPicked[key];
  const candidates = arr.filter(t => t !== prev);
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  lastPicked[key] = chosen;
  localStorage.setItem('lastPicked', JSON.stringify(lastPicked));
  return chosen;
}

function showToast(msg, isErr) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "show" + (isErr ? " err" : "");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ""; }, 2000);
}

function showPreview(text, ok) {
  const p  = document.getElementById("preview");
  const pt = document.getElementById("preview-text");
  p.querySelector(".preview-placeholder").style.display = "none";
  pt.style.display = "block";
  pt.textContent = text;
  p.className = "preview-card" + (ok ? " ok" : "");
  if (ok) setTimeout(() => p.classList.remove("ok"), 2200);
}

function doCopy(key) {
  const list = templates[key];
  if (!list || list.length === 0) {
    showToast("テンプレートがありません", true);
    return;
  }
  const text = pickRandom(list, key);
  if (!navigator.clipboard) {
    showPreview(text, false);
    document.getElementById("fallback").style.display = "block";
    document.getElementById("fallback-text").textContent = text;
    showToast("手動でコピーしてください", true);
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    showPreview(text, true);
    document.getElementById("fallback").style.display = "none";
    showToast("コピーしました ✓");
  }).catch(() => {
    showPreview(text, false);
    document.getElementById("fallback").style.display = "block";
    document.getElementById("fallback-text").textContent = text;
    showToast("手動でコピーしてください", true);
  });
}

function setActive(group, btn) {
  group.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function resetFrom(step) {
  if (step <= 3) {
    ["step3", "step3-work"].forEach(id => {
      const el = document.getElementById(id);
      el.style.display = "none";
      el.classList.add("disabled");
    });
    document.querySelectorAll(".bath-btn, .work-btn").forEach(b => b.classList.remove("active"));
    sel.bath = null;
  }
  if (step <= 4) {
    const s4 = document.getElementById("step4");
    s4.style.display = "none";
    s4.classList.add("disabled");
    document.querySelectorAll(".meal-btn").forEach(b => b.classList.remove("active"));
  }
}

// ── Step 1: 時間帯 ──
const timeBtns = document.getElementById("time-btns");
times.forEach(t => {
  const btn = document.createElement("button");
  btn.className = "time-btn";
  btn.textContent = t;
  btn.addEventListener("click", () => {
    sel.time = t;
    sel.svc  = null;
    setActive(timeBtns, btn);
    document.getElementById("step2").classList.remove("disabled");
    document.querySelectorAll(".svc-btn").forEach(b => b.classList.remove("active"));
    resetFrom(3);
  });
  timeBtns.appendChild(btn);
});

// ── Step 2: サービス ──
const svcBtns = document.getElementById("svc-btns");
services.forEach(svc => {
  const btn = document.createElement("button");
  btn.className = "svc-btn";
  btn.textContent = svc;
  btn.addEventListener("click", () => {
    if (!sel.time) return;
    sel.svc = svc;
    setActive(svcBtns, btn);
    resetFrom(3);

    if (svcNeedsBath(svc)) {
      const s3 = document.getElementById("step3");
      s3.style.display = "block";
      s3.classList.remove("disabled");
    } else {
      const s3w = document.getElementById("step3-work");
      s3w.style.display = "block";
      s3w.classList.remove("disabled");
    }
  });
  svcBtns.appendChild(btn);
});

// ── Step 3: 入浴（身体系） ──
const bathGroup = document.getElementById("step3").querySelector(".btn-group");
document.getElementById("bath-yes").addEventListener("click", function() {
  if (!sel.time || !sel.svc) return;
  sel.bath = "入浴";
  setActive(bathGroup, this);
  resetFrom(4);
  const s4 = document.getElementById("step4");
  s4.style.display = "block";
  s4.classList.remove("disabled");
});
document.getElementById("bath-no").addEventListener("click", function() {
  if (!sel.time || !sel.svc) return;
  sel.bath = "通常";
  setActive(bathGroup, this);
  resetFrom(4);
  const s4 = document.getElementById("step4");
  s4.style.display = "block";
  s4.classList.remove("disabled");
});

// ── Step 3: 作業内容（家事系） ──
const workBtns = document.getElementById("work-btns");
["調理", "洗濯", "掃除"].forEach(work => {
  const btn = document.createElement("button");
  btn.className = "work-btn";
  btn.textContent = work;
  btn.addEventListener("click", () => {
    if (!sel.time || !sel.svc) return;
    setActive(workBtns, btn);
    doCopy(`${sel.svc}_${sel.time}_${work}`);
  });
  workBtns.appendChild(btn);
});

// ── Step 4: 食事（身体系） ──
const mealGroup = document.getElementById("step4").querySelector(".btn-group");
document.getElementById("meal-yes").addEventListener("click", function() {
  if (!sel.time || !sel.svc || !sel.bath) return;
  setActive(mealGroup, this);
  doCopy(`${sel.svc}_${sel.time}_${sel.bath}_食事あり`);
});
document.getElementById("meal-no").addEventListener("click", function() {
  if (!sel.time || !sel.svc || !sel.bath) return;
  setActive(mealGroup, this);
  doCopy(`${sel.svc}_${sel.time}_${sel.bath}_食事なし`);
});

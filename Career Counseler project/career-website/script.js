// ── Slider value updater ──────────────────────────────────────────
function updateVal(id) {
  const input = document.getElementById(id);
  const badge = document.getElementById(id + '-val');
  if (badge) badge.textContent = input.value;
}

// ── Career definitions ────────────────────────────────────────────
const CAREERS = [
  { name: 'Sports Analytics',           color: '#7C3AED', icon: '📊' },
  { name: 'Data Science / Engineering', color: '#0EA5E9', icon: '💻' },
  { name: 'Medicine / Research',        color: '#10B981', icon: '🔬' },
  { name: 'Professional Athlete',       color: '#F59E0B', icon: '🏆' },
  { name: 'Arts & Humanities',          color: '#EC4899', icon: '🎨' },
  { name: 'Business / Management',      color: '#EF4444', icon: '💼' },
];

// ── Core scoring logic (mirrors the Random Forest logic from Python) ──
function scoreProfile(p) {
  // Each career has a "centroid" — the typical profile of a student
  // who succeeds in that field. We calculate closeness to each centroid.

  const profiles = [
    // Sports Analytics: High Math + High Sport Skill
    { math:82, physics:72, chemistry:60, biology:60, english:68,
      attendance:80, focus:55, skill:8,  sport_bonus: [0,1,3,4] },
    // Data Science: Highest Math + Physics, Low sport
    { math:90, physics:84, chemistry:70, biology:55, english:65,
      attendance:85, focus:75, skill:4,  sport_bonus: [2,5,6] },
    // Medicine: High Bio + Chem, Best attendance
    { math:72, physics:70, chemistry:88, biology:92, english:72,
      attendance:90, focus:85, skill:3,  sport_bonus: [2,5,6] },
    // Athlete: Low academics, Max skill
    { math:55, physics:52, chemistry:50, biology:60, english:58,
      attendance:72, focus:45, skill:9,  sport_bonus: [0,1,2,3,4] },
    // Arts: High English, low STEM
    { math:52, physics:50, chemistry:50, biology:55, english:88,
      attendance:75, focus:60, skill:3,  sport_bonus: [5,6] },
    // Business: Balanced, good English
    { math:75, physics:60, chemistry:58, biology:55, english:80,
      attendance:82, focus:65, skill:5,  sport_bonus: [0,1,5,6] },
  ];

  const weights = {
    math: 1.4, physics: 1.2, chemistry: 1.3, biology: 1.5,
    english: 1.4, attendance: 0.8, focus: 0.9, skill: 2.2
  };

  const scores = profiles.map((ref, i) => {
    let dist = 0;
    dist += weights.math       * Math.pow(p.math       - ref.math,       2);
    dist += weights.physics    * Math.pow(p.physics    - ref.physics,     2);
    dist += weights.chemistry  * Math.pow(p.chemistry  - ref.chemistry,   2);
    dist += weights.biology    * Math.pow(p.biology    - ref.biology,     2);
    dist += weights.english    * Math.pow(p.english    - ref.english,     2);
    dist += weights.attendance * Math.pow(p.attendance - ref.attendance,  2);
    dist += weights.focus      * Math.pow(p.focus      - ref.focus,       2);
    dist += weights.skill      * Math.pow(p.skill      - ref.skill,       2);

    // Sport type bonus: matching sport type reduces distance
    if (ref.sport_bonus.includes(p.sport)) dist *= 0.75;

    return { idx: i, dist };
  });

  // Convert distances to probabilities via softmax-like transform
  const maxD = Math.max(...scores.map(s => s.dist));
  const sims = scores.map(s => Math.exp(-s.dist / (maxD * 0.4)));
  const total = sims.reduce((a, b) => a + b, 0);
  const probs = sims.map(s => s / total);

  return CAREERS.map((c, i) => ({
    name:  c.name,
    color: c.color,
    prob:  probs[i]
  })).sort((a, b) => b.prob - a.prob);
}

// ── Main predict function ─────────────────────────────────────────
function predict() {
  const profile = {
    math:       parseInt(document.getElementById('math').value),
    physics:    parseInt(document.getElementById('physics').value),
    chemistry:  parseInt(document.getElementById('chemistry').value),
    biology:    parseInt(document.getElementById('biology').value),
    english:    parseInt(document.getElementById('english').value),
    attendance: parseInt(document.getElementById('attendance').value),
    focus:      parseInt(document.getElementById('focus').value),
    skill:      parseInt(document.getElementById('skill').value),
    sport:      parseInt(document.getElementById('sport').value),
  };

  const results = scoreProfile(profile);

  // Show results panel
  document.getElementById('results-placeholder').style.display = 'none';
  const panel = document.getElementById('results-panel');
  panel.style.display = 'block';

  // Top match
  document.getElementById('top-match-label').textContent = results[0].name;

  // Build bars
  const container = document.getElementById('bars-container');
  container.innerHTML = '';
  results.forEach((r, i) => {
    const pct = (r.prob * 100).toFixed(1);
    const div = document.createElement('div');
    div.className = 'result-bar';
    div.style.animationDelay = (i * 0.07) + 's';
    div.innerHTML = `
      <div class="bar-meta">
        <span class="bar-name">${r.name}</span>
        <span class="bar-pct" style="color:${r.color}">${pct}%</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:0%;background:${r.color}" data-width="${pct}"></div>
      </div>`;
    container.appendChild(div);
  });

  // Animate bars after paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
    });
  });

  // Reasoning note
  const top = results[0];
  const notes = {
    'Sports Analytics':           'Your high Math combined with strong sport skill makes Sports Analytics a natural fit — you can bridge the gap between numbers and the field.',
    'Data Science / Engineering': 'Exceptional Math and Physics marks are the strongest signal for a Data Science future. Your analytical mindset is your superpower.',
    'Medicine / Research':        'Strong Biology and Chemistry with excellent attendance shows the discipline and scientific aptitude that defines successful doctors and researchers.',
    'Professional Athlete':       'Your sport skill level is elite-tier. Combined with your active sport involvement, a professional sports career is a realistic and exciting path.',
    'Arts & Humanities':          'Your strong English marks and creative focus duration point toward a career in writing, journalism, design, or cultural studies.',
    'Business / Management':      'Balanced academics with strong English communication skills — the classic profile for leadership, management, and entrepreneurship.',
  };
  document.getElementById('results-note').textContent = notes[top.name] || '';
}

// ── Scroll reveal ─────────────────────────────────────────────────
const revealEls = document.querySelectorAll('.step-card, .career-card, .how, .careers');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.step-card, .career-card').forEach(el => {
  el.classList.add('reveal');
  observer.observe(el);
});

// ── Active nav highlight on scroll ───────────────────────────────
window.addEventListener('scroll', () => {
  const sections = ['hero','how','predictor','careers'];
  const scrollY = window.scrollY + 120;
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const link = document.querySelector(`.nav-links a[href="#${id}"]`);
    if (!link) return;
    const inSection = scrollY >= el.offsetTop && scrollY < el.offsetTop + el.offsetHeight;
    link.style.color = inSection ? '#f0f0f8' : '';
  });
});

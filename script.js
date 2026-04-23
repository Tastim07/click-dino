const stages = [
  {
    name: 'Dino Egg',
    threshold: 0,
    nextThreshold: 20,
    image: 'assets/stage-0.svg',
    alt: 'Cute dinosaur egg',
    description: 'A tiny speckled egg waiting for your first tap.'
  },
  {
    name: 'Baby Dino',
    threshold: 20,
    nextThreshold: 60,
    image: 'assets/stage-1.svg',
    alt: 'Cute baby dinosaur',
    description: 'A chubby little dino with bright eyes and tiny stomps.'
  },
  {
    name: 'Playful Dino',
    threshold: 60,
    nextThreshold: 120,
    image: 'assets/stage-2.svg',
    alt: 'Playful cartoon dinosaur',
    description: 'Now it is cheerful, bouncy, and ready to do bigger chomps.'
  },
  {
    name: 'Happy Rex',
    threshold: 120,
    nextThreshold: 220,
    image: 'assets/stage-3.svg',
    alt: 'Happy cartoon tyrannosaurus',
    description: 'A proud dino with sparkly charm and extra bounce.'
  },
  {
    name: 'Crownasaur',
    threshold: 220,
    nextThreshold: null,
    image: 'assets/stage-4.svg',
    alt: 'Crowned cartoon dinosaur king',
    description: 'The cutest dino ruler has arrived. Maximum adorable power.'
  }
];

let score = 0;
let currentStageIndex = 0;
let soundEnabled = true;

const scoreValue = document.getElementById('scoreValue');
const stageName = document.getElementById('stageName');
const stageHeading = document.getElementById('stageHeading');
const stageDescription = document.getElementById('stageDescription');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const dinoImage = document.getElementById('dinoImage');
const dinoButton = document.getElementById('dinoButton');
const floatingLayer = document.getElementById('floatingLayer');
const arena = document.getElementById('arena');
const effectBurst = document.getElementById('effectBurst');
const evolveBanner = document.getElementById('evolveBanner');
const soundToggle = document.getElementById('soundToggle');

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getStageIndexByScore(value) {
  let index = 0;
  for (let i = 0; i < stages.length; i += 1) {
    if (value >= stages[i].threshold) index = i;
  }
  return index;
}

function updateUI() {
  const stage = stages[currentStageIndex];
  scoreValue.textContent = score;
  stageName.textContent = stage.name;
  stageHeading.textContent = stage.name;
  stageDescription.textContent = stage.description;
  dinoImage.src = stage.image;
  dinoImage.alt = stage.alt;

  if (stage.nextThreshold === null) {
    progressText.textContent = 'MAX';
    progressFill.style.width = '100%';
  } else {
    const current = score - stage.threshold;
    const total = stage.nextThreshold - stage.threshold;
    const progress = clamp((current / total) * 100, 0, 100);
    progressText.textContent = `${score} / ${stage.nextThreshold}`;
    progressFill.style.width = `${progress}%`;
  }
}

function spawnFloatText(text, x, y, isCrit = false) {
  const el = document.createElement('div');
  el.className = `floaty${isCrit ? ' crit' : ''}`;
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  floatingLayer.appendChild(el);
  window.setTimeout(() => el.remove(), 900);
}

function triggerBurst() {
  effectBurst.classList.remove('active');
  void effectBurst.offsetWidth;
  effectBurst.classList.add('active');
}

function triggerShake() {
  arena.classList.remove('shake');
  void arena.offsetWidth;
  arena.classList.add('shake');
}

function showEvolutionBanner(name) {
  evolveBanner.innerHTML = `<span>✨ Evolved into ${name}! ✨</span>`;
  window.setTimeout(() => {
    evolveBanner.innerHTML = '';
  }, 1800);
}

function playTone(freq, duration, type = 'sine', gainValue = 0.03) {
  if (!soundEnabled) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!playTone.ctx) playTone.ctx = new AudioContextClass();
  const ctx = playTone.ctx;
  if (ctx.state === 'suspended') ctx.resume();

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = freq;
  gain.gain.value = gainValue;
  oscillator.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playTapSound(isCrit) {
  if (isCrit) {
    playTone(620, 0.12, 'square', 0.045);
    window.setTimeout(() => playTone(840, 0.16, 'triangle', 0.03), 40);
  } else {
    playTone(380, 0.08, 'sine', 0.028);
  }
}

function playEvolutionSound() {
  [520, 660, 820].forEach((freq, index) => {
    window.setTimeout(() => playTone(freq, 0.14, 'triangle', 0.034), index * 90);
  });
}

function tapDino(event) {
  const rect = arena.getBoundingClientRect();
  const pointX = event.clientX ? event.clientX - rect.left : rect.width / 2;
  const pointY = event.clientY ? event.clientY - rect.top : rect.height / 2;
  const isCrit = Math.random() < 0.10;
  const gain = isCrit ? 10 : 1;

  score += gain;
  playTapSound(isCrit);
  triggerBurst();
  if (isCrit) triggerShake();
  spawnFloatText(isCrit ? `MEGA CHOMP! +${gain}` : `+${gain}`, pointX, pointY, isCrit);

  const newStageIndex = getStageIndexByScore(score);
  if (newStageIndex !== currentStageIndex) {
    currentStageIndex = newStageIndex;
    showEvolutionBanner(stages[currentStageIndex].name);
    playEvolutionSound();
  }

  dinoButton.classList.add('pressed');
  window.setTimeout(() => dinoButton.classList.remove('pressed'), 130);
  updateUI();
}

function setSoundButtonText() {
  soundToggle.textContent = soundEnabled ? '🔊 Sound On' : '🔈 Sound Off';
  soundToggle.setAttribute('aria-pressed', String(soundEnabled));
}

soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  setSoundButtonText();
});

dinoButton.addEventListener('click', tapDino);
dinoButton.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    tapDino({ clientX: 0, clientY: 0 });
  }
});

updateUI();
setSoundButtonText();

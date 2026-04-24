const stages = [
  {
    name: '恐龍蛋',
    threshold: 0,
    nextThreshold: 20,
    image: 'assets/egg-0.svg',
    alt: '可愛恐龍蛋',
    description: '一隻圓滾滾的蛋，已經開始有點震動了。'
  },
  {
    name: '小小恐龍',
    threshold: 20,
    nextThreshold: 60,
    image: 'assets/stage-1.svg',
    alt: '剛孵化的小恐龍',
    description: '終於孵出來了！短短手、圓圓肚，看起來超可愛。'
  },
  {
    name: '活力小恐龍',
    threshold: 60,
    nextThreshold: 120,
    image: 'assets/stage-2.svg',
    alt: '充滿活力的卡通恐龍',
    description: '背上長出小尖刺，尾巴也更有精神，看起來更像真正的小恐龍。'
  },
  {
    name: '開心暴龍',
    threshold: 120,
    nextThreshold: 220,
    image: 'assets/stage-3.svg',
    alt: '開心暴龍',
    description: '嘴巴更大、爪子更明顯，已經是很有氣勢的暴龍寶寶了。'
  },
  {
    name: '皇冠恐龍王',
    threshold: 220,
    nextThreshold: null,
    image: 'assets/stage-4.svg',
    alt: '戴皇冠的恐龍王',
    description: '最終進化完成！皇冠、尖刺、尾巴和霸氣表情都到位。'
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

function getEggImageByProgress(value) {
  if (value < 7) return 'assets/egg-0.svg';
  if (value < 14) return 'assets/egg-1.svg';
  return 'assets/egg-2.svg';
}

function updateUI() {
  const stage = stages[currentStageIndex];
  scoreValue.textContent = score;
  stageName.textContent = stage.name;
  stageHeading.textContent = stage.name;
  stageDescription.textContent = stage.description;

  if (currentStageIndex === 0) {
    dinoImage.src = getEggImageByProgress(score);
    dinoImage.alt = stage.alt;
  } else {
    dinoImage.src = stage.image;
    dinoImage.alt = stage.alt;
  }

  if (stage.nextThreshold === null) {
    progressText.textContent = '已達最終形態';
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
  evolveBanner.innerHTML = `<span>✨ 進化成 ${name}！✨</span>`;
  window.setTimeout(() => {
    evolveBanner.innerHTML = '';
  }, 1800);
}

function getAudioContext() {
  if (!soundEnabled) return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!getAudioContext.ctx) getAudioContext.ctx = new AudioContextClass();
  const ctx = getAudioContext.ctx;
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playToneSequence(notes, wave = 'triangle', gainValue = 0.03) {
  const ctx = getAudioContext();
  if (!ctx) return;
  notes.forEach((note) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = note.type || wave;
    oscillator.frequency.setValueAtTime(note.freq, ctx.currentTime + note.delay);
    gain.gain.setValueAtTime(gainValue * (note.gain || 1), ctx.currentTime + note.delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + note.delay + note.duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime + note.delay);
    oscillator.stop(ctx.currentTime + note.delay + note.duration);
  });
}

function playTapSound(isCrit) {
  if (isCrit) {
    const critSounds = [
      [
        { freq: 520, delay: 0, duration: 0.08, gain: 1.2, type: 'square' },
        { freq: 760, delay: 0.04, duration: 0.12, gain: 1.1, type: 'triangle' },
        { freq: 980, delay: 0.10, duration: 0.10, gain: 0.8, type: 'triangle' }
      ],
      [
        { freq: 430, delay: 0, duration: 0.06, gain: 1.1, type: 'square' },
        { freq: 640, delay: 0.03, duration: 0.08, gain: 1.2, type: 'square' },
        { freq: 930, delay: 0.08, duration: 0.13, gain: 0.9, type: 'triangle' }
      ]
    ];
    playToneSequence(critSounds[Math.floor(Math.random() * critSounds.length)], 'square', 0.04);
    return;
  }

  const tapSounds = [
    [
      { freq: 340, delay: 0, duration: 0.05, gain: 1, type: 'sine' },
      { freq: 410, delay: 0.03, duration: 0.05, gain: 0.7, type: 'triangle' }
    ],
    [
      { freq: 300, delay: 0, duration: 0.04, gain: 0.9, type: 'triangle' },
      { freq: 360, delay: 0.02, duration: 0.05, gain: 0.8, type: 'sine' }
    ],
    [
      { freq: 390, delay: 0, duration: 0.05, gain: 0.9, type: 'sine' },
      { freq: 470, delay: 0.025, duration: 0.05, gain: 0.7, type: 'triangle' }
    ],
    [
      { freq: 280, delay: 0, duration: 0.05, gain: 1, type: 'triangle' },
      { freq: 350, delay: 0.018, duration: 0.04, gain: 0.7, type: 'sine' }
    ]
  ];
  playToneSequence(tapSounds[Math.floor(Math.random() * tapSounds.length)], 'triangle', 0.032);
}

function playEvolutionSound() {
  playToneSequence([
    { freq: 520, delay: 0, duration: 0.12, gain: 1, type: 'triangle' },
    { freq: 660, delay: 0.09, duration: 0.14, gain: 1, type: 'triangle' },
    { freq: 820, delay: 0.18, duration: 0.18, gain: 1.05, type: 'triangle' }
  ], 'triangle', 0.038);
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
  spawnFloatText(isCrit ? `爆擊！+${gain}` : `+${gain}`, pointX, pointY, isCrit);

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
  soundToggle.textContent = soundEnabled ? '🔊 聲音：開' : '🔈 聲音：關';
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

const CRIT_RATE = 0.05;
const CRIT_GAIN = 8;

const stages = [
  { name: '恐龍蛋', threshold: 0, nextThreshold: 60, image: 'assets/egg-0.svg', alt: '恐龍蛋', description: '蛋殼好完整，但入面好似郁緊。繼續點擊，裂紋會愈來愈多。' },
  { name: '初生小恐龍', threshold: 60, nextThreshold: 160, image: 'assets/stage-1.svg', alt: '初生小恐龍', description: '小恐龍孵出嚟啦！大眼、短手、長尾巴，開始識得叫。' },
  { name: '活力小恐龍', threshold: 160, nextThreshold: 320, image: 'assets/stage-2.svg', alt: '活力小恐龍', description: '身體變大，背上長出小尖刺，尾巴更有力。' },
  { name: '開心暴龍', threshold: 320, nextThreshold: 550, image: 'assets/stage-3.svg', alt: '開心暴龍', description: '嘴巴、牙仔同爪仔更明顯，開始有暴龍感。' },
  { name: '皇冠恐龍王', threshold: 550, nextThreshold: null, image: 'assets/stage-4.svg', alt: '皇冠恐龍王', description: '最終進化完成！戴住皇冠嘅可愛恐龍王登場。' }
];

let score = 0;
let currentStageIndex = 0;
let soundEnabled = true;
let tapSoundIndex = 0;

const $ = (id) => document.getElementById(id);
const scoreValue = $('scoreValue');
const stageName = $('stageName');
const stageHeading = $('stageHeading');
const stageDescription = $('stageDescription');
const progressText = $('progressText');
const progressFill = $('progressFill');
const dinoImage = $('dinoImage');
const dinoButton = $('dinoButton');
const floatingLayer = $('floatingLayer');
const arena = $('arena');
const effectBurst = $('effectBurst');
const evolveBanner = $('evolveBanner');
const soundToggle = $('soundToggle');

function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }

function getStageIndexByScore(value) {
  let index = 0;
  for (let i = 0; i < stages.length; i += 1) if (value >= stages[i].threshold) index = i;
  return index;
}

function getEggImageByProgress(value) {
  const progress = clamp(value / stages[0].nextThreshold, 0, 0.999);
  const eggIndex = Math.floor(progress * 6);
  return `assets/egg-${eggIndex}.svg`;
}

function updateUI() {
  const stage = stages[currentStageIndex];
  scoreValue.textContent = score;
  stageName.textContent = stage.name;
  stageHeading.textContent = stage.name;
  stageDescription.textContent = stage.description;

  if (currentStageIndex === 0) {
    dinoImage.src = getEggImageByProgress(score);
    dinoImage.alt = '逐漸裂開的恐龍蛋';
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
  setTimeout(() => el.remove(), 950);
}

function triggerBurst(isCrit = false) {
  effectBurst.className = `effect-burst active${isCrit ? ' crit' : ''}`;
  setTimeout(() => effectBurst.className = 'effect-burst', 360);
}

function triggerShake() {
  arena.classList.remove('shake');
  void arena.offsetWidth;
  arena.classList.add('shake');
}

function showEvolutionBanner(name) {
  evolveBanner.innerHTML = `<span>✨ 進化：${name}！✨</span>`;
  setTimeout(() => { evolveBanner.innerHTML = ''; }, 1800);
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

function tone(freq, start, duration, type = 'sine', gainValue = 0.06) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, ctx.currentTime + start);
  gain.gain.setValueAtTime(gainValue, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(ctx.currentTime + start);
  oscillator.stop(ctx.currentTime + start + duration);
}

function chirp(notes, gain = 0.055) {
  notes.forEach(n => tone(n[0], n[1], n[2], n[3] || 'sine', n[4] || gain));
}

function playTapSound(isCrit) {
  if (isCrit) {
    chirp([[420,0,0.05,'square',0.07],[720,0.04,0.09,'triangle',0.075],[1020,0.12,0.12,'sine',0.06]]);
    return;
  }
  const sounds = [
    [[260,0,0.045,'triangle'],[390,0.035,0.055,'sine']],       // pok
    [[360,0,0.035,'square',0.04],[300,0.025,0.055,'triangle']], // tap
    [[520,0,0.04,'sine'],[620,0.035,0.05,'sine']],              // piu
    [[230,0,0.055,'triangle'],[330,0.04,0.055,'triangle']],     // bonk
    [[450,0,0.035,'square',0.035],[680,0.03,0.05,'triangle']],  // squeak
    [[310,0,0.04,'sine'],[470,0.03,0.06,'sine']]                // pop
  ];
  chirp(sounds[tapSoundIndex % sounds.length]);
  tapSoundIndex += 1;
}

function playCrackOrRoar() {
  if (currentStageIndex === 0) {
    chirp([[160,0,0.035,'square',0.035],[120,0.035,0.04,'square',0.028],[250,0.07,0.035,'triangle',0.035]]);
  } else {
    chirp([[180,0,0.08,'sawtooth',0.045],[240,0.07,0.08,'triangle',0.04]]);
  }
}

function playEvolutionSound() {
  chirp([[520,0,0.1,'triangle',0.06],[660,0.08,0.12,'triangle',0.06],[880,0.18,0.16,'sine',0.065]]);
}

function tapDino(event) {
  const rect = arena.getBoundingClientRect();
  const pointX = event.clientX ? event.clientX - rect.left : rect.width / 2;
  const pointY = event.clientY ? event.clientY - rect.top : rect.height / 2;
  const isCrit = Math.random() < CRIT_RATE;
  const gain = isCrit ? CRIT_GAIN : 1;
  const beforeEggImage = currentStageIndex === 0 ? getEggImageByProgress(score) : '';

  score += gain;
  playTapSound(isCrit);

  const newStageIndex = getStageIndexByScore(score);
  const afterEggImage = newStageIndex === 0 ? getEggImageByProgress(score) : '';
  if (currentStageIndex === 0 && beforeEggImage !== afterEggImage) playCrackOrRoar();

  if (newStageIndex !== currentStageIndex) {
    currentStageIndex = newStageIndex;
    showEvolutionBanner(stages[currentStageIndex].name);
    playEvolutionSound();
  }

  triggerBurst(isCrit);
  if (isCrit) triggerShake();
  spawnFloatText(isCrit ? `爆擊！+${gain}` : `+${gain}`, pointX, pointY, isCrit);

  dinoButton.classList.add('pressed');
  setTimeout(() => dinoButton.classList.remove('pressed'), 130);
  updateUI();
}

function setSoundButtonText() {
  soundToggle.textContent = soundEnabled ? '🔊 聲音：開' : '🔈 聲音：關';
  soundToggle.setAttribute('aria-pressed', String(soundEnabled));
}

soundToggle.addEventListener('click', () => { soundEnabled = !soundEnabled; setSoundButtonText(); });
dinoButton.addEventListener('click', tapDino);
dinoButton.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); tapDino({ clientX: 0, clientY: 0 }); }
});

updateUI();
setSoundButtonText();

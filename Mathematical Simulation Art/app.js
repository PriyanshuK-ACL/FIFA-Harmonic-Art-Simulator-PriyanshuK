const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d');

let isRunning = false;
let animationFrameId = null;
let t = 0;
let activeHueOffset = 180;

// World Cup 2026 Match Momentum Timelines mapped to Harmonograph Math
const matchPresets = {
"final": { f1: 2.85, p1: 0.20, f2: 2.82, p2: 1.57, f3: 4.10, damp: 0.0003, hue: 45 }, // Spain vs Argentina (Tactical, tense extra time)
"third": { f1: 5.20, p1: 1.10, f2: 5.15, p2: 0.80, f3: 6.40, damp: 0.0006, hue: 200 }, // England vs France (10-goal high frequency frenzy)
"capeverde": { f1: 3.80, p1: 0.90, f2: 2.40, p2: 1.20, f3: 3.50, damp: 0.0005, hue: 320 },// Cape Verde vs Argentina (Underdog high momentum shifts)
"semifinal": { f1: 3.10, p1: 0.50, f2: 3.05, p2: 1.57, f3: 4.00, damp: 0.0008, hue: 140 },// England vs Argentina (Tight comeback swing)
"r16_mexico": { f1: 4.10, p1: 0.10, f2: 3.90, p2: 0.90, f3: 5.10, damp: 0.0007, hue: 280 } // Mexico vs England (Red card momentum shockwave)
};

const controls = {
f1: 2.85, p1: 0.20, f2: 2.82, p2: 1.57, f3: 4.10, damp: 0.0003
};

function applyMatchPreset(matchKey) {
if (!matchPresets[matchKey]) return;
const data = matchPresets[matchKey];
activeHueOffset = data.hue;

document.getElementById('f1').value = data.f1;
document.getElementById('p1').value = data.p1;
document.getElementById('f2').value = data.f2;
document.getElementById('p2').value = data.p2;
document.getElementById('f3').value = data.f3;
document.getElementById('damp').value = data.damp;

updateConfigValues();
t = 0;
start();
}
window.applyMatchPreset = applyMatchPreset;

function updateConfigValues() {
const keys = ['f1', 'p1', 'f2', 'p2', 'f3', 'damp'];
keys.forEach(key => {
const element = document.getElementById(key);
if (element) {
controls[key] = parseFloat(element.value);
const valDisplay = document.getElementById(key + '-val');
if (valDisplay) {
if(key === 'damp') valDisplay.innerText = controls[key].toFixed(4);
else if(key === 'p1' || key === 'p2') valDisplay.innerText = controls[key].toFixed(2) + " rad";
else valDisplay.innerText = controls[key].toFixed(2) + " Hz";
}
}
});
}

function renderLoop() {
if (!isRunning) return;

const currentHue = (activeHueOffset + (t * 3)) % 360;
ctx.strokeStyle = `hsla(${currentHue}, 85%, 65%, 0.4)`;
ctx.lineWidth = 1.2;
ctx.globalCompositeOperation = 'screen';

// Step loop creates rich, continuous match momentum curves
for (let i = 0; i < 60; i++) {
const decay = Math.exp(-controls.damp * t);
const p1_x = canvas.width/2 + (220 * Math.sin(t * controls.f1 + controls.p1) + 90 * Math.sin(t * controls.f3)) * decay;
const p1_y = canvas.height/2 + (220 * Math.sin(t * controls.f2 + controls.p2) + 90 * Math.cos(t * controls.f3)) * decay;
t += 0.008;
const decay2 = Math.exp(-controls.damp * t);
const p2_x = canvas.width/2 + (220 * Math.sin(t * controls.f1 + controls.p1) + 90 * Math.sin(t * controls.f3)) * decay2;
const p2_y = canvas.height/2 + (220 * Math.sin(t * controls.f2 + controls.p2) + 90 * Math.cos(t * controls.f3)) * decay2;

ctx.beginPath();
ctx.moveTo(p1_x, p1_y);
ctx.lineTo(p2_x, p2_y);
ctx.stroke();
}

animationFrameId = window.requestAnimationFrame(renderLoop);
}

function start() {
if (animationFrameId) window.cancelAnimationFrame(animationFrameId);

isRunning = true;
document.getElementById('start-btn').innerText = "Replay Match Trace";
document.getElementById('pause-btn').innerText = "Pause";

ctx.globalCompositeOperation = 'source-over';
ctx.fillStyle = '#040406';
ctx.fillRect(0, 0, canvas.width, canvas.height);

renderLoop();
}

function stop() {
isRunning = false;
if (animationFrameId) {
window.cancelAnimationFrame(animationFrameId);
animationFrameId = null;
}
}

document.getElementById('start-btn').addEventListener('click', () => { t = 0; start(); });
document.getElementById('pause-btn').addEventListener('click', () => {
if (isRunning) { stop(); document.getElementById('pause-btn').innerText = "Resume"; }
else { isRunning = true; renderLoop(); document.getElementById('pause-btn').innerText = "Pause"; }
});

document.querySelectorAll('input[type="range"]').forEach(input => {
input.addEventListener('input', () => {
updateConfigValues();
});
});

updateConfigValues();
applyMatchPreset('final');
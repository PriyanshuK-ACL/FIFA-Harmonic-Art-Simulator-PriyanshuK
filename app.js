const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d');

let isRunning = false;
let animationFrameId = null;
let currentMinute = 0;
let t = 0;
let currentMatchKey = 'final';
let simSpeed = 1.0;

// JSON Data Store for the 5 Matches
// Structure: { minute: Number, home: Number (10-100), away: Number (10-100), event: String }
const matchData = {
"final": {
title: "Spain vs Argentina",
baseRatio: { fx: 2.0, fy: 3.0 },
timeline: [
{ minute: 0, home: 50, away: 50, event: "Kick-off" },
{ minute: 15, home: 65, away: 35, event: "" },
{ minute: 30, home: 40, away: 60, event: "" },
{ minute: 45, home: 50, away: 50, event: "Half Time" },
{ minute: 60, home: 70, away: 30, event: "" },
{ minute: 75, home: 35, away: 65, event: "" },
{ minute: 90, home: 50, away: 50, event: "Full Time — Extra Time" },
{ minute: 105, home: 80, away: 20, event: "Spain pressing hard" },
{ minute: 115, home: 95, away: 10, event: "⚽ GOAL! Spain scores in ET!" },
{ minute: 120, home: 60, away: 40, event: "Final Whistle" }
]
},
"third": {
title: "England vs France",
baseRatio: { fx: 3.0, fy: 4.0 },
timeline: [
{ minute: 0, home: 50, away: 50, event: "Kick-off" },
{ minute: 12, home: 85, away: 15, event: "⚽ GOAL! England early strike" },
{ minute: 28, home: 15, away: 85, event: "⚽ GOAL! France equalizer" },
{ minute: 41, home: 90, away: 10, event: "⚽ GOAL! England retakes lead" },
{ minute: 55, home: 20, away: 80, event: "⚽ GOAL! France levels again" },
{ minute: 68, home: 85, away: 15, event: "⚽ GOAL! England score!" },
{ minute: 82, home: 10, away: 90, event: "⚽ GOAL! France 4th goal!" },
{ minute: 89, home: 95, away: 5, event: "⚽ GOAL! England seals 6-4 win!" },
{ minute: 90, home: 50, away: 50, event: "Full Time — 10 Goal Thriller" }
]
},
"capeverde": {
title: "Argentina vs Cape Verde",
baseRatio: { fx: 2.0, fy: 2.0 },
timeline: [
{ minute: 0, home: 60, away: 40, event: "Kick-off" },
{ minute: 20, home: 75, away: 25, event: "Argentina dominating" },
{ minute: 45, home: 50, away: 50, event: "Half Time" },
{ minute: 65, home: 15, away: 85, event: "🔥 Underdog surge from Cape Verde!" },
{ minute: 80, home: 30, away: 70, event: "Cape Verde pushes hard" },
{ minute: 90, home: 50, away: 50, event: "Full Time — Extra Time" },
{ minute: 105, home: 20, away: 80, event: "Cape Verde pressure in ET" },
{ minute: 118, home: 90, away: 10, event: "⚽ GOAL! Argentina late winner!" },
{ minute: 120, home: 50, away: 50, event: "Full Time" }
]
},
"semifinal": {
title: "England vs Argentina",
baseRatio: { fx: 3.0, fy: 2.0 },
timeline: [
{ minute: 0, home: 50, away: 50, event: "Kick-off" },
{ minute: 25, home: 75, away: 25, event: "England controlling midfield" },
{ minute: 50, home: 60, away: 40, event: "" },
{ minute: 78, home: 15, away: 85, event: "⚽ Argentina equalizer!" },
{ minute: 88, home: 10, away: 90, event: "⚽ Argentina comeback winner!" },
{ minute: 90, home: 40, away: 60, event: "Full Time" }
]
},
"r16_mexico": {
title: "Mexico vs England",
baseRatio: { fx: 4.0, fy: 3.0 },
timeline: [
{ minute: 0, home: 55, away: 45, event: "Kick-off" },
{ minute: 20, home: 70, away: 30, event: "Mexico strong start" },
{ minute: 35, home: 10, away: 90, event: "🟥 RED CARD! Mexico down to 10 men!" },
{ minute: 60, home: 20, away: 80, event: "England capitalizing on advantage" },
{ minute: 85, home: 25, away: 75, event: "England sealing victory" },
{ minute: 90, home: 30, away: 70, event: "Full Time" }
]
}
};

// Interpolates missing minute data linearly if keyframes are spaced apart
function getInterpolatedData(timeline, currentMin) {
if (currentMin <= timeline[0].minute) return timeline[0];
if (currentMin >= timeline[timeline.length - 1].minute) return timeline[timeline.length - 1];

for (let i = 0; i < timeline.length - 1; i++) {
const start = timeline[i];
const end = timeline[i + 1];
if (currentMin >= start.minute && currentMin <= end.minute) {
const factor = (currentMin - start.minute) / (end.minute - start.minute);
return {
minute: Math.round(currentMin),
home: Math.round(start.home + (end.home - start.home) * factor),
away: Math.round(start.away + (end.away - start.away) * factor),
event: (factor < 0.1) ? start.event : ((factor > 0.9) ? end.event : "")
};
}
}
return timeline[0];
}

// Speed slider listener
const speedSlider = document.getElementById('speed-slider');
if (speedSlider) {
speedSlider.addEventListener('input', (e) => {
simSpeed = parseFloat(e.target.value);
document.getElementById('speed-val').innerText = `${simSpeed.toFixed(1)}x`;
});
}

function loadAndPlayMatch(key) {
currentMatchKey = key;
currentMinute = 0;
t = 0;
document.getElementById('match-title').innerText = matchData[key].title;
start();
}
window.loadAndPlayMatch = loadAndPlayMatch;

function updateTelemetryUI(frameData) {
document.getElementById('match-minute').innerText = `${String(frameData.minute).padStart(2, '0')}'`;
document.getElementById('home-val').innerText = `${frameData.home}%`;
document.getElementById('away-val').innerText = `${frameData.away}%`;
document.getElementById('home-bar').style.width = `${frameData.home}%`;
document.getElementById('away-bar').style.width = `${frameData.away}%`;

if (frameData.event) {
document.getElementById('match-event-text').innerText = frameData.event;
}
}

function renderLoop() {
if (!isRunning) return;

const match = matchData[currentMatchKey];
const frameData = getInterpolatedData(match.timeline, currentMinute);

updateTelemetryUI(frameData);

const fx = match.baseRatio.fx;
const fy = match.baseRatio.fy;

const Ax = 120 + (frameData.home / 100) * 160;
const Ay = 120 + (frameData.away / 100) * 160;

const phaseShift = (frameData.home - frameData.away) * 0.015;

const hue = (180 + (currentMinute * 2.5)) % 360;
ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.35)`;
ctx.lineWidth = 1.2;
ctx.globalCompositeOperation = 'screen';

const steps = Math.round(40 * simSpeed);
for (let i = 0; i < steps; i++) {
const decay = Math.exp(-0.00015 * t);

const x1 = canvas.width / 2 + Ax * Math.sin(t * fx + phaseShift) * decay;
const y1 = canvas.height / 2 + Ay * Math.sin(t * fy) * decay;

t += 0.006;

const x2 = canvas.width / 2 + Ax * Math.sin(t * fx + phaseShift) * decay;
const y2 = canvas.height / 2 + Ay * Math.sin(t * fy) * decay;

ctx.beginPath();
ctx.moveTo(x1, y1);
ctx.lineTo(x2, y2);
ctx.stroke();
}

currentMinute += 0.18 * simSpeed;

const maxMinute = match.timeline[match.timeline.length - 1].minute;
if (currentMinute <= maxMinute) {
animationFrameId = window.requestAnimationFrame(renderLoop);
} else {
document.getElementById('match-event-text').innerText = "Full Time — Harmonograph Complete!";

}
}

function start() {
if (animationFrameId) window.cancelAnimationFrame(
animationFrameId);

isRunning = true;
document.getElementById('replay-btn').innerText = "Replay Match Trace";
document.getElementById('pause-btn').innerText = "Pause";


ctx.globalCompositeOperation = 'source-over';
ctx.fillStyle = '#030305';
ctx.fillRect(0, 0, canvas.width, canvas.height);

renderLoop();
}

function stop() {
isRunning = false;
if (animationFrameId) {
window.cancelAnimationFrame(
animationFrameId);
animationFrameId = null;
}
}

document.getElementById('replay-btn').addEventListener('click', () => {
currentMinute = 0;
t = 0;
start();
});

document.getElementById('pause-btn').addEventListener('click', () => {
if (isRunning) {
stop();
document.getElementById('pause-btn').innerText = "Resume";
} else {
isRunning = true;
renderLoop();
document.getElementById('pause-btn').innerText = "Pause";
}
});

loadAndPlayMatch('final');
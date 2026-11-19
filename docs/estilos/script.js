(function () {
  'use strict';

  // Datos históricos de espera femenina (Olympedia 1900–2024)
  const SPORTS_DATA = [
    { rank: 1, sport: 'Boxeo', firstMenYear: 1904, firstWomenYear: 2012, waitYears: 108 },
    { rank: 2, sport: 'Lucha', firstMenYear: 1904, firstWomenYear: 2004, waitYears: 100 },
    { rank: 3, sport: 'Fútbol', firstMenYear: 1900, firstWomenYear: 1996, waitYears: 96 },
    { rank: 4, sport: 'Halterofilia', firstMenYear: 1904, firstWomenYear: 2000, waitYears: 96 },
    { rank: 5, sport: 'Pentatlón Moderno', firstMenYear: 1912, firstWomenYear: 2000, waitYears: 88 },
    { rank: 6, sport: 'Ciclismo', firstMenYear: 1900, firstWomenYear: 1984, waitYears: 84 },
    { rank: 7, sport: 'Hockey sobre césped', firstMenYear: 1908, firstWomenYear: 1980, waitYears: 72 },
    { rank: 8, sport: 'Baloncesto', firstMenYear: 1936, firstWomenYear: 1976, waitYears: 40 },
    { rank: 9, sport: 'Balonmano', firstMenYear: 1936, firstWomenYear: 1976, waitYears: 40 },
    { rank: 10, sport: 'Atletismo', firstMenYear: 1900, firstWomenYear: 1928, waitYears: 28 },
    { rank: 11, sport: 'Gimnasia', firstMenYear: 1900, firstWomenYear: 1928, waitYears: 28 },
    { rank: 12, sport: 'Judo', firstMenYear: 1964, firstWomenYear: 1992, waitYears: 28 },
    { rank: 13, sport: 'Esgrima', firstMenYear: 1900, firstWomenYear: 1924, waitYears: 24 },
    { rank: 14, sport: 'Deportes Acuáticos', firstMenYear: 1900, firstWomenYear: 1912, waitYears: 12 },
    { rank: 15, sport: 'Tiro', firstMenYear: 1900, firstWomenYear: 1904, waitYears: 4 }
  ];

  const MAX_WAIT = 108;
  const FIXED_SPEED = 2;

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let isPlaying = !prefersReducedMotion;
  let simValue = prefersReducedMotion ? MAX_WAIT : 0;
  let selectedIndex = -1;
  let lastTimestamp = null;

  const lanesContainer = document.getElementById('lanesContainer');
  const yearCounterEl = document.getElementById('yearCounter');
  const elapsedSubstatEl = document.getElementById('elapsedSubstat');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const playPauseLabel = document.getElementById('playPauseLabel');
  const resetBtn = document.getElementById('resetBtn');
  const scrubber = /** @type {HTMLInputElement} */ (document.getElementById('timeScrubber'));

  const laneNodes = [];

  function createSvgNode(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, val] of Object.entries(attrs)) {
      el.setAttribute(key, val);
    }
    return el;
  }

  function createRunnerSvg() {
    const svg = createSvgNode('svg', {
      viewBox: '0 0 40 40',
      width: '24',
      height: '24',
      'aria-hidden': 'true'
    });

    const backThigh = createSvgNode('line', { stroke: '#1F7A8C', 'stroke-width': '3.8', 'stroke-linecap': 'round' });
    const backCalf = createSvgNode('line', { stroke: '#1F7A8C', 'stroke-width': '3.2', 'stroke-linecap': 'round' });
    const backArm = createSvgNode('line', { stroke: '#FAF7F2', 'stroke-width': '2.8', 'stroke-linecap': 'round' });
    const torso = createSvgNode('polygon', { fill: '#D6336C' });
    const frontThigh = createSvgNode('line', { stroke: '#14213D', 'stroke-width': '3.8', 'stroke-linecap': 'round' });
    const frontCalf = createSvgNode('line', { stroke: '#14213D', 'stroke-width': '3.2', 'stroke-linecap': 'round' });
    const ponytail = createSvgNode('path', { fill: '#14213D' });
    const head = createSvgNode('circle', { r: '3.8', fill: '#14213D' });
    const frontArm = createSvgNode('line', { stroke: '#14213D', 'stroke-width': '3', 'stroke-linecap': 'round' });

    svg.append(backThigh, backCalf, backArm, torso, frontThigh, frontCalf, ponytail, head, frontArm);

    return {
      svg,
      parts: { backThigh, backCalf, backArm, torso, ponytail, head, frontThigh, frontCalf, frontArm }
    };
  }

  function setLine(el, x1, y1, x2, y2) {
    el.setAttribute('x1', String(x1));
    el.setAttribute('y1', String(y1));
    el.setAttribute('x2', String(x2));
    el.setAttribute('y2', String(y2));
  }

  function poseRunner(parts, state, phase) {
    if (state === 'waiting') {
      parts.head.setAttribute('cx', '24');
      parts.head.setAttribute('cy', '17');
      parts.ponytail.setAttribute('d', 'M20.5,16 Q16,14 14,18 Q17,18 20.5,17 Z');
      parts.torso.setAttribute('points', '16,25 22,19 25,21 19,27');
      setLine(parts.frontThigh, 18, 26, 23, 30);
      setLine(parts.frontCalf, 23, 30, 20, 36);
      setLine(parts.backThigh, 17, 26, 13, 31);
      setLine(parts.backCalf, 13, 31, 9, 36);
      setLine(parts.frontArm, 23, 20, 27, 34);
      setLine(parts.backArm, 22, 20, 15, 23);
      return;
    }

    if (state === 'finished') {
      const sway = Math.sin(phase * 0.4) * 0.6;
      parts.head.setAttribute('cx', '20');
      parts.head.setAttribute('cy', String(9 + sway));
      parts.ponytail.setAttribute('d', `M16.5,${8.5 + sway} Q12,${7 + sway} 10,${11 + sway} Q13.5,${11 + sway} 16.5,${10 + sway} Z`);
      parts.torso.setAttribute('points', `17,${23 + sway} 18,${13 + sway} 23,${13 + sway} 22,${23 + sway}`);
      setLine(parts.frontThigh, 21, 23 + sway, 24, 30);
      setLine(parts.frontCalf, 24, 30, 24, 37);
      setLine(parts.backThigh, 18, 23 + sway, 15, 30);
      setLine(parts.backCalf, 15, 30, 15, 37);
      setLine(parts.frontArm, 22, 14 + sway, 28, 6 + sway);
      setLine(parts.backArm, 18, 14 + sway, 12, 6 + sway);
      return;
    }

    const stride = Math.sin(phase);
    const oppStride = Math.sin(phase + Math.PI);
    const bob = Math.abs(Math.cos(phase)) * -1.8;

    const hipX = 18;
    const hipY = 23 + bob;
    const shoulderX = 22;
    const shoulderY = 13 + bob;

    parts.head.setAttribute('cx', '24');
    parts.head.setAttribute('cy', String(8 + bob));
    parts.ponytail.setAttribute(
      'd',
      `M20.5,${7 + bob} Q14,${5 + bob - stride * 1.5} 11,${9 + bob + stride * 1.5} Q16,${10 + bob} 20.5,${9 + bob} Z`
    );
    parts.torso.setAttribute(
      'points',
      `${hipX - 2},${hipY} ${shoulderX - 2.5},${shoulderY} ${shoulderX + 2.5},${shoulderY} ${hipX + 2},${hipY}`
    );

    const fKneeX = hipX + stride * 6.5 + 1.5;
    const fKneeY = hipY + 6.5 - Math.max(0, stride) * 2.5;
    const fFootX = fKneeX + Math.sin(phase - 0.8) * 5 - 1;
    const fFootY = Math.min(37, fKneeY + 7.2 - Math.max(0, -stride) * 2);
    setLine(parts.frontThigh, hipX, hipY, fKneeX.toFixed(1), fKneeY.toFixed(1));
    setLine(parts.frontCalf, fKneeX.toFixed(1), fKneeY.toFixed(1), fFootX.toFixed(1), fFootY.toFixed(1));

    const bKneeX = hipX + oppStride * 6.5 + 1.5;
    const bKneeY = hipY + 6.5 - Math.max(0, oppStride) * 2.5;
    const bFootX = bKneeX + Math.sin(phase + Math.PI - 0.8) * 5 - 1;
    const bFootY = Math.min(37, bKneeY + 7.2 - Math.max(0, -oppStride) * 2);
    setLine(parts.backThigh, hipX, hipY, bKneeX.toFixed(1), bKneeY.toFixed(1));
    setLine(parts.backCalf, bKneeX.toFixed(1), bKneeY.toFixed(1), bFootX.toFixed(1), bFootY.toFixed(1));

    setLine(parts.frontArm, shoulderX, shoulderY, (shoulderX + oppStride * 6 + 2).toFixed(1), (shoulderY + 6 - oppStride * 2.5).toFixed(1));
    setLine(parts.backArm, shoulderX, shoulderY, (shoulderX + stride * 6 + 1).toFixed(1), (shoulderY + 6 - stride * 2.5).toFixed(1));
  }

  function selectLane(index) {
    selectedIndex = selectedIndex === index ? -1 : index;
    laneNodes.forEach((node, i) => {
      node.row.classList.toggle('is-selected', i === selectedIndex);
    });
  }

  function initTrackLanes() {
    lanesContainer.innerHTML = '';
    laneNodes.length = 0;

    SPORTS_DATA.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'lane-row';
      row.setAttribute('role', 'listitem');
      row.setAttribute('tabindex', '0');
      row.setAttribute('aria-label', `${item.sport}: ${item.waitYears} años de espera (${item.firstMenYear} a ${item.firstWomenYear})`);

      const sportCol = document.createElement('div');
      sportCol.className = 'lane-sport';
      const numSpan = document.createElement('span');
      numSpan.className = 'lane-num';
      numSpan.textContent = String(item.rank).padStart(2, '0');
      const nameSpan = document.createElement('span');
      nameSpan.className = 'lane-name';
      nameSpan.textContent = item.sport;
      sportCol.append(numSpan, nameSpan);

      const trackCol = document.createElement('div');
      trackCol.className = 'lane-track';

      const dashLine = document.createElement('div');
      dashLine.className = 'lane-dash-line';
      const wake = document.createElement('div');
      wake.className = 'lane-wake';
      wake.style.width = '0%';
      const startTick = document.createElement('div');
      startTick.className = 'start-tick';
      const finishStrip = document.createElement('div');
      finishStrip.className = 'finish-line-strip';

      const runnerWrap = document.createElement('div');
      runnerWrap.className = 'runner-sprite';
      const runner = createRunnerSvg();
      runnerWrap.appendChild(runner.svg);

      trackCol.append(dashLine, wake, startTick, finishStrip, runnerWrap);

      const resultCol = document.createElement('div');
      resultCol.className = 'lane-result';
      const yearsText = document.createElement('span');
      yearsText.className = 'result-years';
      yearsText.textContent = `${item.waitYears} años`;
      resultCol.appendChild(yearsText);

      row.append(sportCol, trackCol, resultCol);

      row.addEventListener('click', () => selectLane(idx));
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectLane(idx);
        }
      });

      lanesContainer.appendChild(row);
      laneNodes.push({
        row,
        trackCol,
        wake,
        runnerWrap,
        runnerParts: runner.parts,
        yearsText,
        phaseOffset: idx * 0.75
      });
    });
  }

  function renderTrackFrame(timestamp) {
    const animTimeSec = (timestamp || 0) * 0.001;
    const elapsed = Math.max(0, Math.min(MAX_WAIT, simValue));

    yearCounterEl.textContent = String(Math.round(1900 + elapsed));
    elapsedSubstatEl.textContent = `${elapsed.toFixed(0)} años de espera`;
    scrubber.value = String(elapsed);

    SPORTS_DATA.forEach((item, idx) => {
      const node = laneNodes[idx];
      const progress = Math.min(1, elapsed / item.waitYears);
      const finished = elapsed >= item.waitYears;
      const trackWidth = node.trackCol.clientWidth || 500;
      const px = progress * trackWidth;

      node.wake.style.width = `${(progress * 100).toFixed(2)}%`;
      node.runnerWrap.style.transform = `translate3d(${px.toFixed(1)}px, 0, 0)`;
      node.row.classList.toggle('is-finished', finished);

      const phase = animTimeSec * 12 * FIXED_SPEED + node.phaseOffset;
      if (finished) {
        poseRunner(node.runnerParts, 'finished', animTimeSec * 4 + node.phaseOffset);
        node.yearsText.textContent = `${item.waitYears} años (${item.firstWomenYear})`;
      } else if (elapsed <= 0.01 && !isPlaying) {
        poseRunner(node.runnerParts, 'waiting', 0);
        node.yearsText.textContent = `${item.waitYears} años`;
      } else {
        poseRunner(node.runnerParts, 'running', phase);
        node.yearsText.textContent = `${Math.floor(elapsed)} / ${item.waitYears} años`;
      }
    });
  }

  function updatePlayButton() {
    if (isPlaying) {
      playPauseLabel.textContent = 'Pausar';
    } else if (simValue >= MAX_WAIT - 0.05) {
      playPauseLabel.textContent = 'Repetir carrera';
    } else {
      playPauseLabel.textContent = 'Reanudar';
    }
  }

  function tick(timestamp) {
    if (lastTimestamp === null) {
      lastTimestamp = timestamp;
    }
    const dt = Math.min(0.1, (timestamp - lastTimestamp) / 1000);
    lastTimestamp = timestamp;

    if (isPlaying) {
      const yearsPerSec = 6.0 * FIXED_SPEED;
      simValue += dt * yearsPerSec;
      if (simValue >= MAX_WAIT) {
        simValue = MAX_WAIT;
        isPlaying = false;
        updatePlayButton();
      }
    }

    renderTrackFrame(timestamp);
    window.requestAnimationFrame(tick);
  }

  playPauseBtn.addEventListener('click', () => {
    if (simValue >= MAX_WAIT - 0.05) {
      simValue = 0;
      isPlaying = true;
    } else {
      isPlaying = !isPlaying;
    }
    updatePlayButton();
  });

  resetBtn.addEventListener('click', () => {
    simValue = 0;
    isPlaying = true;
    updatePlayButton();
    renderTrackFrame(performance.now());
  });

  scrubber.addEventListener('input', (e) => {
    const target = /** @type {HTMLInputElement} */ (e.target);
    simValue = Number(target.value);
    isPlaying = false;
    updatePlayButton();
    renderTrackFrame(performance.now());
  });

  window.addEventListener('resize', () => {
    renderTrackFrame(performance.now());
  });

  initTrackLanes();
  updatePlayButton();
  renderTrackFrame(performance.now());
  window.requestAnimationFrame(tick);
})();

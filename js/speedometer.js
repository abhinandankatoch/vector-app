// Vector speedometer.js — Gauge Rendering and GPS Speed/Distance Tracking

(function () {
  const CX = 150, CY = 150, R = 128;
  const START_ANGLE = -130, END_ANGLE = 130, SWEEP = END_ANGLE - START_ANGLE; // 260deg

  const UNIT_CONFIG = {
    kmph: { max: 240, step: 40, speedLabel: 'km/h', distLabel: 'km', speedFactor: 3.6, distFactor: 1 / 1000 },
    mph:  { max: 160, step: 20, speedLabel: 'mph',  distLabel: 'mi', speedFactor: 2.2369362920544, distFactor: 1 / 1609.344 },
    kts:  { max: 140, step: 20, speedLabel: 'kts',  distLabel: 'nm', speedFactor: 1.9438444924406, distFactor: 1 / 1852 }
  };

  // Elements
  const svg = document.getElementById('speedGaugeSvg');
  const ticksGroup = document.getElementById('gaugeTicks');
  const trackPath = document.getElementById('gaugeTrack');
  const progressPath = document.getElementById('gaugeProgress');
  const speedValueEl = document.getElementById('speedValue');
  const speedUnitEl = document.getElementById('speedUnitLabel');
  const gpsDot = document.getElementById('gpsDot');
  const gpsLabel = document.getElementById('gpsLabel');
  const permOverlay = document.getElementById('locPermissionOverlay');
  const permText = document.getElementById('locPermissionText');
  const enableBtn = document.getElementById('enableLocationBtn');

  const distValueEl = document.getElementById('distanceValue');
  const distUnitEl = document.getElementById('distanceUnit');
  const avgValueEl = document.getElementById('avgSpeedValue');
  const avgUnitEl = document.getElementById('avgSpeedUnit');
  const maxValueEl = document.getElementById('maxSpeedValue');
  const maxUnitEl = document.getElementById('maxSpeedUnit');

  // State
  let arcLength = 0;
  let sessionStart = null;
  let totalDistanceMeters = 0;
  let maxSpeedMps = 0;
  let lastCoords = null;
  let lastTimestamp = null;

  function currentUnit() {
    return (window.Vector.settings && window.Vector.settings.unit) || 'kmph';
  }

  // Geometry helpers
  function polar(r, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) };
  }

  function arcPathD(r) {
    const s = polar(r, START_ANGLE);
    const e = polar(r, END_ANGLE);
    const largeArc = SWEEP > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  }

  // Build gauge for a given unit config
  function buildGauge(unitKey) {
    const cfg = UNIT_CONFIG[unitKey];
    const d = arcPathD(R);
    trackPath.setAttribute('d', d);
    progressPath.setAttribute('d', d);

    arcLength = R * (SWEEP * Math.PI) / 180;
    progressPath.setAttribute('stroke-dasharray', arcLength.toFixed(2));
    progressPath.setAttribute('stroke-dashoffset', arcLength.toFixed(2));

    const minorStep = cfg.step / 5;
    let ticksHtml = '';
    for (let v = 0; v <= cfg.max + 0.001; v += minorStep) {
      const rounded = Math.round(v * 100) / 100;
      const isMajor = Math.abs(rounded % cfg.step) < 0.01 || Math.abs((rounded % cfg.step) - cfg.step) < 0.01;
      const angle = START_ANGLE + (rounded / cfg.max) * SWEEP;
      if (isMajor) {
        const p1 = polar(114, angle), p2 = polar(132, angle), lp = polar(150, angle);
        ticksHtml += `<line class="tick-major" x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" />`;
        ticksHtml += `<text class="tick-label" x="${lp.x.toFixed(1)}" y="${lp.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${Math.round(rounded)}</text>`;
      } else {
        const p1 = polar(122, angle), p2 = polar(132, angle);
        ticksHtml += `<line class="tick-minor" x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" />`;
      }
    }
    ticksGroup.innerHTML = ticksHtml;
    speedUnitEl.textContent = cfg.speedLabel;
    distUnitEl.textContent = cfg.distLabel;
    avgUnitEl.textContent = cfg.speedLabel;
    maxUnitEl.textContent = cfg.speedLabel;
  }

  function setGaugeValue(speedMps) {
    const cfg = UNIT_CONFIG[currentUnit()];
    const displaySpeed = Math.max(0, speedMps * cfg.speedFactor);
    const fraction = Math.min(1, displaySpeed / cfg.max);
    const offset = arcLength * (1 - fraction);
    progressPath.setAttribute('stroke-dashoffset', offset.toFixed(2));
    speedValueEl.textContent = Math.round(displaySpeed);
  }

  function refreshStatDisplay() {
    const cfg = UNIT_CONFIG[currentUnit()];
    distValueEl.textContent = (totalDistanceMeters * cfg.distFactor).toFixed(2);
    maxValueEl.textContent = Math.round(maxSpeedMps * cfg.speedFactor);

    const elapsedSec = sessionStart ? (Date.now() - sessionStart) / 1000 : 0;
    const avgMps = elapsedSec > 0 ? totalDistanceMeters / elapsedSec : 0;
    avgValueEl.textContent = Math.round(avgMps * cfg.speedFactor);
  }

  function setGpsStatus(active) {
    gpsDot.classList.toggle('active', active);
    gpsLabel.textContent = active ? 'GPS' : 'GPS…';
  }

  // Position handling
  function handlePosition(pos, err) {
    if (err) {
      if (err.silent) return; // internal permission-check ping, ignore
      setGpsStatus(false);
      if (err.code === 1) { // PERMISSION_DENIED
        permText.textContent = 'Location permission denied. Enable it in your browser or app settings to track speed.';
        enableBtn.hidden = true;
        permOverlay.hidden = false;
      }
      return;
    }

    permOverlay.hidden = true;
    setGpsStatus(pos.coords.accuracy != null && pos.coords.accuracy <= 40);

    if (!sessionStart) sessionStart = Date.now();

    const coords = pos.coords;
    const timestamp = pos.timestamp || Date.now();
    let speedMps = (typeof coords.speed === 'number' && coords.speed >= 0) ? coords.speed : null;

    if (speedMps === null && lastCoords && lastTimestamp) {
      const dtSec = (timestamp - lastTimestamp) / 1000;
      if (dtSec > 0 && dtSec < 10) {
        const dist = haversine(lastCoords.latitude, lastCoords.longitude, coords.latitude, coords.longitude);
        speedMps = dist / dtSec;
      }
    }

    if (speedMps !== null) {
      const dtSec = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 0;
      if (speedMps > 0.3 && dtSec > 0 && dtSec < 10 && (coords.accuracy == null || coords.accuracy <= 50)) {
        totalDistanceMeters += speedMps * dtSec;
      }
      maxSpeedMps = Math.max(maxSpeedMps, speedMps);
      setGaugeValue(speedMps);
    }

    lastCoords = coords;
    lastTimestamp = timestamp;
    refreshStatDisplay();

    // Expose latest fix for compass module
    window.Vector.lastPosition = pos;
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R_EARTH = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R_EARTH * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Init
  buildGauge(currentUnit());
  setGpsStatus(false);

  enableBtn.addEventListener('click', () => {
    permText.textContent = 'Getting your location…';
    enableBtn.hidden = true;
    window.Vector.geo.requestPermission();
  });

  if (window.Vector.geo.getPermissionState() === 'denied') {
    permText.textContent = 'Location permission denied. Enable it in your browser or app settings to track speed.';
    enableBtn.hidden = true;
    permOverlay.hidden = false;
  } else if (window.Vector.geo.getPermissionState() !== 'granted') {
    permOverlay.hidden = false;
  }

  window.Vector.geo.subscribe(handlePosition);

  document.addEventListener('vector:unitchange', () => {
    buildGauge(currentUnit());
    if (lastCoords && typeof lastCoords.speed === 'number') setGaugeValue(lastCoords.speed || 0);
    refreshStatDisplay();
  });
})();
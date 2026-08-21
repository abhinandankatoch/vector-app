// Vector compass.js — Heading (Device Orientation) and Latitude/Longitude (GPS)

(function () {
  const CX = 150, CY = 150;

  const DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  const DIR_NAMES = [
    'North','North-Northeast','Northeast','East-Northeast','East','East-Southeast','Southeast','South-Southeast',
    'South','South-Southwest','Southwest','West-Southwest','West','West-Northwest','Northwest','North-Northwest'
  ];

  // Elements
  const rotor = document.getElementById('compassRotor');
  const headingValueEl = document.getElementById('headingValue');
  const headingAbbrEl = document.getElementById('headingAbbr');
  const compassDot = document.getElementById('compassDot');
  const compassLabel = document.getElementById('compassLabel');
  const directionValueEl = document.getElementById('directionValue');
  const latValueEl = document.getElementById('latValue');
  const longValueEl = document.getElementById('longValue');
  const permOverlay = document.getElementById('compassPermissionOverlay');
  const permText = document.getElementById('compassPermissionText');
  const enableBtn = document.getElementById('enableCompassBtn');

  // Geometry
  function polar(r, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) };
  }

  function buildDial() {
    let html = '';
    for (let a = 0; a < 360; a += 6) {
      const isMajor = a % 30 === 0;
      if (isMajor) {
        const p1 = polar(112, a), p2 = polar(132, a), lp = polar(148, a);
        const cardinal = a === 0 ? 'N' : a === 90 ? 'E' : a === 180 ? 'S' : a === 270 ? 'W' : null;
        html += `<line class="tick-major" x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" />`;
        if (cardinal) {
          html += `<text class="tick-label cardinal-label" x="${lp.x.toFixed(1)}" y="${lp.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${cardinal}</text>`;
        } else {
          html += `<text class="tick-label" x="${lp.x.toFixed(1)}" y="${lp.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${a}</text>`;
        }
      } else {
        const p1 = polar(122, a), p2 = polar(132, a);
        html += `<line class="tick-minor" x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" />`;
      }
    }
    rotor.innerHTML = html;
  }

  // Rotation
  let cumulativeRotation = 0;

  function shortestDelta(target, current) {
    let d = (target - current) % 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  }

  function setHeading(heading) {
    const idx = Math.round(heading / 22.5) % 16;
    const targetRotation = -heading;
    const currentMod = cumulativeRotation % 360;
    cumulativeRotation += shortestDelta(targetRotation, currentMod);

    rotor.setAttribute('transform', `rotate(${cumulativeRotation.toFixed(2)} ${CX} ${CY})`);
    headingValueEl.textContent = Math.round(heading) + '°';
    headingAbbrEl.textContent = DIRS[idx];
    directionValueEl.textContent = DIR_NAMES[idx];
  }

  let smoothedHeading = null;
  function smooth(rawHeading) {
    if (smoothedHeading === null) { smoothedHeading = rawHeading; return smoothedHeading; }
    let diff = rawHeading - smoothedHeading;
    diff = ((diff + 180) % 360 + 360) % 360 - 180;
    smoothedHeading = (smoothedHeading + diff * 0.15 + 360) % 360;
    return smoothedHeading;
  }

  function setCompassStatus(active) {
    compassDot.classList.toggle('active', active);
    compassLabel.textContent = active ? 'COMPASS' : 'COMPASS…';
  }

  function formatCoord(value, posLabel, negLabel) {
    if (value == null) return '—';
    const hemi = value >= 0 ? posLabel : negLabel;
    return `${Math.abs(value).toFixed(4)}° ${hemi}`;
  }

  // Device Orientation
  function handleOrientation(event) {
    let heading = null;
    if (typeof event.webkitCompassHeading === 'number') {
      heading = event.webkitCompassHeading; // iOS Safari — already true heading
    } else if (event.alpha != null) {
      heading = (360 - event.alpha) % 360; // Android absolute orientation
    }
    if (heading === null || Number.isNaN(heading)) return;
    setCompassStatus(true);
    setHeading(smooth(heading));
  }

  function startOrientation() {
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation);
    } else if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
  }

  // Geolocation (Lat/Long)
  function handlePosition(pos, err) {
    if (err) {
      if (err.silent) return;
      if (err.code === 1) {
        permText.textContent = 'Location permission denied. Enable it in your browser or app settings to see coordinates.';
        enableBtn.hidden = true;
        permOverlay.hidden = false;
      }
      return;
    }
    permOverlay.hidden = true;
    const { latitude, longitude } = pos.coords;
    latValueEl.textContent = formatCoord(latitude, 'N', 'S');
    longValueEl.textContent = formatCoord(longitude, 'E', 'W');
  }

  // Init
  buildDial();
  setCompassStatus(false);
  setHeading(0);
  startOrientation();

  enableBtn.addEventListener('click', () => {
    permText.textContent = 'Getting your location…';
    enableBtn.hidden = true;
    window.Vector.geo.requestPermission();

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then((state) => {
        if (state === 'granted') startOrientation();
      }).catch(() => {});
    }
  });

  if (window.Vector.geo.getPermissionState() === 'denied') {
    permText.textContent = 'Location permission denied. Enable it in your browser or app settings to see coordinates.';
    enableBtn.hidden = true;
    permOverlay.hidden = false;
  } else if (window.Vector.geo.getPermissionState() !== 'granted') {
    permOverlay.hidden = false;
  }

  window.Vector.geo.subscribe(handlePosition);
})();
// Vector geo.js — Shared GPS Watcher Used by Speedometer and Compass

window.Vector = window.Vector || {};

(function () {
  const listeners = [];
  let watchId = null;
  let permissionState = 'prompt'; // 'granted' | 'denied' | 'prompt'

  function notify(pos, err) {
    listeners.forEach(fn => fn(pos, err));
  }

  function startWatch() {
    if (watchId !== null) return;
    watchId = navigator.geolocation.watchPosition(
      (pos) => { permissionState = 'granted'; notify(pos, null); },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) permissionState = 'denied';
        notify(null, err);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );
  }

  function requestPermission() {
    if (!('geolocation' in navigator)) {
      notify(null, { code: 0, message: 'Geolocation not supported on this device.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { permissionState = 'granted'; notify(pos, null); startWatch(); },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) permissionState = 'denied';
        notify(null, err);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function subscribe(fn) {
    listeners.push(fn);
  }

  function getPermissionState() {
    return permissionState;
  }

  // Try to detect existing permission grant on load (no prompt shown if already decided)
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      permissionState = result.state === 'granted' ? 'granted' : (result.state === 'denied' ? 'denied' : 'prompt');
      if (permissionState === 'granted') startWatch();
      notify(null, { code: -1, message: 'permission-check', silent: true });
      result.onchange = () => {
        permissionState = result.state === 'granted' ? 'granted' : (result.state === 'denied' ? 'denied' : 'prompt');
      };
    }).catch(() => {});
  }

  window.Vector.geo = { requestPermission, subscribe, getPermissionState };
})();
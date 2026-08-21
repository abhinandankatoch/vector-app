<div align="center">

# Vector

**A minimal GPS speedometer & compass — built for the road.**

No accounts. No ads. No data leaving your phone. Just the numbers that matter.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=flat-square&logo=pwa&logoColor=white)

[**Live App →**](https://abhinandankatoch.github.io/vector-app/)

</div>

---

## Overview

Vector is a small personal project — a distraction-free speedometer and compass that runs entirely on-device using your phone's GPS and motion sensors. It installs like a native app, works offline, and keeps every reading local to your phone.

## Features

**Speedometer**
- Live GPS speed on a glowing arc gauge
- Session Distance, Average Speed, and Max Speed
- Units in km/h, mph, or knots

**Compass**
- Real-time heading from your device's magnetometer, on a rotating 360° dial
- Direction spelled out in full — *North*, *Southeast*, *West-Northwest*, and so on
- Live Latitude / Longitude

**Everything else**
- 6 accent themes — Emerald Green, Electric Blue, Purple, Amber, Red, Cyan
- Installable as a home-screen app (PWA) — no Play Store needed
- Works offline once installed
- Clean, single-screen layout with no unnecessary chrome

## Install on Android

Vector isn't on the Play Store — it installs straight from the browser in about 15 seconds.

1. Open **[the live link](https://abhinandankatoch.github.io/vector-app/)** in **Chrome** on your Android phone
2. Tap the **⋮** menu in the top-right corner of Chrome
3. Tap **"Add to Home screen"** (or **"Install app"**, depending on your Chrome version)
4. Confirm — Vector now appears as a regular app icon on your home screen
5. Open it and grant **Location** access when prompted (needed for speed, distance, and lat/long)

That's it — no sign-up, no download page, no APK.

> **Tip:** For the compass to work well, hold your phone flat and, if it feels laggy or off, move it in a slow figure-8 motion — this recalibrates the magnetometer, a normal Android behavior and not specific to this app.

## Tech Stack

Built with nothing but the open web platform — no frameworks, no build step, no dependencies:

- **HTML5 / CSS3 / Vanilla JavaScript**
- **Geolocation API** — speed, distance, latitude/longitude
- **DeviceOrientation API** — compass heading
- **Service Worker + Web App Manifest** — offline support & installability

## Project Structure

```
vector-app/
├── index.html
├── manifest.json
├── service-worker.js
├── css/
│   └── style.css
├── js/
│   ├── app.js            # navigation, settings, theme/unit logic
│   ├── geo.js             # shared GPS watcher
│   ├── speedometer.js      # speed gauge + distance/avg/max
│   ├── compass.js          # heading dial + lat/long
│   └── register-sw.js      # service worker registration
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    └── icon-512-maskable.png
```

## Running Locally

Since Vector uses GPS and motion sensors, it needs to run over **HTTPS** (or `localhost`) — opening `index.html` directly won't trigger sensor permissions.

```bash
# from the project folder
python3 -m http.server 8000
# then open http://localhost:8000 in Chrome
```

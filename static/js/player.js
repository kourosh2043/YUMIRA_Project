// YUMIRA — player.js
// A custom video player built on the normal <video> tag (plain JavaScript, no libraries).
// The HTML for the controls is in templates/watch.html; this file only adds behavior.

const player = document.querySelector("#player");
const video = document.querySelector("#player-video");

if (player && video) {
  // ---------- 1. Find the elements ----------
  const controls = document.querySelector("#player-controls");
  const bigPlay = document.querySelector("#player-big-play");
  const status = document.querySelector("#player-status");
  const statusText = document.querySelector("#player-status-text");
  const spinner = document.querySelector("#player-spinner");

  const playButton = document.querySelector("#player-play");
  const backButton = document.querySelector("#player-back");
  const forwardButton = document.querySelector("#player-forward");
  const muteButton = document.querySelector("#player-mute");
  const volumeRange = document.querySelector("#player-volume");
  const speedDownButton = document.querySelector("#player-speed-down");
  const speedButton = document.querySelector("#player-speed");
  const speedUpButton = document.querySelector("#player-speed-up");
  const fullscreenButton = document.querySelector("#player-fullscreen");

  const progress = document.querySelector("#player-progress");
  const playedBar = document.querySelector("#player-played");
  const bufferedBar = document.querySelector("#player-buffered");
  const thumb = document.querySelector("#player-thumb");
  const tooltip = document.querySelector("#player-tooltip");
  const currentText = document.querySelector("#player-current");
  const durationText = document.querySelector("#player-duration");

  const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const HIDE_DELAY = 2500; // controls hide after this many ms without activity

  // Turn off the browser controls and show ours.
  video.controls = false;
  controls.hidden = false;
  bigPlay.hidden = false;

  // ---------- 2. Small helpers ----------
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  // 75 -> "1:15", 3725 -> "1:02:05"
  function formatTime(seconds) {
    if (!isFinite(seconds)) return "0:00";
    const total = Math.floor(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = String(total % 60).padStart(2, "0");
    if (hours > 0) return hours + ":" + String(minutes).padStart(2, "0") + ":" + secs;
    return minutes + ":" + secs;
  }

  function showStatus(text, isError) {
    statusText.textContent = text;
    spinner.hidden = isError; // the spinner is only for loading, not for errors
    status.classList.toggle("is-error", isError);
    status.hidden = false;
  }

  function hideStatus() {
    status.hidden = true;
  }

  // ---------- 3. Play and pause ----------
  function togglePlay() {
    if (video.paused || video.ended) {
      video.play().catch(function () {}); // the browser may refuse; the error event handles real problems
    } else {
      video.pause();
    }
  }

  playButton.addEventListener("click", togglePlay);
  bigPlay.addEventListener("click", togglePlay);

  video.addEventListener("play", function () {
    player.classList.add("is-playing");
    playButton.setAttribute("aria-label", "توقف");
    playButton.title = "توقف (Space)";
    startProgressLoop();
    scheduleHide();
  });

  video.addEventListener("pause", function () {
    player.classList.remove("is-playing");
    playButton.setAttribute("aria-label", "پخش");
    playButton.title = "پخش (Space)";
    showControls(); // controls stay visible while paused
  });

  // ---------- 4. Time and progress bar ----------
  let frameId = 0;
  let isDragging = false; // true while the bar is being dragged

  function updateProgress() {
    if (isDragging) return; // while dragging, the pointer decides how the bar looks
    const duration = video.duration;
    const percent = isFinite(duration) && duration > 0 ? (video.currentTime / duration) * 100 : 0;
    playedBar.style.width = percent + "%";
    thumb.style.left = percent + "%";
    progress.setAttribute("aria-valuenow", String(Math.round(percent)));
    currentText.textContent = formatTime(video.currentTime);
  }

  function updateBuffered() {
    const duration = video.duration;
    if (!isFinite(duration) || duration <= 0) return;
    let end = 0;
    // Find the buffered piece that contains the current time.
    for (let i = 0; i < video.buffered.length; i++) {
      if (video.buffered.start(i) <= video.currentTime && video.buffered.end(i) >= video.currentTime) {
        end = video.buffered.end(i);
      }
    }
    bufferedBar.style.width = (end / duration) * 100 + "%";
  }

  // While playing, redraw every frame so the bar moves smoothly (timeupdate is too slow).
  function startProgressLoop() {
    cancelAnimationFrame(frameId); // never run two loops at once
    function tick() {
      updateProgress();
      if (!video.paused) frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
  }

  video.addEventListener("timeupdate", updateProgress); // also covers seeking while paused
  video.addEventListener("progress", updateBuffered);
  video.addEventListener("timeupdate", updateBuffered);
  video.addEventListener("loadedmetadata", function () {
    durationText.textContent = formatTime(video.duration);
    updateProgress();
    updateBuffered();
  });
  video.addEventListener("durationchange", function () {
    durationText.textContent = formatTime(video.duration);
  });

  // ---------- 5. Seeking (click or drag on the bar) ----------
  function ratioFromPointer(event) {
    const box = progress.getBoundingClientRect();
    return clamp((event.clientX - box.left) / box.width, 0, 1);
  }

  // Move the video to a time, but only inside the part the browser can seek to.
  function seekTo(seconds) {
    const duration = video.duration;
    if (!isFinite(duration) || video.seekable.length === 0) return; // not seekable yet: ignore quietly
    const start = Math.max(0, video.seekable.start(0));
    const end = Math.min(duration, video.seekable.end(video.seekable.length - 1));
    video.currentTime = clamp(seconds, start, end);
    updateProgress();
  }

  function skip(seconds) {
    seekTo(video.currentTime + seconds);
  }

  // Show a position on the bar and in the tooltip without touching the video.
  function showPreview(ratio) {
    playedBar.style.width = ratio * 100 + "%";
    thumb.style.left = ratio * 100 + "%";
    tooltip.textContent = formatTime(ratio * video.duration);
    tooltip.style.left = ratio * 100 + "%";
  }

  function canSeek() {
    return isFinite(video.duration) && video.duration > 0;
  }

  progress.addEventListener("pointerdown", function (event) {
    if (!canSeek()) return;
    if (event.pointerType === "mouse" && event.button !== 0) return; // left button only
    isDragging = true;
    progress.classList.add("is-dragging");
    progress.setPointerCapture(event.pointerId); // keep receiving moves outside the bar
    showPreview(ratioFromPointer(event));
  });

  progress.addEventListener("pointermove", function (event) {
    if (!canSeek()) return;
    const ratio = ratioFromPointer(event);
    if (isDragging) {
      showPreview(ratio); // the video itself moves only when the pointer is released
    } else {
      // Small time label above the pointer
      tooltip.textContent = formatTime(ratio * video.duration);
      tooltip.style.left = ratio * 100 + "%";
    }
  });

  function stopDragging() {
    isDragging = false;
    progress.classList.remove("is-dragging");
  }

  progress.addEventListener("pointerup", function (event) {
    if (!isDragging) return;
    const ratio = ratioFromPointer(event);
    stopDragging();
    seekTo(ratio * video.duration); // a plain click ends up here too
    updateProgress(); // if the seek was ignored, put the bar back
  });

  progress.addEventListener("pointercancel", function () {
    if (!isDragging) return;
    stopDragging();
    updateProgress(); // the drag was cancelled, so the video stays where it was
  });

  backButton.addEventListener("click", function () { skip(-10); });
  forwardButton.addEventListener("click", function () { skip(10); });

  // ---------- 6. Volume ----------
  function updateVolumeUi() {
    const isMuted = video.muted || video.volume === 0;
    player.classList.toggle("is-muted", isMuted);
    const level = isMuted ? 0 : video.volume;
    volumeRange.value = level;
    volumeRange.style.setProperty("--fill", level * 100 + "%");
    muteButton.setAttribute("aria-label", isMuted ? "پخش صدا" : "قطع صدا");
    muteButton.title = isMuted ? "پخش صدا (M)" : "قطع صدا (M)";
  }

  function changeVolume(amount) {
    video.muted = false;
    video.volume = clamp(video.volume + amount, 0, 1);
  }

  muteButton.addEventListener("click", function () {
    // If the volume is at 0, un-muting should give some sound back.
    if (video.volume === 0) video.volume = 0.5;
    video.muted = !video.muted;
  });

  volumeRange.addEventListener("input", function () {
    video.volume = Number(volumeRange.value);
    video.muted = video.volume === 0;
  });

  video.addEventListener("volumechange", updateVolumeUi);
  updateVolumeUi();

  // ---------- 7. Playback speed ----------
  // Index of the listed speed that is closest to the current one.
  function speedIndex() {
    let best = 0;
    for (let i = 1; i < SPEEDS.length; i++) {
      if (Math.abs(SPEEDS[i] - video.playbackRate) < Math.abs(SPEEDS[best] - video.playbackRate)) best = i;
    }
    return best;
  }

  // direction: -1 for slower, 1 for faster
  function changeSpeed(direction) {
    video.playbackRate = SPEEDS[clamp(speedIndex() + direction, 0, SPEEDS.length - 1)];
  }

  function updateSpeedUi() {
    const rate = video.playbackRate;
    speedButton.textContent = rate + "×";
    speedButton.setAttribute("aria-label", "سرعت پخش " + rate + "× — بازگشت به سرعت عادی");
    speedDownButton.disabled = rate <= SPEEDS[0];
    speedUpButton.disabled = rate >= SPEEDS[SPEEDS.length - 1];
    // A disabled button cannot keep focus; give it to the player so the shortcuts keep working.
    if (document.activeElement === speedDownButton || document.activeElement === speedUpButton) {
      if (document.activeElement.disabled) player.focus({ preventScroll: true });
    }
  }

  speedDownButton.addEventListener("click", function () { changeSpeed(-1); });
  speedUpButton.addEventListener("click", function () { changeSpeed(1); });
  speedButton.addEventListener("click", function () { video.playbackRate = 1; });

  video.addEventListener("ratechange", updateSpeedUi);
  updateSpeedUi();

  // ---------- 8. Fullscreen ----------
  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (player.requestFullscreen) {
      player.requestFullscreen();
    } else if (video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen(); // iPhone Safari can only fullscreen the video itself
    }
  }

  if (!player.requestFullscreen && !video.webkitEnterFullscreen) {
    fullscreenButton.hidden = true; // this browser cannot do fullscreen
  }

  fullscreenButton.addEventListener("click", toggleFullscreen);
  video.addEventListener("dblclick", toggleFullscreen);
  document.addEventListener("fullscreenchange", function () {
    const isFullscreen = document.fullscreenElement === player;
    player.classList.toggle("is-fullscreen", isFullscreen);
    fullscreenButton.setAttribute("aria-label", isFullscreen ? "خروج از تمام‌صفحه" : "تمام‌صفحه");
  });

  // ---------- 9. Click on the video, hide controls when idle ----------
  let hideTimer = 0;
  let wasIdle = false;
  let lastPointerType = "mouse";

  function showControls() {
    player.classList.remove("is-idle");
    clearTimeout(hideTimer);
  }

  // Hide the controls after a few seconds, but only while the video is playing.
  function scheduleHide() {
    clearTimeout(hideTimer);
    if (video.paused) return;
    hideTimer = setTimeout(function () {
      player.classList.add("is-idle");
    }, HIDE_DELAY);
  }

  function onActivity() {
    showControls();
    scheduleHide();
  }

  player.addEventListener("pointermove", onActivity);
  player.addEventListener("pointerleave", scheduleHide);
  player.addEventListener("focusin", onActivity);

  player.addEventListener("pointerdown", function (event) {
    wasIdle = player.classList.contains("is-idle");
    lastPointerType = event.pointerType;
    onActivity();
  });

  video.addEventListener("click", function () {
    player.focus({ preventScroll: true }); // so the keyboard shortcuts work right after a click
    // On a touch screen, the first tap only brings the controls back.
    if (wasIdle && lastPointerType === "touch") return;
    togglePlay();
  });

  // ---------- 10. Loading and error messages ----------
  video.addEventListener("waiting", function () { showStatus("در حال بارگذاری…", false); });
  video.addEventListener("playing", hideStatus);
  video.addEventListener("canplay", hideStatus);

  video.addEventListener("error", function () {
    showStatus("پخش این فایل ممکن نیست. فرمت پیشنهادی MP4 با H.264 و AAC است.", true);
    bigPlay.hidden = true;
  });

  // ---------- 11. Keyboard shortcuts ----------
  player.addEventListener("keydown", function (event) {
    const target = event.target;
    if (target === volumeRange) return; // the volume slider uses the arrow keys itself
    // On a focused button, Space and Enter already click it.
    const isButton = target.tagName === "BUTTON";

    switch (event.key) {
      case " ":
      case "k":
        if (isButton && event.key === " ") return;
        togglePlay();
        break;
      case "ArrowLeft": skip(-5); break;
      case "ArrowRight": skip(5); break;
      case "j": skip(-10); break;
      case "l": skip(10); break;
      case "<": changeSpeed(-1); break;
      case ">": changeSpeed(1); break;
      case "ArrowUp": changeVolume(0.1); break;
      case "ArrowDown": changeVolume(-0.1); break;
      case "m": muteButton.click(); break;
      case "f": toggleFullscreen(); break;
      default: return; // other keys keep their normal behavior
    }
    event.preventDefault();
    onActivity();
  });
}

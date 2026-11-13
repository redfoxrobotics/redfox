// Reset awards gallery scroll on page load
window.addEventListener('load', () => {
  const gallery = document.querySelector('.awards-scroller');
  if (gallery) setTimeout(() => { gallery.scrollLeft = 0; }, 120);
});

// Mobile Navigation Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
  function toggleMenu(open) {
    const isOpen = open !== undefined ? open : !navMenu.classList.contains('open');
    navToggle.classList.toggle('active', isOpen);
    navMenu.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
  }

  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close menu when tapping any nav link
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggleMenu(false);
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
      toggleMenu(false);
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) {
      toggleMenu(false);
      navToggle.focus();
    }
  });

  window.matchMedia('(max-width: 1100px)').addEventListener('change', () => toggleMenu(false));
}

// Reveal content only when motion is welcome. Content stays visible without JavaScript.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealItems = document.querySelectorAll('.reveal');
let revealObserver;
if ('IntersectionObserver' in window && !motionPreference.matches) {
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  revealItems.forEach(item => {
    item.classList.add('reveal-pending');
    revealObserver.observe(item);
  });
}
motionPreference.addEventListener('change', () => {
  if (motionPreference.matches) {
    revealObserver?.disconnect();
    revealItems.forEach(item => item.classList.remove('reveal-pending'));
  }
});

// Keep navigation readable and indicate the section currently in view.
const mainNav = document.getElementById('mainNav');
let scrollQueued = false;
window.addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    mainNav?.classList.toggle('scrolled', window.scrollY > 24);
    scrollQueued = false;
  });
}, { passive: true });
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll('.links a').forEach(link => {
        if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
  document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
}

// An illustrative preview, with no live glove connection or microphone access.
const examples = {
  water: { message: 'I would like some water.', reply: '“Of course. Here you go.”', cue: 'Water', symbol: '💧' },
  hello: { message: 'Hello. It is nice to meet you.', reply: '“Nice to meet you too!”', cue: 'Hello', symbol: '👋' },
  thanks: { message: 'Thank you for your help.', reply: '“You are welcome!”', cue: 'Thank you', symbol: '🤝' }
};
document.querySelectorAll('[data-example]').forEach(button => {
  button.addEventListener('click', () => {
    const example = examples[button.dataset.example];
    if (!example) return;
    document.querySelectorAll('[data-example]').forEach(option => {
      const selected = option === button;
      option.classList.toggle('selected', selected);
      option.setAttribute('aria-pressed', String(selected));
    });
    document.getElementById('demoMessage').textContent = example.message;
    document.getElementById('demoReply').textContent = example.reply;
    document.getElementById('demoCue').textContent = example.cue;
    const artwork = document.querySelector('.app-picture-art');
    artwork.textContent = example.symbol;
    artwork.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('.app-gesture, .app-reply').forEach(card => {
      card.classList.remove('demo-changing');
      void card.offsetWidth;
      card.classList.add('demo-changing');
    });
  });
});

// Keep keyboard focus in the open mobile menu, with Escape handled above.
if (navToggle && navMenu) {
  document.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || !navMenu.classList.contains('open')) return;
    const controls = [navToggle, ...navMenu.querySelectorAll('a')];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
}

// Hero Opening Video Showcase (Template Front Page Style)
(function initHeroVideo() {
  const video = document.getElementById('heroVideo');
  const stage = document.querySelector('.hero-video-stage');
  const playBtn = document.getElementById('heroPlayPauseBtn');
  const barPlayBtn = document.getElementById('heroBarPlayBtn');
  const soundBtn = document.getElementById('heroSoundToggle');
  const soundLabel = document.getElementById('heroSoundLabel');
  const fsBtn = document.getElementById('heroFullscreenBtn');
  const timeLabel = document.getElementById('heroVideoTime');
  const progressTrack = document.getElementById('heroProgressTrack');
  const progressFill = document.getElementById('heroProgressFill');

  if (!video) return;

  function formatTime(s) {
    if (isNaN(s)) return '0:00';
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  function updatePlayUI() {
    const isPaused = video.paused;
    stage?.classList.toggle('is-playing', !isPaused);
    playBtn?.setAttribute('aria-label', isPaused ? 'Play video' : 'Pause video');
    barPlayBtn?.setAttribute('aria-label', isPaused ? 'Play video' : 'Pause video');
  }

  function updateSoundUI() {
    const isMuted = video.muted;
    soundBtn?.classList.toggle('is-muted', isMuted);
    soundBtn?.setAttribute('aria-pressed', String(!isMuted));
    soundBtn?.setAttribute('aria-label', isMuted ? 'Unmute audio' : 'Mute audio');
    soundBtn?.setAttribute('title', isMuted ? 'Sound: Muted (click to unmute)' : 'Sound: Default (On)');
  }

  function togglePlayPause() {
    if (video.paused) {
      // User click: play with full audio enabled
      video.muted = false;
      video.volume = 1.0;
      updateSoundUI();
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    updatePlayUI();
  }

  playBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
  });

  video.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
  });

  barPlayBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
  });

  soundBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    video.muted = !video.muted;
    updateSoundUI();
  });

  if (fsBtn) {
    fsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        if (video.requestFullscreen) {
          video.requestFullscreen().catch(() => {
            stage?.requestFullscreen?.();
          });
        } else if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
        } else if (stage?.requestFullscreen) {
          stage.requestFullscreen().catch(() => {});
        }
      }
    });
  }

  // Time & progress update
  video.addEventListener('timeupdate', () => {
    const cur = video.currentTime;
    const dur = video.duration || 120;
    if (timeLabel) {
      timeLabel.textContent = formatTime(cur) + ' / ' + formatTime(dur);
    }
    if (progressFill && dur > 0) {
      const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
      progressFill.style.width = pct + '%';
      progressTrack?.setAttribute('aria-valuenow', String(Math.round(pct)));
    }
  });

  // Interactive scrubber
  progressTrack?.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = progressTrack.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.min(1, Math.max(0, clickX / rect.width));
    const dur = video.duration || 120;
    video.currentTime = pct * dur;
    if (video.paused) {
      video.play().catch(() => {});
    }
  });

  video.addEventListener('play', updatePlayUI);
  video.addEventListener('pause', updatePlayUI);
  video.addEventListener('volumechange', updateSoundUI);

  // Set default sound ON
  video.muted = false;
  video.volume = 1.0;
  updateSoundUI();

  const startPromise = video.play();
  if (startPromise !== undefined) {
    startPromise.catch(() => {
      // Browser autoplay policy requires user gesture for unmuted sound.
      // Play smoothly muted, and activate audio instantly on user's first gesture anywhere.
      video.muted = true;
      updateSoundUI();
      video.play().catch(() => {});

      const enableAudio = () => {
        video.muted = false;
        video.volume = 1.0;
        updateSoundUI();
        window.removeEventListener('click', enableAudio);
        window.removeEventListener('keydown', enableAudio);
        window.removeEventListener('touchstart', enableAudio);
      };
      window.addEventListener('click', enableAudio, { once: true });
      window.addEventListener('keydown', enableAudio, { once: true });
      window.addEventListener('touchstart', enableAudio, { once: true });
    });
  }
})();

// Smartphone Demo Reel Video (#demo section)
(function initSmartphoneDemoVideo() {
  const video = document.getElementById('gestalkVideo');
  const soundBtn = document.getElementById('videoSoundToggle');
  const fsBtn = document.getElementById('videoFullscreenToggle');
  const videoFrame = document.getElementById('videoFrame');
  const playCircle = document.querySelector('.video-play-circle');

  if (!video) return;

  function updateSoundUI() {
    const isMuted = video.muted;
    soundBtn?.classList.toggle('is-active', !isMuted);
    soundBtn?.setAttribute('aria-pressed', String(!isMuted));
    soundBtn?.setAttribute('aria-label', isMuted ? 'Unmute audio' : 'Mute audio');
  }

  soundBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    video.muted = !video.muted;
    updateSoundUI();
    if (video.paused) video.play().catch(() => {});
  });

  fsBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      if (video.requestFullscreen) {
        video.requestFullscreen().catch(() => {
          videoFrame?.requestFullscreen?.();
        });
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    }
  });

  playCircle?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });

  video.addEventListener('pause', () => videoFrame?.classList.add('video-paused'));
  video.addEventListener('play', () => videoFrame?.classList.remove('video-paused'));
  video.addEventListener('volumechange', updateSoundUI);
  updateSoundUI();

  if ('IntersectionObserver' in window && !motionPreference.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (video.paused) video.play().catch(() => {});
        } else {
          if (!video.paused) video.pause();
        }
      });
    }, { threshold: 0.25 });
    observer.observe(video);
  }
})();

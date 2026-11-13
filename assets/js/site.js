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

// Gestalk video demonstration, mode switching, chapter navigation, and viewport autoplay
(function initGestalkVideo() {
  const video = document.getElementById('gestalkVideo');
  const videoSource = document.getElementById('videoSource');
  const soundBtn = document.getElementById('videoSoundToggle');
  const videoFrame = document.getElementById('videoFrame');
  const playCircle = document.querySelector('.video-play-circle');
  const pillFilm = document.getElementById('pillFilm');
  const pillDemo = document.getElementById('pillDemo');
  const statusLabel = document.getElementById('videoStatusLabel');
  const durationLabel = document.getElementById('videoDurationLabel');
  const chapterBadge = document.getElementById('videoChapterBadge');
  const videoCaption = document.getElementById('videoCaption');
  const chapterCards = document.querySelectorAll('.story-chapter-card');
  const filmChaptersSection = document.getElementById('filmChapters');

  if (!video) return;

  let currentMode = 'film';

  const videoData = {
    film: {
      src: 'gestalk-product-film.mp4',
      poster: 'gestalk-film-poster.jpg',
      status: 'Official Product Film',
      duration: '2:00',
      caption: 'Official 2-Minute Product Film · Problem context, AI wearable breakthrough, and real-world impact by Redfoxrobotics',
      chapters: [
        { time: 0, label: '0:00 · The Challenge' },
        { time: 28, label: '0:28 · The Innovation' },
        { time: 52, label: '0:52 · Multi-Modal Output' },
        { time: 86, label: '1:26 · Hardware Excellence' }
      ]
    },
    demo: {
      src: 'gestalk-video.mp4',
      poster: 'gestalk-demo-poster.jpg',
      status: 'Live Prototype Demo',
      duration: '0:41',
      caption: 'Live demonstration · Gestalk smart glove translating gestures to voice and text in real time'
    }
  };

  function setVideoMode(mode, targetSeek) {
    if (currentMode === mode && targetSeek === undefined) return;
    const modeChanged = currentMode !== mode;
    currentMode = mode;
    const data = videoData[mode];

    if (pillFilm && pillDemo) {
      const isFilm = mode === 'film';
      pillFilm.classList.toggle('active', isFilm);
      pillFilm.setAttribute('aria-selected', String(isFilm));
      pillDemo.classList.toggle('active', !isFilm);
      pillDemo.setAttribute('aria-selected', String(!isFilm));
    }

    if (videoFrame) {
      videoFrame.classList.toggle('mode-film', mode === 'film');
      videoFrame.classList.toggle('mode-demo', mode === 'demo');
    }

    if (statusLabel) statusLabel.textContent = data.status;
    if (durationLabel) durationLabel.textContent = data.duration;
    if (videoCaption) videoCaption.textContent = data.caption;

    if (chapterBadge) {
      if (mode === 'film') {
        chapterBadge.style.display = '';
        chapterBadge.textContent = '0:00 · The Challenge';
      } else {
        chapterBadge.style.display = 'none';
      }
    }

    if (filmChaptersSection) {
      filmChaptersSection.style.opacity = mode === 'film' ? '1' : '0.45';
    }

    if (modeChanged) {
      const wasPlaying = !video.paused;
      video.pause();
      video.poster = data.poster;
      if (videoSource) videoSource.src = data.src;
      video.src = data.src;
      video.load();

      if (targetSeek !== undefined) {
        const onLoaded = () => {
          video.currentTime = targetSeek;
          video.play().catch(() => {});
          video.removeEventListener('loadedmetadata', onLoaded);
        };
        video.addEventListener('loadedmetadata', onLoaded);
      } else if (wasPlaying) {
        video.play().catch(() => {});
      }
    } else if (targetSeek !== undefined) {
      video.currentTime = targetSeek;
      video.play().catch(() => {});
    }
  }

  pillFilm?.addEventListener('click', () => setVideoMode('film'));
  pillDemo?.addEventListener('click', () => setVideoMode('demo'));

  // Sound toggle button
  if (soundBtn) {
    function updateSoundButton() {
      if (video.muted) {
        soundBtn.textContent = 'Tap for sound 🔈';
        soundBtn.setAttribute('aria-pressed', 'false');
      } else {
        soundBtn.textContent = 'Sound on 🔊';
        soundBtn.setAttribute('aria-pressed', 'true');
      }
    }

    soundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      updateSoundButton();
      if (video.paused) {
        video.play().catch(() => {});
      }
    });

    video.addEventListener('volumechange', updateSoundButton);
    updateSoundButton();
  }

  // Play circle clicking
  playCircle?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });

  let userPaused = false;
  video.addEventListener('pause', () => {
    videoFrame?.classList.add('video-paused');
    const rect = video.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView) userPaused = true;
  });
  video.addEventListener('play', () => {
    videoFrame?.classList.remove('video-paused');
    userPaused = false;
  });

  // Chapter card seeking and active highlighting
  chapterCards.forEach(card => {
    card.addEventListener('click', () => {
      const seekTime = parseFloat(card.dataset.seek || '0');
      chapterCards.forEach(c => c.classList.toggle('active', c === card));
      setVideoMode('film', seekTime);
    });
  });

  // Track chapters during playback in film mode
  video.addEventListener('timeupdate', () => {
    if (currentMode !== 'film') return;
    const t = video.currentTime;
    let activeIndex = 0;
    if (t >= 86) activeIndex = 3;
    else if (t >= 52) activeIndex = 2;
    else if (t >= 28) activeIndex = 1;

    chapterCards.forEach((card, idx) => {
      card.classList.toggle('active', idx === activeIndex);
    });

    if (chapterBadge && videoData.film.chapters[activeIndex]) {
      chapterBadge.textContent = videoData.film.chapters[activeIndex].label;
    }
  });

  // Viewport autoplay and pause
  if ('IntersectionObserver' in window && !motionPreference.matches) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!userPaused && video.paused) {
            video.play().catch(() => {});
          }
        } else {
          if (!video.paused) {
            video.pause();
          }
        }
      });
    }, { threshold: 0.2 });
    videoObserver.observe(video);
  }
})();

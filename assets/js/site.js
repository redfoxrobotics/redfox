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

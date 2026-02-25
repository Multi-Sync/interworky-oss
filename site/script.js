/* ═══════════════════════════════════════════════════════════
   INTERWORKY — Landing Page Scripts
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── Scroll Reveal ───
    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // Stagger children if they have --delay
                    const delay = getComputedStyle(entry.target).getPropertyValue('--delay');
                    const ms = delay ? parseInt(delay) * 120 : 0;
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, ms);
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => {
        revealObserver.observe(el);
    });

    // ─── Nav Scroll Effect ───
    const nav = document.getElementById('nav');
    let lastScroll = 0;

    function onScroll() {
        const scrollY = window.scrollY;
        if (scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        lastScroll = scrollY;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ─── Mobile Nav Toggle ───
    const navToggle = document.getElementById('navToggle');
    const navMobile = document.getElementById('navMobile');

    if (navToggle && navMobile) {
        navToggle.addEventListener('click', () => {
            navMobile.classList.toggle('open');
            const isOpen = navMobile.classList.contains('open');
            navToggle.setAttribute('aria-expanded', isOpen);
        });

        // Close mobile nav on link click
        navMobile.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navMobile.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // ─── Smooth scroll for anchor links ───
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
})();

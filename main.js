/* Bhargavi Mudumbha — portfolio behaviour.
   No framework, no animation library: IntersectionObserver for reveals,
   CSS for the motion itself, one rAF loop for the hero canvas. */

const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];


/* ---------- Theme -------------------------------------------------------- */

const themeBtn = $(".theme-btn");
const themeIcon = $(".theme-icon");

function currentTheme() {
    return document.documentElement.dataset.theme
        || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

function paintThemeIcon() {
    // The icon shows the theme you would switch TO.
    themeIcon.classList.toggle("sun", currentTheme() === "dark");
    themeBtn.setAttribute("aria-label",
        currentTheme() === "dark" ? "Switch to light theme" : "Switch to dark theme");
}

themeBtn.addEventListener("click", () => {
    document.documentElement.dataset.theme = currentTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", document.documentElement.dataset.theme); } catch (e) { /* not saved */ }
    paintThemeIcon();
    paintNav();
});

paintThemeIcon();


/* ---------- Mobile nav --------------------------------------------------- */

const nav = $("#nav");
const navToggle = $(".nav-toggle");
const navLinks = $("#nav-links");

function closeNav() {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
}

navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
});

navLinks.addEventListener("click", e => {
    if (e.target.tagName === "A") closeNav();
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeNav();
});


/* ---------- Nav tone, stuck state and scroll-spy ------------------------- */

const sections = $$("main > section");
let activeSection = sections[0];

function paintNav() {
    if (!activeSection) return;
    nav.dataset.tone = activeSection.dataset.navTone || "light";
    nav.style.setProperty("--bg", getComputedStyle(activeSection).backgroundColor);
}

// Whichever section sits under the navigation bar sets its colour.
const toneObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
        if (entry.isIntersecting) {
            activeSection = entry.target;
            paintNav();
        }
    }
}, { rootMargin: "-5% 0px -94% 0px" });

sections.forEach(s => toneObserver.observe(s));
paintNav();

// Highlight the nav link for the section filling most of the screen.
const linkFor = new Map(
    $$("#nav-links a").map(a => [a.getAttribute("href").slice(1), a])
);

const spy = new IntersectionObserver(entries => {
    for (const entry of entries) {
        const link = linkFor.get(entry.target.id);
        if (link) link.classList.toggle("current", entry.isIntersecting);
    }
}, { rootMargin: "-45% 0px -45% 0px" });

sections.forEach(s => spy.observe(s));


/* ---------- Reveals ------------------------------------------------------ */

const revealTargets = [...$$(".reveal"), ...$$(".display"), ...$$(".statement")];

if (reduced.matches) {
    revealTargets.forEach(el => el.classList.add("in"));
} else {
    const io = new IntersectionObserver((entries, obs) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("in");
            obs.unobserve(entry.target);
            if (entry.target.querySelector(".count")) countUp(entry.target);
        }
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.1 });

    revealTargets.forEach(el => io.observe(el));
}


/* ---------- Stat count-up ------------------------------------------------ */

function countUp(scope) {
    for (const el of $$(".count", scope)) {
        const to = parseFloat(el.dataset.to);
        const dp = parseInt(el.dataset.dp || "0", 10);
        if (Number.isNaN(to)) continue;

        const start = performance.now();
        const dur = 1100;

        const step = now => {
            const t = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = (to * eased).toFixed(dp);
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }
}

if (reduced.matches) {
    $$(".count").forEach(el => {
        el.textContent = parseFloat(el.dataset.to).toFixed(parseInt(el.dataset.dp || "0", 10));
    });
}


/* ---------- Skills index ------------------------------------------------- */

const tabs = $$(".skill-cats button");
const panes = $$(".skill-pane");

function selectTab(tab) {
    tabs.forEach(t => t.setAttribute("aria-selected", String(t === tab)));
    const wanted = tab.getAttribute("aria-controls");
    panes.forEach(p => { p.hidden = p.id !== wanted; });
}

tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab));

    tab.addEventListener("keydown", e => {
        const horizontal = matchMedia("(width < 900px)").matches;
        const next = horizontal ? "ArrowRight" : "ArrowDown";
        const prev = horizontal ? "ArrowLeft" : "ArrowUp";

        let target = null;
        if (e.key === next) target = tabs[(i + 1) % tabs.length];
        else if (e.key === prev) target = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") target = tabs[0];
        else if (e.key === "End") target = tabs.at(-1);

        if (target) {
            e.preventDefault();
            selectTab(target);
            target.focus();
        }
    });
});


/* ---------- Audience switcher -------------------------------------------- */

const audienceBtns = $$(".switcher button");

function setAudience(name) {
    document.documentElement.dataset.audience = name;
    audienceBtns.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.audience === name)));
    try { localStorage.setItem("audience", name); } catch (e) { /* not saved */ }
}

audienceBtns.forEach(btn => {
    btn.addEventListener("click", () => setAudience(btn.dataset.audience));
});

setAudience(document.documentElement.dataset.audience || "recruiter");


/* ---------- Experience rail --------------------------------------------- */

const timeline = $(".timeline");
const railFill = $(".rail i");

function paintRail() {
    if (!timeline || !railFill) return;
    const r = timeline.getBoundingClientRect();
    const vh = innerHeight;
    const p = (vh * 0.8 - r.top) / (r.height + vh * 0.3);
    railFill.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(3));
}


/* ---------- Footer clock ------------------------------------------------- */

const clock = $("#clock");
$("#year").textContent = new Date().getFullYear();

function paintClock() {
    if (!clock) return;
    clock.textContent = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit"
    }).format(new Date());
}

paintClock();
setInterval(paintClock, 30_000);


/* ---------- Hero field --------------------------------------------------- */
/* A slow-drifting point cloud — a nod to the embedding spaces behind NEXORA's
   retrieval. Purely decorative, skipped entirely under reduced motion. */

function heroField() {
    const canvas = $("#field");
    if (!canvas || reduced.matches) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    let w = 0, h = 0, dpr = 1, points = [];

    const accent = () => getComputedStyle(document.documentElement)
        .getPropertyValue("--oxide").trim() || "#b64b2e";

    function resize() {
        dpr = Math.min(devicePixelRatio || 1, 2);
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = w < 700 ? 34 : w < 1200 ? 58 : 84;
        points = Array.from({ length: count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.14,
            vy: (Math.random() - 0.5) * 0.14,
            r: Math.random() * 1.6 + 0.5
        }));
    }

    function frame() {
        ctx.clearRect(0, 0, w, h);
        const col = accent();
        const link = w < 700 ? 110 : 150;

        for (const p of points) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;
        }

        ctx.strokeStyle = col;
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const a = points[i], b = points[j];
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d > link) continue;
                ctx.globalAlpha = (1 - d / link) * 0.16;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        }

        ctx.fillStyle = col;
        for (const p of points) {
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(frame);
    }

    let raf = 0;
    resize();
    addEventListener("resize", resize, { passive: true });

    // Stop drawing whenever the hero is off screen or the tab is hidden.
    new IntersectionObserver(([entry]) => {
        cancelAnimationFrame(raf);
        if (entry.isIntersecting && !document.hidden) raf = requestAnimationFrame(frame);
    }, { threshold: 0 }).observe(canvas);

    document.addEventListener("visibilitychange", () => {
        cancelAnimationFrame(raf);
        if (!document.hidden) raf = requestAnimationFrame(frame);
    });
}

heroField();


/* ---------- Scroll work -------------------------------------------------- */

let ticking = false;

function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
        nav.classList.toggle("stuck", scrollY > 24);
        paintRail();
        ticking = false;
    });
}

addEventListener("scroll", onScroll, { passive: true });
onScroll();

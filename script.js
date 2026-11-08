(() => {
  "use strict";
  const data = window.PORTFOLIO_CONTENT;
  if (!data) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const isPlaceholder = value => /^\[[A-Z0-9_ -]+\]$/.test(String(value || ""));
  const setText = (selector, value) => { const el = $(selector); if (el) el.textContent = value ?? ""; };

  document.title = `${data.name} | ${data.role}`;
  $$("[data-section]").forEach(el => {
    const value = el.dataset.section.split(".").reduce((obj, key) => obj?.[key], data);
    if (value !== undefined) el.textContent = value;
  });
  $$("[data-hero]").forEach(el => {
    const value = data.hero[el.dataset.hero];
    if (value !== undefined) {
      if (el.dataset.hero === "headline") el.innerHTML = value;
      else el.textContent = value;
    }
  });
  $$("[data-link]").forEach(el => {
    const url = data.links[el.dataset.link];
    if (url && !isPlaceholder(url)) el.href = url;
    else if (url) { el.href = "#contact"; el.addEventListener("click", event => { event.preventDefault(); alert("Please add your Calendly booking link in content.js before publishing."); }); }
  });
  setText("[data-footer]", data.footer);
  setText("[data-availability]", data.availability);
  setText("[data-timezone]", data.timezoneHours);
  setText("[data-email-text]", data.email);

  // Small visual chips in the problem-first hero.
  $("#hero-problems").innerHTML = data.hero.problems.map((item, i) => `<span class="problem-chip"><i aria-hidden="true">${["✧","▤","◷","⌕","☷"][i % 5]}</i>${esc(item)}</span>`).join("");

  // Six concise service cards.
  $("#service-grid").innerHTML = data.services.items.map((item, i) => `
    <article class="service-card reveal">
      <div class="service-icon" aria-hidden="true"><span>${esc(item.icon)}</span><i>${String(i + 1).padStart(2, "0")}</i></div>
      <h3>${esc(item.title)}</h3><p>${esc(item.description)}</p>
      <div class="tag-list">${item.tags.slice(0, 3).map(tag => `<span class="tag">${esc(tag)}</span>`).join("")}</div>
    </article>`).join("");

  // Tool categories and gentle duplicate marquee.
  $("#tools-grid").innerHTML = data.tools.groups.map(group => `
    <article class="tool-group reveal"><h3>${esc(group.title)}</h3><div class="tool-chips">${group.items.map(item => `<span class="tool-chip"><i aria-hidden="true">✦</i>${esc(item)}</span>`).join("")}</div></article>`).join("");
  const allTools = data.tools.groups.flatMap(group => group.items);
  $("#tools-marquee").innerHTML = [...allTools, ...allTools].map(item => `<span>${esc(item)} <b aria-hidden="true">✦</b></span>`).join("");

  // Interactive needs checklist. Email body includes only checked problems and matched services.
  const selected = new Set();
  const checklist = $("#va-checklist");
  const resultServices = $("#result-services");
  const emailLink = $("#test-email");
  const updateTest = () => {
    const chosen = data.vaTest.items.filter((item, index) => selected.has(index));
    $("#result-count").innerHTML = `${chosen.length} <small>selected</small>`;
    $("#result-message").textContent = chosen.length
      ? "These are the areas where support may help:"
      : "Choose the tasks that are taking up your time.";
    const services = [...new Set(chosen.map(item => item.service))];
    resultServices.innerHTML = services.map(service => `<span class="result-service">${esc(service)}</span>`).join("");
    const body = chosen.length
      ? `Hi Dreem,\n\nI would like to discuss support with these areas:\n${chosen.map(item => `• ${item.problem} (${item.service})`).join("\n")}\n\nCould we arrange a short introduction call?\n\nThank you.`
      : "Hi Dreem,\n\nI would like to learn more about your administrative and operations support.\n\nThank you.";
    emailLink.href = `${data.links.emailCompose}&su=${encodeURIComponent(data.vaTest.emailSubject)}&body=${encodeURIComponent(body)}`;
    emailLink.setAttribute("aria-label", `Email Dreem about ${chosen.length} selected needs`);
  };
  checklist.innerHTML = data.vaTest.items.map((item, index) => `
    <label class="check-row"><input type="checkbox" value="${index}"><span class="custom-check" aria-hidden="true"></span><span>${esc(item.problem)}</span></label>`).join("");
  $$("input[type=checkbox]", checklist).forEach(input => input.addEventListener("change", () => {
    const index = Number(input.value);
    if (input.checked) selected.add(index); else selected.delete(index);
    updateTest();
  }));
  $("#reset-test").addEventListener("click", () => {
    selected.clear();
    $$("input[type=checkbox]", checklist).forEach(input => { input.checked = false; });
    updateTest();
    checklist.querySelector("input")?.focus();
  });
  updateTest();

  // Projects: lazy iframe previews, with a poster always available as a timed fallback.
  const projectGrid = $("#project-grid");
  projectGrid.innerHTML = data.projects.items.map((item, index) => `
    <article class="project-card reveal">
      <a class="project-preview-link" href="${esc(item.projectUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(item.title)} in a new tab">
        <div class="preview-stage">
          <img class="preview-poster" src="${esc(item.poster)}" alt="${esc(item.title)} preview poster" loading="lazy">
          <div class="preview-window" aria-hidden="true"><iframe title="${esc(item.title)} live preview" data-preview-src="${esc(item.previewUrl)}" loading="lazy" tabindex="-1"></iframe></div>
          <span class="preview-label"><i></i> LIVE PREVIEW</span>
          <span class="preview-open">Open project ↗</span>
        </div>
      </a>
      <div class="project-info"><p class="project-category">${esc(item.category)}</p><h3>${esc(item.title)}</h3><p class="project-description">${esc(item.description)}</p><p class="sample-disclaimer">${esc(data.projects.sampleLabel)}</p>${item.status ? `<p class="project-status">${esc(item.status)}</p>` : ""}<a class="project-open-link" href="${esc(item.projectUrl)}" target="_blank" rel="noopener noreferrer">Preview Project <span aria-hidden="true">↗</span></a></div>
    </article>`).join("");

  const previewTimers = new WeakMap();
  const previewObserver = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const iframe = entry.target;
      const stage = iframe.closest(".preview-stage");
      if (iframe.dataset.loaded !== "true") {
        iframe.dataset.loaded = "true";
        iframe.src = iframe.dataset.previewSrc;
        const timer = window.setTimeout(() => stage.classList.add("poster-only"), 4000);
        previewTimers.set(iframe, timer);
        iframe.addEventListener("load", () => {
          window.clearTimeout(previewTimers.get(iframe));
          // Notion and Drive can load a frame shell while blocking useful content;
          // retain the poster as a visible overlay, with the preview subtly beneath.
          stage.classList.add("preview-loaded");
        }, { once: true });
      }
      previewObserver.unobserve(iframe);
    });
  }, { rootMargin: "180px 0px" }) : null;
  $$("iframe[data-preview-src]").forEach(iframe => {
    if (previewObserver) previewObserver.observe(iframe);
    else iframe.src = iframe.dataset.previewSrc;
  });
  $$("img.preview-poster").forEach(img => img.addEventListener("error", () => img.classList.add("poster-missing"), { once: true }));

  // How I work, facts, experience and FAQ.
  $("#steps-grid").innerHTML = data.howIWork.steps.map((step, i) => `<article class="step-card reveal"><span class="step-number">${String(i + 1).padStart(2, "0")}</span><span class="step-icon" aria-hidden="true">${esc(step.icon)}</span><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p></article>`).join("");
  $("#quickfacts-list").innerHTML = data.quickFacts.items.map(item => `<span>${esc(item)}</span>`).join("");
  $("#timeline").innerHTML = data.experience.items.map(item => `<article class="timeline-item reveal"><div class="timeline-marker" aria-hidden="true">✦</div><p class="timeline-dates">${esc(item.dates)}</p><h3>${esc(item.title)}</h3><p class="timeline-company">${esc(item.company)}</p><ul>${item.points.map(point => `<li>${esc(point)}</li>`).join("")}</ul></article>`).join("");
  $("#faq-list").innerHTML = data.faq.items.map(item => `<details class="faq-item"><summary>${esc(item.question)}<span aria-hidden="true">+</span></summary><p>${esc(item.answer)}</p></details>`).join("");

  // Contact actions.
  $("#copy-email").addEventListener("click", async () => {
    const button = $("#copy-email"), feedback = $("#copy-feedback");
    try {
      await navigator.clipboard.writeText(data.email);
      feedback.textContent = "Email address copied.";
    } catch {
      feedback.textContent = `Email: ${data.email}`;
    }
    button.focus();
  });

  // Responsive navigation and active-section tracking.
  const menuToggle = $(".menu-toggle"), nav = $("#site-nav");
  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  $$(".site-nav a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }));
  const header = $(".site-header");
  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 8);
    const portrait = $("#hero-visual");
    if (portrait && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && window.innerWidth > 760) {
      portrait.style.setProperty("--parallax-y", `${Math.min(22, window.scrollY * .035)}px`);
    }
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Reveal-on-scroll and nav highlighting. All reveal content is immediately visible if IO is unavailable.
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: .12 });
    $$(".reveal").forEach(el => revealObserver.observe(el));
    const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        $$(".nav-link").forEach(link => {
          const active = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("active", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }
    }), { rootMargin: "-32% 0px -58% 0px" });
    $$("main section[id]").forEach(section => navObserver.observe(section));
  } else {
    $$(".reveal").forEach(el => el.classList.add("is-visible"));
  }

  // Motion polish: small hero sparkle drift; no motion when reduced motion is requested.
  if (!reducedMotion) document.documentElement.classList.add("motion-enabled");
})();

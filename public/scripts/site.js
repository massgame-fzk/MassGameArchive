const ready = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
};

ready(() => {
  initStickyOffsets();
  initArchiveNavigation();
  initVideoEmbeds();
  initContactForm();
});

function initArchiveNavigation() {
  const nav = document.querySelector(".year-decade-nav, .year-filter:not([data-music-navigation])");
  if (!nav || typeof IntersectionObserver !== "function") return;
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const setCurrent = (hash) => {
    for (const link of links) {
      if (link.getAttribute("href") === hash) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
  };
  setCurrent(location.hash || links[0]?.getAttribute("href"));
  links.forEach((link) => link.addEventListener("click", () => setCurrent(link.getAttribute("href"))));
  const offset = (document.querySelector(".site-header")?.getBoundingClientRect().height ?? 68) + nav.getBoundingClientRect().height + 24;
  const sections = links.map((link) => document.getElementById(link.hash.slice(1))).filter(Boolean);
  const observer = new IntersectionObserver(() => {
    const current = sections.findLast((section) => section.getBoundingClientRect().top <= offset + 40) ?? sections[0];
    if (current) setCurrent(`#${current.id}`);
  }, { rootMargin: `-${offset}px 0px -55% 0px`, threshold: 0 });
  sections.forEach((section) => observer.observe(section));
}

function initStickyOffsets() {
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const scrollHintShell = document.querySelector(".scroll-hint-shell");

  const setMeasuredHeight = (name, element) => {
    if (!(element instanceof HTMLElement)) return;
    root.style.setProperty(name, `${element.getBoundingClientRect().height}px`);
  };

  const updateStickyOffsets = () => {
    setMeasuredHeight("--site-header-height", header);
    setMeasuredHeight("--scroll-hint-shell-height", scrollHintShell);
  };

  updateStickyOffsets();

  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(updateStickyOffsets);
    if (header instanceof HTMLElement) observer.observe(header);
    if (scrollHintShell instanceof HTMLElement) observer.observe(scrollHintShell);
  } else {
    globalThis.addEventListener("resize", updateStickyOffsets);
  }
}

function initVideoEmbeds() {
  document.querySelectorAll("[data-embed-url]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!(button instanceof HTMLButtonElement)) return;
      const url = button.dataset.embedUrl;
      if (!url) return;
      const slot = button.closest(".video-row, .video-item")?.querySelector(".embed-slot");
      if (!slot) return;

      const existing = slot.querySelector("iframe");
      if (existing) {
        slot.replaceChildren();
        button.textContent = "このページで再生";
        button.setAttribute("aria-expanded", "false");
        return;
      }

      const iframe = document.createElement("iframe");
      iframe.src = url;
      iframe.title = button.dataset.embedTitle ?? "YouTube";
      iframe.loading = "lazy";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      slot.replaceChildren(iframe);
      button.textContent = "再生を閉じる";
      button.setAttribute("aria-expanded", "true");
    });
  });
}

function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  const status = document.querySelector("[data-form-status]");
  const topic = form?.querySelector("select[name='topic']");
  const message = form?.querySelector("[data-message-field]");

  const placeholders = {
    情報提供: "例: 2024年度 月 一部で使われていた曲は...",
    訂正依頼: "例: 2023年度 太陽 二部の曲名が...",
    リンク切れ: "例: 2025年度 月のYouTubeリンクが再生できません",
    "削除・非掲載の相談": "例: 掲載内容について相談したい箇所は...",
    その他: "例: サイトについて相談したい内容を入力してください",
  };

  if (topic instanceof HTMLSelectElement && message instanceof HTMLTextAreaElement) {
    topic.addEventListener("change", () => {
      message.placeholder = placeholders[topic.value] ?? "例: 2024年度 月 一部で使われていた曲について";
    });
  }

  if (!(form instanceof HTMLFormElement) || !(status instanceof HTMLElement)) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);

    status.textContent = "送信しています。";
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
    }

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Formspree submission failed");
      }

      form.reset();
      status.textContent = "送信ありがとうございました。内容を確認します。";
    } catch {
      status.textContent = "送信できませんでした。時間をおいてもう一度試してください。";
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
      }
    }
  });
}

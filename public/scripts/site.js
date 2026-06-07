const ready = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
};

ready(() => {
  initStickyOffsets();
  initShareActions();
  initRecordsTables();
  initVideoEmbeds();
  initContactForm();
});

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

function initShareActions() {
  const shareGroups = document.querySelectorAll(".share-actions");

  shareGroups.forEach((group) => {
    if (!(group instanceof HTMLElement)) return;

    const copyButton = group.querySelector(".share-copy");
    const nativeButton = group.querySelector(".share-native");
    const toggleButton = group.querySelector(".share-menu-toggle");
    const status = group.querySelector(".share-status");
    const shareLinks = group.querySelectorAll(".share-link");
    const getCurrentShareUrl = () => location.href;
    const getCurrentShareText = () => `${group.dataset.shareText ?? ""} ${getCurrentShareUrl()}`;
    const shareData = {
      title: group.dataset.shareTitle ?? document.title,
      text: group.dataset.shareText ?? "",
      url: getCurrentShareUrl(),
    };
    const updateShareTargets = () => {
      const currentUrl = getCurrentShareUrl();
      shareData.url = currentUrl;
      group.dataset.shareUrl = currentUrl;
      if (copyButton instanceof HTMLElement) copyButton.dataset.copyText = getCurrentShareText();
      shareLinks.forEach((link) => {
        if (!(link instanceof HTMLAnchorElement)) return;
        const service = link.dataset.shareService;
        if (service === "x") {
          link.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getCurrentShareText())}`;
        } else if (service === "line") {
          link.href = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(currentUrl)}`;
        } else if (service === "facebook") {
          link.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
        }
      });
    };

    updateShareTargets();

    if (!navigator.share && nativeButton instanceof HTMLElement) {
      nativeButton.hidden = true;
    }

    toggleButton?.addEventListener("click", () => {
      if (!(toggleButton instanceof HTMLButtonElement)) return;
      const expanded = group.dataset.open === "true";
      group.dataset.open = expanded ? "false" : "true";
      toggleButton.setAttribute("aria-expanded", String(!expanded));
      toggleButton.setAttribute("aria-label", expanded ? "共有メニューを開く" : "共有メニューを閉じる");
      if (!expanded) updateShareTargets();
    });

    document.addEventListener("click", (event) => {
      if (group.dataset.open !== "true") return;
      if (event.target instanceof Node && group.contains(event.target)) return;
      group.dataset.open = "false";
      if (toggleButton instanceof HTMLButtonElement) {
        toggleButton.setAttribute("aria-expanded", "false");
        toggleButton.setAttribute("aria-label", "共有メニューを開く");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || group.dataset.open !== "true") return;
      group.dataset.open = "false";
      if (toggleButton instanceof HTMLButtonElement) {
        toggleButton.setAttribute("aria-expanded", "false");
        toggleButton.setAttribute("aria-label", "共有メニューを開く");
        toggleButton.focus();
      }
    });

    copyButton?.addEventListener("click", async () => {
      if (!(copyButton instanceof HTMLElement)) return;
      updateShareTargets();
      const text = copyButton.dataset.copyText ?? shareData.url;
      try {
        await navigator.clipboard.writeText(text);
        if (status) status.textContent = "コピーしました";
      } catch {
        if (status) status.textContent = "コピーできませんでした";
      }
    });

    nativeButton?.addEventListener("click", async () => {
      if (!navigator.share) return;
      updateShareTargets();
      try {
        await navigator.share(shareData);
      } catch {
        // User cancellation does not need a visible error.
      }
    });
  });
}

function initRecordsTables() {
  document.querySelectorAll("[data-records-table]").forEach((table) => {
    if (!(table instanceof HTMLTableElement)) return;
    initRecordsSort(table);
    initRecordsFilters(table);
  });
}

function initRecordsSort(table) {
  const tbody = table.querySelector("tbody");
  const rows = Array.from(table.querySelectorAll("tbody tr"));
  const collator = new Intl.Collator("ja", { numeric: true, sensitivity: "base" });
  let activeSort = { key: "year", direction: "desc", type: "number" };

  const valueFor = (row, key, type) => {
    const value = row.dataset[key] ?? "";
    return type === "number" ? Number(value) : value;
  };

  const updateSortState = () => {
    table.querySelectorAll("th").forEach((header) => header.setAttribute("aria-sort", "none"));
    table.querySelectorAll("[data-sort-key]").forEach((control) => {
      if (!(control instanceof HTMLButtonElement)) return;
      const isActive = control.dataset.sortKey === activeSort.key;
      control.dataset.sortDirection = isActive ? activeSort.direction : "";
      if (isActive) {
        control.closest("th")?.setAttribute("aria-sort", activeSort.direction === "asc" ? "ascending" : "descending");
      }
    });
  };

  const applySort = () => {
    if (!tbody) return;
    const sortedRows = [...rows].sort((a, b) => {
      if (!(a instanceof HTMLTableRowElement) || !(b instanceof HTMLTableRowElement)) return 0;
      const aValue = valueFor(a, activeSort.key, activeSort.type);
      const bValue = valueFor(b, activeSort.key, activeSort.type);
      const result =
        typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : collator.compare(String(aValue), String(bValue));
      return activeSort.direction === "asc" ? result : -result;
    });
    tbody.append(...sortedRows);
    updateSortState();
  };

  table.querySelectorAll("[data-sort-key]").forEach((control) => {
    control.addEventListener("click", () => {
      if (!(control instanceof HTMLButtonElement)) return;
      const key = control.dataset.sortKey ?? "year";
      const type = control.dataset.sortType ?? "text";
      activeSort = {
        key,
        type,
        direction: activeSort.key === key && activeSort.direction === "asc" ? "desc" : "asc",
      };
      applySort();
    });
  });

  applySort();
}

function initRecordsFilters(table) {
  const section = table.closest("section") ?? document;
  const rows = Array.from(table.querySelectorAll("tbody tr"));
  const getControl = (selector) => {
    const control = section.querySelector(selector);
    return control instanceof HTMLInputElement || control instanceof HTMLSelectElement ? control : null;
  };
  const controls = {
    query: getControl("[data-filter='query']"),
    year: getControl("[data-filter='year']"),
    group: getControl("[data-filter='group']"),
    scene: getControl("[data-filter='scene']"),
  };

  if (!controls.query || !controls.year || !controls.group || !controls.scene) return;

  const { query: queryControl, year: yearControl, group: groupControl, scene: sceneControl } = controls;
  const applyFilters = () => {
    const query = queryControl.value.trim().toLowerCase();
    const year = yearControl.value;
    const group = groupControl.value;
    const scene = sceneControl.value;
    for (const row of rows) {
      if (!(row instanceof HTMLTableRowElement)) continue;
      const visible =
        (!query || (row.dataset.search ?? "").includes(query)) &&
        (!year || row.dataset.year === year) &&
        (!group || row.dataset.group === group) &&
        (!scene || row.dataset.scene === scene);
      row.hidden = !visible;
    }
  };

  [queryControl, yearControl, groupControl, sceneControl].forEach((control) =>
    control.addEventListener("input", applyFilters),
  );
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
        return;
      }

      const iframe = document.createElement("iframe");
      iframe.src = url;
      iframe.title = button.dataset.embedTitle ?? "YouTube";
      iframe.loading = "lazy";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      slot.replaceChildren(iframe);
      button.textContent = "閉じる";
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

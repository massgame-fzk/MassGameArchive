/** Keep the reading year visible without taking over manual navigation. */
export function setupYearNavigation(nav: HTMLElement, onCurrentChange?: (id: string) => void) {
  const shell = nav.closest<HTMLElement>(".scroll-hint-shell") ?? nav;
  const header = document.querySelector<HTMLElement>(".site-header");
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
  const items = links.flatMap((link) => {
    const section = document.getElementById(link.hash.slice(1));
    return section ? [{ link, section }] : [];
  });
  const events = new AbortController();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let current: HTMLAnchorElement | undefined;
  let frame = 0;
  let settleTimer = 0;
  let paused = false;
  let pausedAtY = window.scrollY;
  let lastManualInput = 0;
  let pointer: { id: number; x: number; y: number } | undefined;
  let jumpTarget: HTMLAnchorElement | undefined;

  const setCurrent = (link: HTMLAnchorElement | undefined) => {
    if (!link || current === link) return;
    current = link;
    for (const item of links) {
      if (item === link) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
    }
    onCurrentChange?.(link.hash.slice(1));
  };

  const revealCurrent = () => {
    if (!current || paused || pointer || nav.scrollWidth <= nav.clientWidth) return;
    const bounds = nav.getBoundingClientRect();
    const button = current.getBoundingClientRect();
    const left = bounds.left + nav.clientLeft;
    const right = left + nav.clientWidth;
    const margin = 20;
    let delta = 0;
    if (button.left < left + margin) delta = button.left - left - margin;
    else if (button.right > right - margin) delta = button.right - right + margin;
    const destination = Math.max(0, Math.min(nav.scrollWidth - nav.clientWidth, nav.scrollLeft + delta));
    if (Math.abs(destination - nav.scrollLeft) < 1) return;
    // Only move the bar; scrolling a link into view can also move the page.
    nav.scrollTo({ left: destination, behavior: reducedMotion.matches ? "instant" : "smooth" });
  };

  const update = () => {
    frame = 0;
    const height = shell.getBoundingClientRect().height;
    shell.parentElement?.style.setProperty("--music-year-nav-height", `${height}px`);
    const readingLine = (header?.getBoundingClientRect().height ?? 68) + height + 24;
    const item = items.findLast(({ section }) => section.getBoundingClientRect().top <= readingLine) ?? items[0];
    setCurrent(jumpTarget ?? item?.link);
  };

  const scheduleUpdate = () => {
    if (!frame) frame = requestAnimationFrame(update);
    window.clearTimeout(settleTimer);
    // Coalesce rapid scrolling and skip the years passed during an anchor jump.
    settleTimer = window.setTimeout(() => {
      jumpTarget = undefined;
      update();
      revealCurrent();
    }, 140);
  };

  const pauseFollowing = () => {
    paused = true;
    pausedAtY = window.scrollY;
    lastManualInput = performance.now();
    jumpTarget = undefined;
    // Stop an in-flight automatic movement before the user's gesture takes over.
    nav.scrollTo({ left: nav.scrollLeft, behavior: "instant" });
  };

  window.addEventListener("scroll", () => {
    if (paused && !pointer && Math.abs(window.scrollY - pausedAtY) >= 24 && performance.now() - lastManualInput > 180) {
      paused = false;
    }
    scheduleUpdate();
  }, { passive: true, signal: events.signal });
  window.addEventListener("resize", scheduleUpdate, { signal: events.signal });
  window.addEventListener("hashchange", scheduleUpdate, { signal: events.signal });

  nav.addEventListener("pointerdown", (event) => {
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    if (event.target === nav) pauseFollowing();
  }, { passive: true, signal: events.signal });
  nav.addEventListener("pointermove", (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const dx = Math.abs(event.clientX - pointer.x);
    const dy = Math.abs(event.clientY - pointer.y);
    if (dx > 8 && dx > dy) pauseFollowing();
  }, { passive: true, signal: events.signal });
  const releasePointer = (event: PointerEvent) => {
    if (pointer?.id === event.pointerId) pointer = undefined;
  };
  window.addEventListener("pointerup", releasePointer, { signal: events.signal });
  window.addEventListener("pointercancel", releasePointer, { signal: events.signal });
  nav.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) pauseFollowing();
  }, { passive: true, signal: events.signal });
  nav.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) pauseFollowing();
  }, { signal: events.signal });
  nav.addEventListener("focusin", pauseFollowing, { signal: events.signal });
  nav.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.defaultPrevented) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    if (!link || !items.some((item) => item.link === link)) return;
    paused = false;
    jumpTarget = link;
    setCurrent(link);
    revealCurrent();
    scheduleUpdate();
  }, { signal: events.signal });

  const observer = new ResizeObserver(scheduleUpdate);
  observer.observe(shell);
  if (header) observer.observe(header);
  for (const { section } of items) observer.observe(section);
  update();
  scheduleUpdate();

  return () => {
    events.abort();
    observer.disconnect();
    cancelAnimationFrame(frame);
    window.clearTimeout(settleTimer);
  };
}

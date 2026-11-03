import assert from "node:assert/strict";
import { setMaxListeners } from "node:events";
import test from "node:test";
import { setupYearNavigation } from "../src/lib/year-navigation.ts";

// Model layout and input events so timing/gesture regressions are reproducible.
function fixture(t, { reducedMotion = false, width = 300 } = {}) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let now = 1000;
  t.mock.method(performance, "now", () => now);
  const win = Object.assign(new EventTarget(), {
    scrollY: 0, setTimeout, clearTimeout,
    matchMedia: () => ({ matches: reducedMotion }),
  });
  class Element extends EventTarget {
    attributes = new Map();
    setAttribute(name, value) { this.attributes.set(name, value); }
    removeAttribute(name) { this.attributes.delete(name); }
    closest() { return this; }
  }
  const shell = {
    getBoundingClientRect: () => ({ height: 80 }),
    parentElement: { style: { setProperty() {} } },
  };
  const nav = Object.assign(new Element(), {
    scrollLeft: 0, clientLeft: 0, clientWidth: width, scrollWidth: 680,
    closest: () => shell,
    getBoundingClientRect: () => ({ left: 10, right: 10 + nav.clientWidth }),
    scrollTo: (options) => { calls.push(options); nav.scrollLeft = options.left; },
  });
  const calls = [];
  const changes = [];
  const links = Array.from({ length: 10 }, (_, index) => Object.assign(new Element(), {
    hash: `#year-${2026 - index}`,
    getBoundingClientRect: () => ({ left: 10 + index * 68 - nav.scrollLeft, right: 70 + index * 68 - nav.scrollLeft }),
  }));
  const sections = links.map((link, index) => ({
    id: link.hash.slice(1),
    getBoundingClientRect: () => ({ top: 300 + index * 1000 - win.scrollY }),
  }));
  nav.querySelectorAll = () => links;
  const observers = [];
  class ResizeObserver {
    disconnected = false;
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  const values = {
    window: win, Element, ResizeObserver,
    document: {
      querySelector: () => ({ getBoundingClientRect: () => ({ height: 76 }) }),
      getElementById: (id) => sections.find((section) => section.id === id),
    },
    requestAnimationFrame: (callback) => setTimeout(callback, 16),
    cancelAnimationFrame: clearTimeout,
  };
  const originals = new Map(Object.keys(values).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  // Browser AbortSignals have no listener warning limit; match that in Node.
  class Controller extends AbortController { constructor() { super(); setMaxListeners(0, this.signal); } }
  t.mock.method(globalThis, "AbortController", Controller);
  const cleanup = setupYearNavigation(nav, (id) => changes.push(id));
  t.after(() => {
    cleanup();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const advance = (ms = 200) => { now += ms; t.mock.timers.tick(ms); };
  const emit = (target, type, properties = {}) => {
    const event = new Event(type);
    for (const [key, value] of Object.entries(properties)) Object.defineProperty(event, key, { value });
    target.dispatchEvent(event);
  };
  const readYear = (index) => { win.scrollY = 300 + index * 1000 - 180; emit(win, "scroll"); };
  const visible = (index) => {
    const r = links[index].getBoundingClientRect();
    return r.left >= 10 && r.right <= 10 + nav.clientWidth;
  };
  advance();
  return { nav, win, links, calls, changes, observers, cleanup, advance, emit, readYear, visible };
}

test("visible reading years change highlight without moving the bar", (t) => {
  const f = fixture(t);
  f.readYear(2); f.advance();
  assert.equal(f.changes.at(-1), "year-2024");
  assert.equal(f.nav.scrollLeft, 0);
  assert.equal(f.calls.length, 0);
});

test("offscreen years are revealed with a small edge margin in either direction", (t) => {
  const f = fixture(t);
  f.readYear(5); f.advance();
  assert.ok(f.visible(5));
  assert.ok(f.links[5].getBoundingClientRect().left > 150, "do not center the year");
  assert.ok(Math.abs(310 - f.links[5].getBoundingClientRect().right - 20) < 1);
  f.readYear(0); f.advance();
  assert.ok(f.visible(0));
  assert.equal(f.nav.scrollLeft, 0);
});

test("manual horizontal browsing stays put until meaningful vertical reading resumes", (t) => {
  const f = fixture(t);
  f.emit(f.nav, "wheel", { deltaX: 240, deltaY: 0 });
  f.nav.scrollLeft = 300;
  f.advance(5000);
  f.emit(f.win, "resize"); f.advance();
  assert.equal(f.nav.scrollLeft, 300, "time and resize must not pull the bar back");
  f.win.scrollY += 5; f.emit(f.win, "scroll"); f.advance();
  assert.equal(f.nav.scrollLeft, 300, "ignore incidental vertical drift");
  f.win.scrollY += 60; f.emit(f.win, "scroll"); f.advance();
  assert.ok(f.visible(0));
});

test("rapid vertical scrolling reveals only the final reading year", (t) => {
  const f = fixture(t);
  for (const index of [3, 4, 6, 8]) { f.readYear(index); f.advance(50); }
  assert.equal(f.calls.length, 0);
  f.advance();
  assert.equal(f.changes.at(-1), "year-2018");
  assert.equal(f.calls.length, 1);
  assert.ok(f.visible(8));
});

test("an explicit year jump overrides manual pause and skips intermediate years", (t) => {
  const f = fixture(t);
  f.emit(f.nav, "focusin");
  f.emit(f.nav, "click", { target: f.links[8], button: 0 });
  assert.equal(f.changes.at(-1), "year-2018");
  assert.ok(f.visible(8));
  const afterClick = f.changes.length;
  for (const index of [2, 5, 8]) { f.readYear(index); f.advance(50); }
  f.advance();
  assert.equal(f.changes.length, afterClick);
  assert.equal(f.changes.at(-1), "year-2018");
});

test("touch swipes pause following until the pointer is released and reading resumes", (t) => {
  const f = fixture(t);
  f.emit(f.nav, "pointerdown", { pointerId: 1, clientX: 100, clientY: 100, target: f.links[0] });
  f.emit(f.nav, "pointermove", { pointerId: 1, clientX: 50, clientY: 102 });
  f.nav.scrollLeft = 300;
  f.readYear(1); f.advance();
  assert.equal(f.nav.scrollLeft, 300);
  f.emit(f.win, "pointercancel", { pointerId: 1 });
  f.readYear(0); f.advance();
  assert.ok(f.visible(0));
});

test("reduced motion reveals the year without animation", (t) => {
  const f = fixture(t, { reducedMotion: true });
  f.readYear(6); f.advance();
  assert.ok(f.visible(6));
  assert.equal(f.calls.at(-1).behavior, "instant");
});

test("a bar that fits the viewport does not scroll", (t) => {
  const f = fixture(t, { width: 800 });
  f.readYear(8); f.advance();
  assert.equal(f.calls.length, 0);
});

test("cleanup removes pending work and input handlers before filtered results remount", (t) => {
  const f = fixture(t);
  f.readYear(8);
  f.cleanup();
  const count = f.changes.length;
  f.advance(); f.readYear(7); f.advance();
  assert.equal(f.calls.length, 0);
  assert.equal(f.changes.length, count);
  assert.ok(f.observers.every((observer) => observer.disconnected));
});

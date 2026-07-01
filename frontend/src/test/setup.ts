import "@testing-library/jest-dom";

// Radix UI requires ResizeObserver (not in jsdom)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Radix UI requires PointerEvent (not in jsdom)
if (!global.PointerEvent) {
  class PointerEvent extends MouseEvent {
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
    }
  }
  global.PointerEvent = PointerEvent as any;
}

// window.matchMedia (not in jsdom)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Suppress React Router v6 future flag warnings
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (typeof args[0] === "string" && args[0].includes("React Router Future Flag Warning")) return;
  originalWarn(...args);
};

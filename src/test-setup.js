import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
beforeEach(() => {
  localStorage.clear();
  document.head.replaceChildren(
    ...["description", "theme-color"].map((name) => {
      const element = document.createElement("meta");
      element.name = name;
      element.content = "";
      return element;
    }),
  );
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

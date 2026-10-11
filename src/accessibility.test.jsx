import React from "react";
import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import axe from "axe-core";
import PublicApp from "./PublicApp";
import AdminApp from "./AdminApp";
import { PreferencesProvider } from "./preferences";
const site = {
  announcement: "School updates",
  announcementMy: "ကျောင်းသတင်း",
  news: [],
  photos: [],
};
async function audit() {
  const result = await axe.run(document.body, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
    },
    rules: { "color-contrast": { enabled: false } },
  });
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
}
for (const path of [
  "/",
  "/about",
  "/programmes",
  "/life",
  "/campus",
  "/team",
  "/gallery",
  "/news",
  "/contact",
])
  it(`WCAG structure and labels: ${path} in both languages`, async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ content: site, token: "test" }),
      })),
    );
    render(
      <PreferencesProvider>
        <PublicApp path={path} />
      </PreferencesProvider>,
    );
    await screen.findByText("School updates");
    await audit();
    fireEvent.click(
      screen.getByRole("button", { name: "မြန်မာ", exact: true }),
    );
    await audit();
  });
it("WCAG structure and labels: staff login", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })),
  );
  render(
    <PreferencesProvider admin>
      <AdminApp />
    </PreferencesProvider>,
  );
  await screen.findByRole("button", { name: /Sign in/ });
  await audit();
});

it("WCAG structure and labels: every staff dashboard tab in both languages", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) => ({
      ok: true,
      json: async () =>
        url === "/api/session"
          ? { user: "staff", csrf: "test" }
          : url === "/api/content"
            ? { content: site, version: "1" }
            : url === "/api/inbox"
              ? { items: [] }
              : url === "/api/health"
                ? { emailConfigured: true }
                : {
                    today: { visitors: 0, visits: 0 },
                    month: { visitors: 0, visits: 0 },
                    year: { visitors: 0, visits: 0 },
                    daily: [],
                    monthly: [],
                    yearly: [],
                    availableYears: ["2026"],
                    selectedYear: "2026",
                    selectedMonth: "10",
                    updated: new Date().toISOString(),
                  },
    })),
  );
  render(
    <PreferencesProvider admin>
      <AdminApp />
    </PreferencesProvider>,
  );
  await screen.findByRole("button", { name: "Gallery", exact: true });
  for (const tab of [
    "Overview & traffic",
    "Enquiries & visits",
    "Announcements & news",
    "Gallery",
  ]) {
    fireEvent.click(screen.getByRole("button", { name: tab, exact: true }));
    await audit();
  }
  fireEvent.click(screen.getByRole("button", { name: "မြန်မာ", exact: true }));
  for (const button of screen.getByRole("navigation", {name:"Dashboard sections"}).querySelectorAll("button")) { fireEvent.click(button); await audit(); }
});

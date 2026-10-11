import React from "react";
import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminApp from "./AdminApp";
import { PreferencesProvider } from "./preferences";
const site = {
  announcement: "School announcement",
  announcementMy: "",
  news: [],
  photos: [],
};
const item = {
  id: "request-1",
  createdKey: "123",
  version: "1",
  name: "Test parent",
  email: "parent@example.com",
  phone: "091234567",
  kind: "Book a school visit",
  date: "2099-01-01",
  message: "Please arrange a visit.",
  notes: "",
  created: "2026-10-11T10:00:00Z",
  status: "new",
  emailStatus: "not-configured",
};
const report = {
  today: { visitors: 2, visits: 3 },
  month: { visitors: 2, visits: 3 },
  year: { visitors: 2, visits: 3 },
  daily: [{ key: "2026-10-11", label: "11", visitors: 2, visits: 3 }],
  monthly: [{ key: "2026-10", label: "Oct", visitors: 2, visits: 3 }],
  yearly: [{ key: "2026", label: "2026", visitors: 2, visits: 3 }],
  selectedYear: "2026",
  selectedMonth: "10",
  availableYears: ["2026"],
  updated: "2026-10-11T10:00:00Z",
  firstTrackedDate: "2026-10-11",
};
function setup({ loggedIn = true, conflict = false } = {}) {
  let active = loggedIn;
  const fetch = vi.fn(async (url, options = {}) => {
    let data,
      status = 200;
    if (url === "/api/session") {
      if (options.method === "POST") {
        active = true;
        data = { user: "staff", csrf: "csrf-value" };
      } else if (options.method === "DELETE") {
        active = false;
        data = { ok: true };
      } else if (active) data = { user: "staff", csrf: "csrf-value" };
      else {
        status = 401;
        data = { error: "Sign in required." };
      }
    } else if (url === "/api/content") {
      if (options.method === "PUT") {
        if (conflict) {
          status = 409;
          data = { error: "Content changed. Reload before saving." };
        } else
          data = { content: JSON.parse(options.body).content, version: "2" };
      } else data = { content: structuredClone(site), version: "1" };
    } else if (url.startsWith("/api/inbox"))
      data =
        options.method === "PATCH"
          ? { item: { ...item, ...JSON.parse(options.body), version: "2" } }
          : { items: [item], cursor: null };
    else if (url === "/api/health") data = { emailConfigured: false };
    else if (url === "/api/media") data = { id: "uploaded-photo" };
    else if (url.startsWith("/api/analytics")) data = report;
    return { ok: status === 200, status, json: async () => data };
  });
  vi.stubGlobal("fetch", fetch);
  render(
    <PreferencesProvider admin>
      <AdminApp />
    </PreferencesProvider>,
  );
  return fetch;
}
it("shows login to unauthenticated users and signs in with supplied credentials", async () => {
  const fetch = setup({ loggedIn: false });
  await screen.findByRole("button", { name: "Sign in ↗" });
  expect(
    screen.queryByText("A clearer view of your school."),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Username"), {
    target: { value: "staff" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "test-password" },
  });
  fireEvent.submit(document.querySelector("#login-form"));
  expect(await screen.findByText("Signed in as staff")).toBeInTheDocument();
  expect(
    JSON.parse(
      fetch.mock.calls.find(
        ([url, options]) => url === "/api/session" && options.method === "POST",
      )[1].body,
    ),
  ).toEqual({ username: "staff", password: "test-password" });
});
it("loads traffic, changes daily/monthly/yearly views and persists the admin theme separately", async () => {
  setup();
  await screen.findByText("Signed in as staff");
  await screen.findByText("Updated 16:30 · Myanmar time");
  expect(document.querySelector("#metric-today")).toHaveTextContent("2");
  fireEvent.click(screen.getByRole("button", { name: "Monthly", exact: true }));
  expect(document.querySelector("#traffic-range")).toHaveTextContent(
    "month by month",
  );
  fireEvent.click(screen.getByRole("button", { name: "Yearly", exact: true }));
  expect(document.querySelector("#traffic-year-label")).not.toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "☾ Dark mode" }));
  expect(localStorage.getItem("guru-admin-theme")).toBe("dark");
  expect(localStorage.getItem("guru-theme")).toBeNull();
});
it("saves bilingual announcement and news through a CSRF-protected versioned request", async () => {
  const fetch = setup();
  await screen.findByText("Signed in as staff");
  await waitFor(() =>
    expect(document.querySelector("#announcement")).toHaveValue(
      "School announcement",
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Announcements & news" }));
  fireEvent.change(screen.getByLabelText("Announcement — English"), {
    target: { value: "Updated announcement" },
  });
  fireEvent.click(screen.getByRole("button", { name: "+ Add news" }));
  fireEvent.change(screen.getByLabelText("Title — English"), {
    target: { value: "School story" },
  });
  fireEvent.change(screen.getByLabelText("Story — English"), {
    target: { value: "New school news." },
  });
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: "Publish on the website",
      exact: true,
    }),
  );
  fireEvent.submit(document.querySelector("#content-form"));
  await screen.findByText(
    "Changes saved. Published content is now available on the website.",
  );
  const saved = fetch.mock.calls.find(
    ([url, options]) => url === "/api/content" && options.method === "PUT",
  )[1];
  expect(saved.headers["X-CSRF-Token"]).toBe("csrf-value");
  expect(JSON.parse(saved.body)).toMatchObject({
    version: "1",
    content: {
      announcement: "Updated announcement",
      news: [{ title: "School story", published: true }],
    },
  });
});
it("preserves unsaved content and reports version conflicts", async () => {
  setup({ conflict: true });
  await screen.findByText("Signed in as staff");
  await waitFor(() =>
    expect(document.querySelector("#announcement")).toHaveValue(
      "School announcement",
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Announcements & news" }));
  fireEvent.change(screen.getByLabelText("Announcement — English"), {
    target: { value: "Unsaved update" },
  });
  fireEvent.submit(document.querySelector("#content-form"));
  expect(
    await screen.findByText("Content changed. Reload before saving."),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Announcement — English")).toHaveValue(
    "Unsaved update",
  );
});
it("filters visit requests and saves internal notes/status without claiming a booking email", async () => {
  const fetch = setup();
  await screen.findByText("Signed in as staff");
  await waitFor(() =>
    expect(document.querySelector("#inbox-count")).toHaveTextContent("1 shown"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Enquiries & visits" }));
  fireEvent.change(screen.getByLabelText("Internal team notes"), {
    target: { value: "Call the family." },
  });
  fireEvent.change(screen.getByLabelText("Status", { exact: true }), {
    target: { value: "confirmed" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save status & notes" }));
  await screen.findByText(
    "Request updated. Status changes do not send an email; contact the family to confirm.",
  );
  const saved = fetch.mock.calls.find(
    ([url, options]) => url === "/api/inbox" && options.method === "PATCH",
  )[1];
  expect(JSON.parse(saved.body)).toMatchObject({
    status: "confirmed",
    notes: "Call the family.",
    version: "1",
  });
  expect(saved.headers["X-CSRF-Token"]).toBe("csrf-value");
});
it("uploads a photo then persists its caption and publication setting", async () => {
  const fetch = setup();
  await screen.findByText("Signed in as staff");
  await waitFor(() =>
    expect(document.querySelector("#announcement")).toHaveValue(
      "School announcement",
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Gallery", exact: true }));
  fireEvent.change(screen.getByLabelText("Photo", { exact: true }), {
    target: {
      files: [new File(["test-image"], "photo.jpg", { type: "image/jpeg" })],
    },
  });
  fireEvent.change(screen.getByLabelText("Caption — English"), {
    target: { value: "A school memory" },
  });
  fireEvent.submit(document.querySelector("#photo-form"));
  await screen.findByText("Photo uploaded and saved.");
  const saved = fetch.mock.calls.find(
    ([url, options]) => url === "/api/content" && options.method === "PUT",
  )[1];
  expect(JSON.parse(saved.body).content.photos[0]).toMatchObject({
    id: "uploaded-photo",
    caption: "A school memory",
    published: true,
  });
});
it("signs out and removes private dashboard data from the rendered page", async () => {
  const fetch = setup();
  await screen.findByText("Signed in as staff");
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await screen.findByText("Signed out.");
  expect(screen.queryByText("Test parent")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign in ↗" })).toBeInTheDocument();
  expect(
    fetch.mock.calls.find(
      ([url, options]) => url === "/api/session" && options.method === "DELETE",
    )[1].headers["X-CSRF-Token"],
  ).toBe("csrf-value");
});

it("exports the selected traffic period as CSV", async () => {
  setup();
  await screen.findByText("Updated 16:30 · Myanmar time");
  const create = vi.fn(() => "blob:test-export");
  const revoke = vi.fn();
  vi.stubGlobal(
    "URL",
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke }),
  );
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  fireEvent.click(screen.getByRole("button", { name: "Monthly", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "Download CSV ↓" }));
  expect(create).toHaveBeenCalledOnce();
  expect(create.mock.calls[0][0].type).toBe("text/csv;charset=utf-8");
  expect(click).toHaveBeenCalledOnce();
  expect(click.mock.instances[0].download).toMatch(/^guru-traffic-monthly-/);
});

it("removes an uploaded photo from published content without deleting its stored image", async () => {
  const fetch = setup();
  await screen.findByText("Signed in as staff");
  await waitFor(() =>
    expect(document.querySelector("#announcement")).toHaveValue(
      "School announcement",
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Gallery", exact: true }));
  fireEvent.change(screen.getByLabelText("Photo", { exact: true }), {
    target: {
      files: [new File(["test-image"], "photo.jpg", { type: "image/jpeg" })],
    },
  });
  fireEvent.change(screen.getByLabelText("Caption — English"), {
    target: { value: "A school memory" },
  });
  fireEvent.submit(document.querySelector("#photo-form"));
  await screen.findByText("Photo uploaded and saved.");
  fireEvent.click(screen.getByRole("button", { name: "Remove from website" }));
  await screen.findByText(
    "Photo removed from the website. Stored image retained.",
  );
  const saves = fetch.mock.calls.filter(
    ([url, options]) => url === "/api/content" && options.method === "PUT",
  );
  expect(JSON.parse(saves.at(-1)[1].body).content.photos).toEqual([]);
  expect(
    fetch.mock.calls.some(
      ([url, options]) => url === "/api/media" && options.method === "DELETE",
    ),
  ).toBe(false);
});

import React from "react";
import { describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import PublicApp from "./PublicApp";
import { PreferencesProvider } from "./preferences";
import { EnquiryForm } from "./components/EnquiryForm";
const content = {
  announcement: "School announcement",
  announcementMy: "ကျောင်းသတင်း",
  news: [],
  photos: [],
};
function responses(url) {
  return Promise.resolve({
    ok: true,
    json: async () =>
      url === "/api/content"
        ? { content }
        : url === "/api/enquiry"
          ? { token: "signed-test-token" }
          : { ok: true },
  });
}
const setup = (path = "/") => {
  vi.stubGlobal("fetch", vi.fn(responses));
  return render(
    <PreferencesProvider>
      <PublicApp path={path} />
    </PreferencesProvider>,
  );
};
describe("React public website", () => {
  it("keeps nine real page links and changes the theme and language preferences", async () => {
    setup();
    await screen.findByText("School announcement");
    expect(
      screen
        .getByRole("navigation", { name: "Main navigation" })
        .querySelectorAll("a"),
    ).toHaveLength(9);
    expect(
      screen.getByRole("link", { name: "Programmes", exact: true }),
    ).toHaveAttribute("href", "/programmes");
    fireEvent.click(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    );
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("guru-theme")).toBe("dark");
    fireEvent.click(screen.getByRole("button", { name: "မြန်မာ" }));
    expect(document.documentElement.lang).toBe("my");
    expect(localStorage.getItem("guru-language")).toBe("my");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "ငယ်ရွယ်သော",
    );
  });
  it("keeps gallery categories, expansion, photo viewer and closure working", async () => {
    setup("/gallery");
    await screen.findByText("School announcement");
    expect(screen.getByText("Showing 8 of 50 photos.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Trips", exact: true }));
    expect(screen.getByText("Showing 8 of 12 photos.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show all photos" }));
    expect(screen.getByText("Showing 12 of 12 photos.")).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole("button", {
        name: /School trip — exploring together/,
      })[0],
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    fireEvent.click(screen.getByRole("button", { name: "Close photo viewer" }));
    expect(document.querySelector("dialog").open).toBe(false);
  });
  it("filters campus photos without changing the rest of the page", async () => {
    setup("/campus");
    await screen.findByText("School announcement");
    fireEvent.click(screen.getByRole("button", { name: "Play", exact: true }));
    expect(
      screen.queryByRole("button", { name: /Preschool classrooms/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Indoor playground/ }),
    ).toBeInTheDocument();
  });
  it("shows only published news and gallery uploads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            content: {
              ...content,
              news: [
                {
                  id: "1",
                  title: "Published news",
                  body: "A school update",
                  date: "2026-10-11",
                  published: true,
                },
                {
                  id: "2",
                  title: "Private draft",
                  body: "Hidden",
                  date: "2026-10-11",
                  published: false,
                },
              ],
            },
          }),
        }),
      ),
    );
    render(
      <PreferencesProvider>
        <PublicApp path="/news" />
      </PreferencesProvider>,
    );
    expect(await screen.findByText("Published news")).toBeInTheDocument();
    expect(screen.queryByText("Private draft")).not.toBeInTheDocument();
  });
  it("does not track visitors who request Do Not Track", async () => {
    Object.defineProperty(navigator, "doNotTrack", {
      value: "1",
      configurable: true,
    });
    setup();
    await screen.findByText("School announcement");
    expect(fetch.mock.calls.some(([url]) => url === "/api/traffic")).toBe(
      false,
    );
    Object.defineProperty(navigator, "doNotTrack", {
      value: undefined,
      configurable: true,
    });
  });
});
describe("React enquiry form", () => {
  it("requires a visit date for booking and removes it for other requests", () => {
    vi.stubGlobal("fetch", vi.fn(responses));
    render(
      <PreferencesProvider>
        <EnquiryForm />
      </PreferencesProvider>,
    );
    fireEvent.change(screen.getByLabelText("I would like to"), {
      target: { value: "Book a school visit" },
    });
    expect(screen.getByLabelText("Preferred visit date")).toBeRequired();
    fireEvent.change(screen.getByLabelText("I would like to"), {
      target: { value: "Short message" },
    });
    expect(
      screen.queryByLabelText("Preferred visit date"),
    ).not.toBeInTheDocument();
  });
  it("sends contact details once and reports durable saving, without claiming email delivery", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(responses));
    render(
      <PreferencesProvider>
        <EnquiryForm />
      </PreferencesProvider>,
    );
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Test parent" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "parent@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Your message"), {
      target: { value: "Please discuss admissions." },
    });
    await act(async () => {
      fireEvent.submit(document.querySelector("form"));
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => vi.advanceTimersByTimeAsync(2200));
    const sent = fetch.mock.calls.find(
      ([, options]) => options?.method === "POST",
    );
    expect(JSON.parse(sent[1].body)).toMatchObject({
      name: "Test parent",
      email: "parent@example.com",
      message: "Please discuss admissions.",
      token: "signed-test-token",
    });
    expect(screen.getByRole("status")).toHaveTextContent("saved for our team");
    expect(screen.getByRole("status")).not.toHaveTextContent("delivered");
  });
  it("preserves entered details when saving fails", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((url, options) =>
        options?.method === "POST"
          ? Promise.resolve({
              ok: false,
              status: 503,
              json: async () => ({ error: "Unavailable" }),
            })
          : responses(url),
      ),
    );
    render(
      <PreferencesProvider>
        <EnquiryForm />
      </PreferencesProvider>,
    );
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Test parent" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "parent@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Your message"), {
      target: { value: "Please contact me." },
    });
    await act(async () => {
      fireEvent.submit(document.querySelector("form"));
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => vi.advanceTimersByTimeAsync(2200));
    expect(screen.getByLabelText("Your name")).toHaveValue("Test parent");
    expect(screen.getByRole("status")).toHaveTextContent("could not be sent");
  });
});

it("offers email or telephone contact when the enquiry service is unavailable", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({ error: "Unavailable" }),
    })),
  );
  render(
    <PreferencesProvider>
      <EnquiryForm />
    </PreferencesProvider>,
  );
  fireEvent.focus(screen.getByLabelText("Your name"));
  expect(
    await screen.findByText(
      "Online enquiries are temporarily unavailable. Please email or call our team.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Send message ↗︎" })).toBeDisabled();
});

it("excludes hidden existing photos from gallery counts, filters and image viewer", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url) =>
      Promise.resolve({
        ok: true,
        json: async () =>
          url === "/api/content"
            ? {
                content: {
                  ...content,
                  hiddenGallery: ["gallery-update-6222095624409125895.webp"],
                },
              }
            : { ok: true },
      }),
    ),
  );
  render(
    <PreferencesProvider>
      <PublicApp path="/gallery" />
    </PreferencesProvider>,
  );
  await screen.findByText("Showing 8 of 49 photos.");
  fireEvent.click(screen.getByRole("button", { name: "Show all photos" }));
  expect(
    screen.queryByRole("button", {
      name: "School trip — exploring together ↗︎",
    }),
  ).not.toBeInTheDocument();
  expect(
    document.querySelector(
      'img[src="/assets/gallery-update-6222095624409125895.webp"]',
    ),
  ).toBeNull();
});
it("separates graduation and trips and includes graduation in school events", async () => {
  setup("/gallery");
  await screen.findByText("School announcement");
  fireEvent.click(
    screen.getByRole("button", { name: "Graduation", exact: true }),
  );
  expect(screen.getByText("Showing 8 of 10 photos.")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /School trip — exploring together/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Events", exact: true }));
  expect(screen.getByText("Showing 8 of 10 photos.")).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Student life", exact: true }),
  );
  expect(screen.getByText("Showing 6 of 6 photos.")).toBeInTheDocument();
});

it("filters published gallery photos by album without including hidden existing photos", async () => {
  const { Gallery } = await import("./components/Gallery");
  const { galleryPhotos } = await import("./content/gallery");
  render(
    <PreferencesProvider>
      <Gallery
        openPhoto={() => {}}
        photos={[
          {
            id: "album-photo",
            caption: "Graduation memory",
            category: "graduation",
            published: true,
            album: "Graduation 2026",
          },
          {
            id: "draft-photo",
            caption: "Draft",
            published: false,
            album: "Private album",
          },
        ]}
        existingAlbums={{ [galleryPhotos[0].image]: "Hidden album" }}
        hiddenGallery={[galleryPhotos[0].image]}
      />
    </PreferencesProvider>,
  );
  expect(
    screen.queryByRole("option", { name: "Private album" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: "Hidden album" }),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Browse an album"), {
    target: { value: "Graduation 2026" },
  });
  expect(screen.getByText("Showing 1 of 1 photos.")).toBeInTheDocument();
  expect(
    screen.getByRole("img", { name: "Graduation memory" }),
  ).toBeInTheDocument();
});

it('mobile navigation returns keyboard focus to its toggle on Escape',async()=>{
 setup('/');await screen.findByText('School announcement');
 const toggle=screen.getByRole('button',{name:'Open navigation',exact:true});
 fireEvent.click(toggle);screen.getByRole('link',{name:'Contact us',exact:true}).focus();
 fireEvent.keyDown(document,{key:'Escape'});
 expect(toggle).toHaveAttribute('aria-expanded','false');expect(toggle).toHaveFocus();
 expect(document.getElementById('main')).toHaveAttribute('tabindex','-1');
});

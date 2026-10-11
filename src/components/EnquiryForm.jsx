import React, { useRef, useState } from "react";
import { usePreferences } from "../preferences";
import { request, yangonDate } from "../api";
const kinds = [
  "General enquiry",
  "Programme discussion",
  "Short message",
  "Book a school visit",
];
export function EnquiryForm() {
  const { t } = usePreferences();
  const [kind, setKind] = useState(kinds[0]);
  const [busy, setBusy] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [status, setStatus] = useState({ text: "", state: "" });
  const proof = useRef(null);
  const preparing = useRef(null);
  const ready = useRef(0);
  async function prepare() {
    if (proof.current && Date.now() - ready.current < 50 * 60000) return;
    if (!preparing.current)
      preparing.current = request("/api/enquiry")
        .then((data) => {
          proof.current = data.token;
          setPrepared(true);
          ready.current = Date.now();
        })
        .finally(() => {
          preparing.current = null;
        });
    return preparing.current;
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const fields = Object.fromEntries(new FormData(form));
    setBusy(true);
    setStatus({ text: "Sending your message…", state: "" });
    try {
      await prepare();
      const wait = 2100 - (Date.now() - ready.current);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      await request("/api/enquiry", {
        method: "POST",
        body: JSON.stringify({
          ...fields,
          token: proof.current,
        }),
      });
      form.reset();
      setKind(kinds[0]);
      proof.current = null;
      setStatus({
        text: "Thank you! Your enquiry has been saved for our team. We will contact you to confirm visit requests.",
        state: "success",
      });
    } catch (error) {
      if ([400, 403, 409].includes(error.status)) proof.current = null;
      setStatus({
        text: "Your message could not be sent. Please try again, or email or call our team.",
        state: "error",
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      id="enquiry-form"
      action="/api/enquiry"
      method="post"
      onSubmit={submit}
      aria-busy={busy}
      onFocus={() =>
        prepare().catch(() =>
          setStatus({
            text: "Online enquiries are temporarily unavailable. Please email or call our team.",
            state: "error",
          }),
        )
      }
    >
      <div className="form-grid">
        <label>
          {t("Your name")}
          <input name="name" autoComplete="name" maxLength={100} required />
        </label>
        <label>
          {t("Email address")}
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>
        <label>
          {t("Phone number (optional)")}
          <input name="phone" type="tel" autoComplete="tel" maxLength={40} />
        </label>
        <label>
          {t("I would like to")}
          <select
            name="kind"
            value={kind}
            onChange={(event) => {
              setKind(event.target.value);
            }}
          >
            {kinds.map((value) => (
              <option value={value} key={value}>
                {t(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("Programme of interest (optional)")}
          <select name="programme" defaultValue="">
            <option value="">{t("Choose a programme")}</option>
            {[
              "Early years",
              "Lower primary",
              "Upper primary",
              "Not sure yet",
            ].map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ))}
          </select>
        </label>
        {kind === kinds[3] && (
          <label className="visit-date">
            {t("Preferred visit date")}
            <input name="date" type="date" min={yangonDate()} required />
          </label>
        )}
        <label className="message-field">
          {t("Your message")}
          <textarea
            name="message"
            rows={4}
            minLength={5}
            maxLength={3000}
            required
          />
        </label>
      </div>
      <div className="form-trap" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p className="form-note">
        {t(
          "We use your details to respond to your enquiry. School visits are subject to confirmation.",
        )}
      </p>
      <button className="button" type="submit" disabled={busy || !prepared}>
        {t("Send message ↗︎")}
      </button>
      <p
        id="enquiry-status"
        role="status"
        aria-live="polite"
        data-state={status.state}
      >
        {t(status.text)}
      </p>
    </form>
  );
}

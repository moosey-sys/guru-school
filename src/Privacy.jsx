import React from "react";
export default function Privacy() {
  return (
    <>
      <header>
        <a className="brand" href="/">
          GURU<small>INTERNATIONAL SCHOOL</small>
        </a>
        <a href="/">Back to the website ↗</a>
      </header>
      <main>
        <article className="card">
          <p className="eyebrow">YOUR PRIVACY</p>
          <h1>Enquiries and website statistics.</h1>
          <h2>When you contact us</h2>
          <p>
            We save your name, email, optional phone number, message and
            requested visit date so our school team can respond. These details
            are available only to authorised staff. Visit requests require
            confirmation by the school.
          </p>
          <h2>Anonymous visitor statistics</h2>
          <p>
            We use first-party cookies to estimate browser visitors and visits.
            A random browser identifier lasts up to one year; a visit identifier
            lasts 30 minutes. We store anonymous visit markers in private
            storage and group them by day, month and year in Myanmar time.
            Visitor statistics do not contain your name, email address, raw IP
            address, or browsing history.
          </p>
          <p>
            Different devices and cleared cookies can count as different
            visitors. Signed-in staff and known automated bots are excluded.
            Browsers sending Do Not Track or Global Privacy Control are not
            tracked. Blocking or clearing these cookies does not prevent you
            from reading the website or sending an enquiry.
          </p>
          <h2>Website reliability</h2>
          <p>
            To diagnose technical failures, we record an error category and page
            path. We do not include message text, form contents, passwords or
            error stacks in diagnostic events. Reports are rate limited and
            stored in our hosting provider’s runtime logs. Hosting access logs
            may contain network metadata under the provider’s retention policy.
          </p>
          <h2>Contact the school</h2>
          <p>
            For questions about an enquiry or your information, contact the team
            using the telephone and email details on the{" "}
            <a href="/contact">school contact page</a>.
          </p>
        </article>
      </main>
    </>
  );
}

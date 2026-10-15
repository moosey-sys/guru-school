export const siteOrigin = "https://www.guru-school.org";
export const pageTitle = (page) =>
  page.slug
    ? `${page.label} — Guru International School`
    : "Guru International School — San Chaung, Yangon";
export const pageUrl = (page) =>
  `${siteOrigin}/${page.slug === "privacy" ? "privacy.html" : page.slug}`;

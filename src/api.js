import { reportError } from "./monitoring";
export async function request(path, { csrf, ...options } = {}) {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (response.status >= 500) reportError("request");
  if (!response.ok)
    throw Object.assign(
      new Error(data.error || "Unable to complete the request."),
      { status: response.status },
    );
  return data;
}
export const yangonDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Yangon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

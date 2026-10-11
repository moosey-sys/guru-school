import React, { createContext, useContext, useEffect, useState } from "react";
import adminDictionary from "./content/admin-translations";
import dictionary from "./content/translations";
const Preferences = createContext();
export function PreferencesProvider({ children, admin = false }) {
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("light");
  const languageKey = admin ? "guru-admin-language" : "guru-language";
  const key = admin ? "guru-admin-theme" : "guru-theme";
  useEffect(() => {
    const system = matchMedia("(prefers-color-scheme: dark)");
    let saved;
    try {
      saved = localStorage.getItem(key);
      setLanguage(localStorage.getItem(languageKey) === "my" ? "my" : "en");
    } catch {
      /* Preferences work for this session without storage. */
    }
    setTheme(
      ["light", "dark"].includes(saved)
        ? saved
        : system.matches
          ? "dark"
          : "light",
    );
    const change = (event) => {
      let preference;
      try {
        preference = localStorage.getItem(key);
      } catch {}
      if (!["light", "dark"].includes(preference))
        setTheme(event.matches ? "dark" : "light");
    };
    system.addEventListener("change", change);
    return () => system.removeEventListener("change", change);
  }, [admin, key, languageKey]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? "#131a29" : "#2448a5";
  }, [language, theme]);
  const selectLanguage = (value) => {
    setLanguage(value);
    try {
      localStorage.setItem(languageKey, value);
    } catch {}
  };
  const toggleTheme = () =>
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(key, next);
      } catch {}
      return next;
    });
  const t = (value) => {
    if (language !== "my" || typeof value !== "string") return value;
    const text = value.trim();
    const translated = admin ? adminDictionary[text] : dictionary[text];
    return translated ? value.replace(text, translated) : value;
  };
  return (
    <Preferences.Provider
      value={{ language, selectLanguage, theme, toggleTheme, t }}
    >
      {children}
    </Preferences.Provider>
  );
}
export const usePreferences = () => useContext(Preferences);

// Semantic pairs keep Guru's existing navy, cream and yellow identity.
export const contrastPairs = {
  publicLight: {
    text: ["#18232b", "#faf8ef"],
    link: ["#2448a5", "#faf8ef"],
    secondary: ["#545d64", "#faf8ef"],
    button: ["#18232b", "#ffe14e"],
    error: ["#a33219", "#faf8ef"],
    success: ["#21653c", "#faf8ef"],
  },
  publicDark: {
    text: ["#f1f0e8", "#131a29"],
    link: ["#a6beff", "#131a29"],
    secondary: ["#b7c2d5", "#131a29"],
    button: ["#18232b", "#ffe14e"],
    error: ["#ffb5a5", "#131a29"],
    success: ["#a4e3b8", "#131a29"],
  },
  adminLight: {
    text: ["#192743", "#ffffff"],
    secondary: ["#5f6e85", "#ffffff"],
    link: ["#315ddb", "#ffffff"],
    primary: ["#ffffff", "#315ddb"],
  },
  adminDark: {
    text: ["#edf2ff", "#18243a"],
    secondary: ["#a2b1cd", "#18243a"],
    link: ["#94b2ff", "#18243a"],
    primary: ["#ffffff", "#315ddb"],
  },
};
export function contrast(foreground, background) {
  const luminance = (hex) => {
    const rgb = hex
      .slice(1)
      .match(/../g)
      .map((value) => parseInt(value, 16) / 255)
      .map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      );
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const a = luminance(foreground),
    b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

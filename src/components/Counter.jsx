import React, { useEffect, useRef, useState } from "react";
export function Counter({ value }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    let frame;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => {
      cancelAnimationFrame(frame);
      setDisplay(value);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || motion.matches) return finish();
        let start;
        const tick = (now) => {
          start ??= now;
          const progress = Math.min((now - start) / 1400, 1);
          setDisplay(
            String(Math.round(Number(value) * (1 - (1 - progress) ** 3))),
          );
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    observer.observe(ref.current);
    motion.addEventListener("change", finish);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", finish);
    };
  }, [value]);
  return (
    <span
      ref={ref}
      className="count-value"
      data-count={value}
      aria-label={value}
    >
      {display}
    </span>
  );
}

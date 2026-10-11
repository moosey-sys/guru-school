import React from "react";
import images from "../content/responsive-images.json";
export function ResponsiveImage({ src, ...props }) {
  const variant = images[src];
  return (
    <img
      src={src}
      decoding="async"
      {...(variant
        ? {
            srcSet: variant.srcSet,
            sizes: props.width && props.width <= 64 ? `${props.width}px` : "(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 700px",
          }
        : {})}
      {...props}
    />
  );
}

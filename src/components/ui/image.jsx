import React from "react";

// Απλό <Image fittingType="fill" /> για εικόνες που γεμίζουν το πλαίσιο.
export function Image({ src, alt = "", fittingType = "fill", className = "", style, eager = false, ...rest }) {
  const fit = fittingType === "fit" ? "contain" : "cover";
  return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" className={className} style={{ objectFit: fit, ...style }} {...rest} />;
}
export default Image;

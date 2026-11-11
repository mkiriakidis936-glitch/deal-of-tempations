import React from "react";

// Replacement for the Base44/Wix <Image fittingType="fill" /> helper.
export function Image({ src, alt = "", fittingType = "fill", className = "", style, ...rest }) {
  const fit = fittingType === "fit" ? "contain" : "cover";
  return <img src={src} alt={alt} loading="lazy" className={className} style={{ objectFit: fit, ...style }} {...rest} />;
}
export default Image;

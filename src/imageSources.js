// Scalable PDF exports only replace the matching original page assets.
// Custom/admin replacements and every other project retain their own sources.
export function fullImageSource(source) {
  const page = source?.match(/^\/projects\/red-bull\/page-(2[5-9]|3[0-3])\.webp$/);
  return page ? `/enhanced/red-bull/page-${page[1]}.svg` : source;
}
export function responsiveSources(source, small, asset, width = 3200) {
  const full = fullImageSource(source);
  return {
    src: asset(full === source ? small : full),
    srcSet: full === source
      ? `${asset(small)} 960w, ${asset(source)} ${width}w`
      : undefined,
  };
}

/**
 * Normalizes a YouTube / Vimeo / Loom share link into its embeddable iframe
 * URL. Returns null when the link doesn't match a known provider so callers
 * can fall back to a plain "open video" link instead of an iframe.
 */
export function toEmbedUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.pathname.startsWith("/embed/")) {
      return url.toString();
    }
    if (url.pathname.startsWith("/shorts/")) {
      const id = url.pathname.split("/")[2];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  }

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }

  if (host === "player.vimeo.com") {
    return url.toString();
  }

  if (host === "loom.com") {
    const id = url.pathname.split("/").filter(Boolean)[1];
    if (url.pathname.startsWith("/embed/")) return url.toString();
    return id ? `https://www.loom.com/embed/${id}` : null;
  }

  return null;
}

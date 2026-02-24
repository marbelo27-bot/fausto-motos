/**
 * Logo utility for PDF generation.
 * Loads the logo from /logo.svg and converts it to a base64 PNG
 * suitable for use with jsPDF's addImage().
 *
 * To replace the logo: update /public/logo.svg (or /public/logo.png)
 * with your own image file.
 */

let cachedLogoDataUrl: string | null = null;

/**
 * Loads the workshop logo and returns it as a base64 data URL.
 * Returns null if the logo cannot be loaded (e.g., during SSR).
 */
export async function getLogoDataUrl(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (cachedLogoDataUrl) return cachedLogoDataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 200;
        canvas.height = img.naturalHeight || 80;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        cachedLogoDataUrl = dataUrl;
        resolve(dataUrl);
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);

    // Try PNG first, fall back to SVG
    img.src = "/logo.png";

    // If PNG fails, try SVG
    img.onerror = () => {
      const svgImg = new Image();
      svgImg.crossOrigin = "anonymous";
      svgImg.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 200;
          canvas.height = 80;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(svgImg, 0, 0, 200, 80);
          const dataUrl = canvas.toDataURL("image/png");
          cachedLogoDataUrl = dataUrl;
          resolve(dataUrl);
        } catch {
          resolve(null);
        }
      };
      svgImg.onerror = () => resolve(null);
      svgImg.src = "/logo.svg";
    };
  });
}

/** Clears the cached logo (useful for testing or logo updates) */
export function clearLogoCache() {
  cachedLogoDataUrl = null;
}

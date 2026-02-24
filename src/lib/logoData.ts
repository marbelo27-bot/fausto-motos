/**
 * Logo utility for PDF generation.
 * Loads the logo from /logo-taller.png and converts it to a base64 PNG
 * suitable for use with jsPDF's addImage().
 *
 * To replace the logo: update /public/logo-taller.png with your own image file.
 * Fallback chain: logo-taller.png → LOGO1_PNG_CALCO.png → logo.png → logo.svg
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

    // Try logo-taller.png first, then LOGO1_PNG_CALCO.png, then logo.png, then fall back to SVG
    img.src = "/logo-taller.png";

    // If primary PNG fails, try LOGO1_PNG_CALCO.png, then logo.png, then SVG
    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.crossOrigin = "anonymous";
      fallbackImg.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = fallbackImg.naturalWidth || 200;
          canvas.height = fallbackImg.naturalHeight || 80;
          const ctx = canvas.getContext("2d");
          if (!ctx) { resolve(null); return; }
          ctx.drawImage(fallbackImg, 0, 0);
          const dataUrl = canvas.toDataURL("image/png");
          cachedLogoDataUrl = dataUrl;
          resolve(dataUrl);
        } catch {
          resolve(null);
        }
      };
      fallbackImg.onerror = () => {
        const logo2Img = new Image();
        logo2Img.crossOrigin = "anonymous";
        logo2Img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = logo2Img.naturalWidth || 200;
            canvas.height = logo2Img.naturalHeight || 80;
            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(null); return; }
            ctx.drawImage(logo2Img, 0, 0);
            const dataUrl = canvas.toDataURL("image/png");
            cachedLogoDataUrl = dataUrl;
            resolve(dataUrl);
          } catch {
            resolve(null);
          }
        };
        logo2Img.onerror = () => {
          const svgImg = new Image();
          svgImg.crossOrigin = "anonymous";
          svgImg.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = 200;
              canvas.height = 80;
              const ctx = canvas.getContext("2d");
              if (!ctx) { resolve(null); return; }
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
        logo2Img.src = "/logo.png";
      };
      fallbackImg.src = "/LOGO1_PNG_CALCO.png";
    };
  });
}

/** Clears the cached logo (useful for testing or logo updates) */
export function clearLogoCache() {
  cachedLogoDataUrl = null;
}

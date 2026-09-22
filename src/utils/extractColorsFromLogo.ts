/**
 * Extracts Primary and Secondary institutional brand colors from a crest/logo image.
 * Uses HTML5 Canvas API with quantization and color distance filtering.
 */

export interface ExtractedColors {
  primary: string;
  secondary: string;
}

/**
 * Calculates Euclidean RGB distance between two hex colors.
 */
export function getColorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 100;

  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.min(255, Math.max(0, Math.round(c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Extract dominant colors from an image File or Data URL string.
 */
export async function extractColorsFromLogo(
  imageSource: File | string
): Promise<ExtractedColors> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({ primary: '#0B6D2F', secondary: '#D4AF37' });
          return;
        }

        ctx.drawImage(img, 0, 0, 100, 100);
        const imgData = ctx.getImageData(0, 0, 100, 100);
        const data = imgData.data;

        const colorCounts: Map<string, number> = new Map();

        // Loop every 10th pixel (step = 40 bytes since 4 bytes per pixel)
        for (let i = 0; i < data.length; i += 40) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          // Skip near-white (r>240, g>240, b>240)
          if (r > 240 && g > 240 && b > 240) continue;

          // Skip near-black (r<20, g<20, b<20)
          if (r < 20 && g < 20 && b < 20) continue;

          // Quantize color into buckets of 16 to group similar tones
          const qr = Math.round(r / 16) * 16;
          const qg = Math.round(g / 16) * 16;
          const qb = Math.round(b / 16) * 16;

          const hex = rgbToHex(qr, qg, qb);
          colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
        }

        // Sort by frequency
        const sortedColors = Array.from(colorCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([hex]) => hex);

        if (sortedColors.length === 0) {
          resolve({ primary: '#0B6D2F', secondary: '#D4AF37' });
          return;
        }

        const primary = sortedColors[0];
        let secondary = '#D4AF37'; // Ghana gold fallback

        // Find second color that has at least 50 distance from primary
        for (let i = 1; i < sortedColors.length; i++) {
          const candidate = sortedColors[i];
          const dist = getColorDistance(primary, candidate);
          if (dist >= 50) {
            secondary = candidate;
            break;
          }
        }

        resolve({ primary, secondary });
      } catch (err) {
        console.warn('Color extraction failed:', err);
        resolve({ primary: '#0B6D2F', secondary: '#D4AF37' });
      }
    };

    img.onerror = () => {
      resolve({ primary: '#0B6D2F', secondary: '#D4AF37' });
    };

    if (imageSource instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        resolve({ primary: '#0B6D2F', secondary: '#D4AF37' });
      };
      reader.readAsDataURL(imageSource);
    } else {
      img.src = imageSource;
    }
  });
}

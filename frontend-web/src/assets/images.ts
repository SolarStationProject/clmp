// Placeholders SVG inline para la demo (no dependen de archivos externos)
const LOGO_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><rect width='120' height='120' rx='24' fill='%23005c2e'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='48' fill='white'>🗺️</text></svg>`;
const BASURAL_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'><rect width='400' height='200' fill='%23F1F5F9'/><text x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='40'>📸</text><text x='50%25' y='72%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='14' fill='%2394a3b8'>Fotografía de evidencia</text></svg>`;

export const IMAGES = {
    logo:    LOGO_PLACEHOLDER,
    basural1: BASURAL_PLACEHOLDER,
} as const;

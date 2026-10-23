/**
 * One icon per category, as an SVG path on a 24x24 viewBox.
 *
 * Drawn on the canvas with `Path2D`, which accepts SVG path strings directly, so
 * no DOM nodes are created per icon and the whole map stays a single draw call.
 *
 * Icons encode the category, not the vendor. Brand logos are deliberately not
 * used: 179 logos would be a large binary dependency, hotlinking them is
 * fragile, and vendor marks are trademarked. A category glyph scales and stays
 * legible at every zoom level.
 */
export const CATEGORY_ICONS: Record<string, string> = {
  cloud: 'M7 18.5a4.5 4.5 0 0 1-.6-8.97 6 6 0 0 1 11.53-1.6A4.2 4.2 0 0 1 17.4 18.5z',
  hosting:
    'M12 2.5c2.8 1.9 4.5 5.1 4.5 8.6l-2.1 1.6h-4.8L7.5 11c0-3.5 1.7-6.7 4.5-8.5zM9.6 14.2h4.8l1.6 4.3-2.5 1.7h-3l-2.5-1.7z',
  database:
    'M12 3c4.4 0 8 1.1 8 2.5v13c0 1.4-3.6 2.5-8 2.5s-8-1.1-8-2.5v-13C4 4.1 7.6 3 12 3zM12 5.2c-3.9 0-6 .9-6 1.4s2.1 1.4 6 1.4 6-.9 6-1.4-2.1-1.4-6-1.4z',
  warehouse: 'M4 20V10h4v10H4zm6 0V4h4v16h-4zm6 0v-7h4v7h-4z',
  storage: 'M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2.2h7A1.5 1.5 0 0 1 19 8.7v9.8A1.5 1.5 0 0 1 17.5 20h-13A1.5 1.5 0 0 1 3 18.5z',
  observability:
    'M12 5c5 0 9 4.5 9 7s-4 7-9 7-9-4.5-9-7 4-7 9-7zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2.6a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8z',
  errors:
    'M12 4a4 4 0 0 1 4 4v1h1.5a2.5 2.5 0 0 1 2.5 2.5V14h-2v3.5a1.5 1.5 0 0 1-1.5 1.5H7.5A1.5 1.5 0 0 1 6 17.5V14H4v-2.5A2.5 2.5 0 0 1 6.5 9H8V8a4 4 0 0 1 4-4zm-2.6 9.4l1.4-1.4 1.2 1.2 1.2-1.2 1.4 1.4-1.2 1.2 1.2 1.2-1.4 1.4-1.2-1.2-1.2 1.2-1.4-1.4 1.2-1.2z',
  incident:
    'M12 3a2 2 0 0 1 2 2v.6a6 6 0 0 1 4 5.6c0 3.4.7 5.4 1.7 6.4H4.3c1-1 1.7-3 1.7-6.4a6 6 0 0 1 4-5.6V5a2 2 0 0 1 2-2zm-3.2 17a3.2 3.2 0 0 0 6.4 0z',
  realtime: 'M13 2L4.5 13.5H11l-1 8.5L18.5 10H12z',
  streaming:
    'M3 8c2.7 0 2.7 2.4 5.4 2.4S11.1 8 13.8 8s2.7 2.4 5.4 2.4M3 14c2.7 0 2.7 2.4 5.4 2.4S11.1 14 13.8 14s2.7 2.4 5.4 2.4',
  workflow:
    'M9 3h6v3H9zM5 6h4v4H5zm10 0h4v4h-4zM7 14h4v4H7zm6 0h4v4h-4zM11 10h2v4h-2zm-4 4H5v3h2zm10 0h-2v3h2z',
  comms:
    'M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3z',
  notify:
    'M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM5.4 7.5l6.6 5 6.6-5z',
  auth: 'M12 3a4.5 4.5 0 0 1 4.5 4.5V10H18a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 6 10h1.5V7.5A4.5 4.5 0 0 1 12 3zm0 2.2a2.3 2.3 0 0 0-2.3 2.3V10h4.6V7.5A2.3 2.3 0 0 0 12 5.2z',
  payments:
    'M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v2.2H3zm0 4.4v6.6A1.5 1.5 0 0 0 4.5 19h15a1.5 1.5 0 0 0 1.5-1.5v-6.6zM15 13.5h3.5v3H15z',
  fintech:
    'M12 3l9 5v2H3V8zM5 12h2.5v6H5zm5.75 0h2.5v6h-2.5zm5.75 0H19v6h-2.5zM3 20h18v1.5H3z',
  search: 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM10.5 6a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm5.2 9.2l4.3 4.3-1.4 1.4-4.3-4.3z',
  ai: 'M12 3a6 6 0 0 1 6 6c0 1.2-.3 2.3-.9 3.2.5.8.9 1.8.9 2.8a5.5 5.5 0 0 1-11 0c0-1 .4-2 .9-2.8A5.9 5.9 0 0 1 6 9a6 6 0 0 1 6-6zm-2.4 13.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zm4.8 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z',
  devops:
    'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm8.6 1.5a8.6 8.6 0 0 0-.1-1.3l1.7-1.1-1.8-3-2 .8a8.6 8.6 0 0 0-2.2-1.3L14.4 3h-4.8l-.8 2a8.6 8.6 0 0 0-2.2 1.3l-2-.8-1.8 3 1.7 1.1a8.6 8.6 0 0 0 0 2.6l-1.7 1.1 1.8 3 2-.8a8.6 8.6 0 0 0 2.2 1.3l.8 2h4.8l.8-2a8.6 8.6 0 0 0 2.2-1.3l2 .8 1.8-3z',
  security:
    'M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6zm0 2.2L6 7.1v3.9c0 3.3 2.2 5.7 6 7 3.8-1.3 6-3.7 6-7V7.1z',
  flags: 'M6 3h1.8v18H6zm3 1.2h11l-2.6 3.4L20 11H9z',
  backend:
    'M4 4h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm0 10h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1zm2.5-7.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm0 10a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z',
  maps: 'M12 2.5a6 6 0 0 1 6 6c0 4.2-4.4 8.9-5.5 10a.7.7 0 0 1-1 0c-1.1-1.1-5.5-5.8-5.5-10a6 6 0 0 1 6-6zm0 3.9a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2z',
  integration:
    'M10.6 13.4a1 1 0 0 1 0-1.4l1.4-1.4a1 1 0 0 1 1.4 1.4l-1.4 1.4a1 1 0 0 1-1.4 0zm-2.4 2.4a1 1 0 0 1 0-1.4l3.4-3.4a1 1 0 0 1 1.4 1.4l-3.4 3.4a1 1 0 0 1-1.4 0zm3.2 2.2l1.4-1.4 1.8 1.8a2 2 0 0 1-2.8 2.8zm-4.2-8.4l1.4-1.4-1.8-1.8a2 2 0 0 0-2.8 2.8z',
  apimgmt:
    'M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm1.2 4.2h1.6v1.6H9.2zm3.2 0h1.6v1.6h-1.6zm3.2 0h1.6v1.6h-1.6zm-6.4 3.4h1.6v1.6H9.2zm3.2 0h1.6v1.6h-1.6zm3.2 0h1.6v1.6h-1.6z',
  business:
    'M9 4h6a2 2 0 0 1 2 2v1h2.5A1.5 1.5 0 0 1 21 8.5V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5A1.5 1.5 0 0 1 4.5 7H7V6a2 2 0 0 1 2-2zm0 3h6V6H9zm1 5.5h4V14h-4z',
};

/** Colours for the four delivery models, matching the existing legend. */
export const MODEL_COLORS: Record<string, { fill: string; stroke: string }> = {
  S: { fill: '#dbeaf7', stroke: '#17497a' },
  O: { fill: '#dcefdc', stroke: '#21571f' },
  B: { fill: '#e6e0f3', stroke: '#48358a' },
  C: { fill: '#f6e6cf', stroke: '#7a4a0c' },
};

export const MODEL_LABELS: Record<string, string> = {
  S: 'Managed',
  O: 'Open source',
  B: 'Both',
  C: 'Cloud',
};

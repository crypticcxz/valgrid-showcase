export function Icon({ d, size = 16 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      style={{ width: size, height: size }}
    >
      {Array.isArray(d) ? (
        d.map((p, i) => <path key={i} d={p} />)
      ) : (
        <path d={d} />
      )}
    </svg>
  )
}

export const ICONS = {
  home: ["M3 10.5 12 3l9 7.5", "M5 10v10h14V10", "M9 20v-6h6v6"],
  strategies: ["M3 3v18h18", "M7 14l4-4 4 4 5-5"],
  wallets: [
    "M21 12V7H5a2 2 0 0 1 0-4h14v4",
    "M3 5v14a2 2 0 0 0 2 2h16v-5",
    "M18 12h4v4h-4a2 2 0 0 1 0-4z",
  ],
  analytics: ["M3 3v18h18", "M8 17V9", "M13 17v-6", "M18 17V5"],
  arrowRight: ["M5 12h14", "M13 5l7 7-7 7"],
  external: ["M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", "M15 3h6v6", "M10 14 21 3"],
  plus: ["M12 5v14", "M5 12h14"],
  sidebar: ["M4 5h16v14H4z", "M9 5v14"],
  logout: [
    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
    "M16 17l5-5-5-5",
    "M21 12H9",
  ],
  shield: [
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  ],
  lock: ["M7 11V7a5 5 0 0 1 10 0v4", "M5 11h14v10H5z"],
  send: ["M22 2L11 13", "M22 2l-7 20-4-9-9-4z"],
  play: ["M5 3l14 9-14 9z"],
  stop: ["M5 5h14v14H5z"],
  archive: ["M21 8v13H3V8", "M1 3h22v5H1z", "M10 12h4"],
  clone: [
    "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2",
    "M16 2H10a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z",
  ],
  x: ["M18 6L6 18", "M6 6l12 12"],
  bell: [
    "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",
    "M10.3 21a1.94 1.94 0 0 0 3.4 0",
  ],
  star: [
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  ],
}

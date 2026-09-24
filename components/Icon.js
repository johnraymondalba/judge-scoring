/**
 * One authored icon set, one stroke weight, one corner treatment.
 *
 * Everything is drawn on a 24-unit grid with a 1.75 stroke, round caps and
 * round joins, so glyphs sit together at any size. Filled marks are the
 * exception and are noted where they occur. Nothing here is a text character
 * standing in for a drawing.
 */

const paths = {
  chevronRight: <path d="M9.5 5.5 16 12l-6.5 6.5" />,
  chevronLeft: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  chevronDown: <path d="M5.5 9.5 12 16l6.5-6.5" />,
  check: <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  minus: <path d="M5.5 12h13" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  signOut: (
    <>
      <path d="M13.5 4.5h-6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h6" />
      <path d="M10.5 12h10M17 8.5l3.5 3.5-3.5 3.5" />
    </>
  ),

  gavel: (
    <>
      <path d="M3.5 20.5h9" />
      <path d="m13.8 4.6 5.6 5.6M16.6 1.8l5.6 5.6M15.2 3.2l-6 6M20.8 8.8l-6 6" />
      <path d="m11.7 6.7-5.9 5.9a2.05 2.05 0 0 0 2.9 2.9l5.9-5.9" />
    </>
  ),
  clipboard: (
    <>
      <rect x="4.5" y="4.5" width="15" height="16" rx="2.5" />
      <path d="M9 4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V6H9V4.5Z" />
      <path d="M8.5 11.5h7M8.5 15.5h4.5" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V7a3.5 3.5 0 0 1 7 0v3.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.5h15M9.5 6.5V4.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.7" />
      <path d="M6.5 6.5 7.4 20a1 1 0 0 0 1 .9h7.2a1 1 0 0 0 1-.9l.9-13.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.5-5.8" />
      <path d="M20 4v4.5h-4.5" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11" />
      <path d="M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8v.2" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4.5 21 19.5H3L12 4.5Z" />
      <path d="M12 10v4M12 17.3v.2" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </>
  ),
  moon: <path d="M20 13.5A8.5 8.5 0 0 1 10.5 4a8.5 8.5 0 1 0 9.5 9.5Z" />,
  contrast: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4.5h8v5a4 4 0 0 1-8 0v-5Z" />
      <path d="M8 6H5.5v1.5A3 3 0 0 0 8 10.4M16 6h2.5v1.5A3 3 0 0 1 16 10.4" />
      <path d="M12 13.5v3M9 19.5h6" />
    </>
  ),
  backspace: (
    <>
      <path d="M8.5 5.5h10a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-10L3.5 12l5-6.5Z" />
      <path d="M11 9.5l5 5M16 9.5l-5 5" />
    </>
  ),
};

export default function Icon({ name, size = 20, className = "", title }) {
  const d = paths[name];
  if (!d) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : "true"}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {d}
    </svg>
  );
}

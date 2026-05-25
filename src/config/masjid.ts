const maradanaDefaults = {
  name: "Maradana Small Masjid",
  shortCode: "MSM",
  tagline: "Colombo-10",
  logoPath: "/small-masjid-logo.jpg",
  primaryColor: "#B89758",
  primaryDark: "#8A7345",
  accentColor: "#1A1A1A",
} as const;

/** .env treats `#` as a comment unless the value is quoted */
function envColor(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function envString(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

export const masjidConfig = {
  name: envString(process.env.NEXT_PUBLIC_MASJID_NAME, maradanaDefaults.name),
  shortCode: envString(
    process.env.NEXT_PUBLIC_MASJID_SHORT_CODE,
    maradanaDefaults.shortCode
  ),
  tagline: envString(
    process.env.NEXT_PUBLIC_MASJID_TAGLINE,
    maradanaDefaults.tagline
  ),
  logoPath: envString(
    process.env.NEXT_PUBLIC_LOGO_PATH,
    maradanaDefaults.logoPath
  ),
  primaryColor: envColor(
    process.env.NEXT_PUBLIC_PRIMARY_COLOR,
    maradanaDefaults.primaryColor
  ),
  primaryDark: envColor(
    process.env.NEXT_PUBLIC_PRIMARY_DARK,
    maradanaDefaults.primaryDark
  ),
  accentColor: envColor(
    process.env.NEXT_PUBLIC_ACCENT_COLOR,
    maradanaDefaults.accentColor
  ),
};

export const masjidDisplayName = masjidConfig.tagline
  ? `${masjidConfig.name} ${masjidConfig.tagline}`
  : masjidConfig.name;

export function getMasjidCssVars(): string {
  return `:root {
  --color-primary: ${masjidConfig.primaryColor};
  --color-primary-dark: ${masjidConfig.primaryDark};
  --color-accent: ${masjidConfig.accentColor};
}`;
}

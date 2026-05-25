const maradanaDefaults = {
  name: "Maradana Small Masjid",
  tagline: "Colombo-10",
  logoPath: "/small-masjid-logo.jpg",
  primaryColor: "#B89758",
  primaryDark: "#8A7345",
  accentColor: "#1A1A1A",
} as const;

export const masjidConfig = {
  name: process.env.NEXT_PUBLIC_MASJID_NAME ?? maradanaDefaults.name,
  tagline: process.env.NEXT_PUBLIC_MASJID_TAGLINE ?? maradanaDefaults.tagline,
  logoPath: process.env.NEXT_PUBLIC_LOGO_PATH ?? maradanaDefaults.logoPath,
  primaryColor:
    process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? maradanaDefaults.primaryColor,
  primaryDark:
    process.env.NEXT_PUBLIC_PRIMARY_DARK ?? maradanaDefaults.primaryDark,
  accentColor:
    process.env.NEXT_PUBLIC_ACCENT_COLOR ?? maradanaDefaults.accentColor,
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

/** Build area ID: e.g. MSM-FR (masjid short code + area short code) */
export function buildAreaId(
  masjidShortCode: string,
  areaShortCode: string
): string {
  const m = masjidShortCode.trim().toUpperCase().replace(/\s+/g, "");
  const a = areaShortCode.trim().toUpperCase().replace(/\s+/g, "");
  if (!m || !a) return "";
  return `${m}-${a}`;
}

/** Derive area short code from short name: "Focus Road" → "FR" */
export function deriveAreaShortCode(shortName: string): string {
  const trimmed = shortName.trim();
  if (!trimmed) return "";

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 6);
  }

  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  return letters.toUpperCase().slice(0, 4) || "AREA";
}

/** Default masjid short code from full name: "Maradana Small Masjid" → "MSM" */
export function deriveMasjidShortCode(masjidName: string): string {
  const words = masjidName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "MASJID";
  return words
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 6);
}

export function normalizeAreaId(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "");
}

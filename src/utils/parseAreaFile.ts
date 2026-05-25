import * as XLSX from "xlsx";

export interface ParsedAreaRow {
  name: string;
  shortName: string;
  shortCode: string;
  areaId: string;
}

const HEADER_ALIASES: Record<keyof ParsedAreaRow, string[]> = {
  name: ["name", "area name", "areaname", "full name", "fullname"],
  shortName: ["shortname", "short name", "short", "display name"],
  shortCode: ["shortcode", "short code", "code", "area code"],
  areaId: ["areaid", "area id", "id"],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_-]/g, " ");
}

function mapHeaders(headers: string[]): Partial<Record<keyof ParsedAreaRow, number>> {
  const map: Partial<Record<keyof ParsedAreaRow, number>> = {};
  const normalized = headers.map(normalizeHeader);

  (Object.keys(HEADER_ALIASES) as (keyof ParsedAreaRow)[]).forEach((key) => {
    const idx = normalized.findIndex((h) =>
      HEADER_ALIASES[key].some((alias) => h === alias || h.includes(alias))
    );
    if (idx >= 0) map[key] = idx;
  });

  return map;
}

function cellValue(row: unknown[], index: number | undefined): string {
  if (index === undefined) return "";
  const v = row[index];
  if (v == null) return "";
  return String(v).trim();
}

function parseSheetRows(rows: unknown[][]): ParsedAreaRow[] {
  if (rows.length < 2) return [];

  const headerRow = rows[0].map((c) => String(c ?? ""));
  const colMap = mapHeaders(headerRow);

  if (colMap.name === undefined && colMap.shortName === undefined) {
    throw new Error(
      "File must include column headers: name (or area name) and shortName (or short name)."
    );
  }

  const result: ParsedAreaRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => c == null || String(c).trim() === "")) continue;

    const name = cellValue(row, colMap.name ?? colMap.shortName);
    const shortName = cellValue(row, colMap.shortName ?? colMap.name);
    const shortCode = cellValue(row, colMap.shortCode);
    const areaId = cellValue(row, colMap.areaId);

    if (!name && !shortName) continue;

    result.push({
      name: name || shortName,
      shortName: shortName || name,
      shortCode,
      areaId,
    });
  }

  return result;
}

export async function parseAreaFile(file: File): Promise<ParsedAreaRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  }) as unknown[][];

  return parseSheetRows(rows);
}

export const AREA_IMPORT_TEMPLATE_CSV = `name,shortName,shortCode,areaId
Focus Road,Focus Road,FR,
Main Street,Main St,MS,
`;

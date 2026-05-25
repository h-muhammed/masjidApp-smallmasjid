import React, { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import { useCreateAreas } from "@/api/areaApi";
import { masjidConfig } from "@/config/masjid";
import {
  buildAreaId,
  deriveAreaShortCode,
  deriveMasjidShortCode,
  normalizeAreaId,
} from "@/utils/areaIdUtils";
import {
  AREA_IMPORT_TEMPLATE_CSV,
  parseAreaFile,
  ParsedAreaRow,
} from "@/utils/parseAreaFile";
import FileSaver from "file-saver";

export interface AreaDraftRow {
  key: string;
  name: string;
  shortName: string;
  shortCode: string;
  areaId: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type TabMode = "import" | "manual";

function newDraftRow(partial?: Partial<AreaDraftRow>): AreaDraftRow {
  return {
    key: crypto.randomUUID(),
    name: "",
    shortName: "",
    shortCode: "",
    areaId: "",
    ...partial,
  };
}

function rowsFromParsed(
  parsed: ParsedAreaRow[],
  masjidShortCode: string,
  autoGenerateIds: boolean
): AreaDraftRow[] {
  return parsed.map((row) => {
    const shortCode =
      row.shortCode.trim() ||
      deriveAreaShortCode(row.shortName || row.name);
    const areaId = row.areaId.trim()
      ? normalizeAreaId(row.areaId)
      : autoGenerateIds
        ? buildAreaId(masjidShortCode, shortCode)
        : "";

    return newDraftRow({
      name: row.name,
      shortName: row.shortName || row.name,
      shortCode,
      areaId,
    });
  });
}

function resolveAreaId(
  row: AreaDraftRow,
  masjidShortCode: string,
  autoGenerateIds: boolean
): string {
  if (!autoGenerateIds) return normalizeAreaId(row.areaId);
  const code =
    row.shortCode.trim() ||
    deriveAreaShortCode(row.shortName || row.name);
  return buildAreaId(masjidShortCode, code);
}

const ImportAreas = ({ isOpen, onClose }: Props) => {
  const [tab, setTab] = useState<TabMode>("import");
  const [masjidShortCode, setMasjidShortCode] = useState(
    masjidConfig.shortCode || deriveMasjidShortCode(masjidConfig.name)
  );
  const [autoGenerateIds, setAutoGenerateIds] = useState(true);
  const [rows, setRows] = useState<AreaDraftRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { mutate: createAreas, isPending } = useCreateAreas(
    () => {
      setToast("Areas saved successfully.");
      setRows([]);
      setTimeout(() => {
        setToast(null);
        onClose();
      }, 1500);
    },
    (msg) => setToast(msg)
  );

  const resetState = useCallback(() => {
    setTab("import");
    setMasjidShortCode(
      masjidConfig.shortCode || deriveMasjidShortCode(masjidConfig.name)
    );
    setAutoGenerateIds(true);
    setRows([]);
    setFileError(null);
    setToast(null);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const updateRow = (key: string, field: keyof AreaDraftRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const updated = { ...r, [field]: value };
        if (field === "shortName" && autoGenerateIds && !updated.shortCode) {
          updated.shortCode = deriveAreaShortCode(value);
        }
        if (
          autoGenerateIds &&
          (field === "shortCode" || field === "shortName" || field === "name")
        ) {
          const code =
            updated.shortCode.trim() ||
            deriveAreaShortCode(updated.shortName || updated.name);
          updated.shortCode = code;
          updated.areaId = buildAreaId(masjidShortCode, code);
        }
        if (!autoGenerateIds && field === "areaId") {
          updated.areaId = normalizeAreaId(value);
        }
        return updated;
      })
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setFileError(null);
    try {
      const parsed = await parseAreaFile(file);
      if (parsed.length === 0) {
        setFileError("No data rows found in file.");
        return;
      }
      setRows(rowsFromParsed(parsed, masjidShortCode, autoGenerateIds));
      setTab("import");
    } catch (err) {
      setFileError(
        err instanceof Error ? err.message : "Failed to parse file."
      );
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([AREA_IMPORT_TEMPLATE_CSV], {
      type: "text/csv;charset=utf-8;",
    });
    FileSaver.saveAs(blob, "area_import_template.csv");
  };

  const addManualRow = () => {
    setRows((prev) => [...prev, newDraftRow()]);
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const previewRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      resolvedId: resolveAreaId(row, masjidShortCode, autoGenerateIds),
    }));
  }, [rows, masjidShortCode, autoGenerateIds]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const ids = new Set<string>();

    previewRows.forEach((row, i) => {
      if (!row.name.trim()) errors.push(`Row ${i + 1}: Name is required.`);
      if (!row.shortName.trim())
        errors.push(`Row ${i + 1}: Short name is required.`);
      const id = row.resolvedId;
      if (!id) errors.push(`Row ${i + 1}: Area ID is required.`);
      else if (ids.has(id)) errors.push(`Row ${i + 1}: Duplicate ID "${id}".`);
      else ids.add(id);
    });

    if (previewRows.length === 0) errors.push("Add at least one area.");
    if (!masjidShortCode.trim())
      errors.push("Masjid short code is required (e.g. MSM).");

    return errors;
  }, [previewRows, masjidShortCode]);

  const handleSubmit = () => {
    if (validationErrors.length > 0) {
      setToast(validationErrors[0]);
      return;
    }

    createAreas(
      previewRows.map((row) => ({
        areaId: row.resolvedId,
        areaCode: row.resolvedId,
        name: row.name.trim(),
        shortName: row.shortName.trim(),
      }))
    );
  };

  const applyAutoIdsToAll = useCallback(() => {
    setRows((prev) =>
      prev.map((row) => {
        const code =
          row.shortCode.trim() ||
          deriveAreaShortCode(row.shortName || row.name);
        return {
          ...row,
          shortCode: code,
          areaId: buildAreaId(masjidShortCode, code),
        };
      })
    );
  }, [masjidShortCode]);

  useEffect(() => {
    if (autoGenerateIds && rows.length > 0) {
      applyAutoIdsToAll();
    }
  }, [masjidShortCode, autoGenerateIds, applyAutoIdsToAll, rows.length]);

  return (
    <>
      {toast && (
        <div className="toast toast-bottom toast-end z-[60]">
          <div
            className={`alert text-white ${
              toast.includes("success") ? "alert-success" : "alert-error"
            }`}
          >
            <span>{toast}</span>
          </div>
        </div>
      )}

      <Modal isOpen={isOpen} onClose={handleClose} title="Add Areas">
        <div className="space-y-4">
          {/* Masjid short code */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Masjid short code
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Used for auto IDs:{" "}
              <span className="font-mono font-semibold">
                {masjidShortCode || "MSM"}-FR
              </span>{" "}
              (masjid + area code)
            </p>
            <input
              type="text"
              className="input input-bordered w-full max-w-xs uppercase"
              value={masjidShortCode}
              onChange={(e) =>
                setMasjidShortCode(e.target.value.toUpperCase().slice(0, 6))
              }
              placeholder="MSM"
            />
          </div>

          {/* ID mode */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={autoGenerateIds}
                onChange={(e) => {
                  setAutoGenerateIds(e.target.checked);
                  if (e.target.checked) applyAutoIdsToAll();
                }}
              />
              <span className="text-sm text-slate-700">
                Auto-generate Area IDs ({masjidShortCode || "MSM"}-areaCode)
              </span>
            </label>
          </div>

          {/* Tabs */}
          <div className="tabs tabs-boxed bg-slate-100 p-1 w-fit">
            <button
              type="button"
              className={`tab ${tab === "import" ? "tab-active" : ""}`}
              onClick={() => setTab("import")}
            >
              Import CSV / Excel
            </button>
            <button
              type="button"
              className={`tab ${tab === "manual" ? "tab-active" : ""}`}
              onClick={() => {
                setTab("manual");
                if (rows.length === 0) setRows([newDraftRow()]);
              }}
            >
              Manual entry
            </button>
          </div>

          {tab === "import" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Upload a <strong>.csv</strong> or <strong>.xlsx</strong> file
                with columns: <code className="text-xs">name</code>,{" "}
                <code className="text-xs">shortName</code>, optional{" "}
                <code className="text-xs">shortCode</code>, optional{" "}
                <code className="text-xs">areaId</code>.
              </p>
              <div className="flex flex-wrap gap-2">
                <label className="btn btn-sm !bg-main !text-white border-0 cursor-pointer">
                  Choose file
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={downloadTemplate}
                >
                  Download template
                </button>
              </div>
              {fileError && (
                <p className="text-sm text-red-600">{fileError}</p>
              )}
            </div>
          )}

          {tab === "manual" && (
            <div>
              <button
                type="button"
                className="btn btn-sm btn-outline mb-3"
                onClick={addManualRow}
              >
                + Add row
              </button>
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="table table-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th>Name</th>
                    <th>Short name</th>
                    <th>Area code</th>
                    <th>Area ID</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.key}>
                      <td>
                        <input
                          className="input input-bordered input-xs w-full min-w-[120px]"
                          value={row.name}
                          onChange={(e) =>
                            updateRow(row.key, "name", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="input input-bordered input-xs w-full min-w-[100px]"
                          value={row.shortName}
                          onChange={(e) =>
                            updateRow(row.key, "shortName", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="input input-bordered input-xs w-20 uppercase"
                          value={row.shortCode}
                          onChange={(e) =>
                            updateRow(
                              row.key,
                              "shortCode",
                              e.target.value.toUpperCase()
                            )
                          }
                          placeholder="FR"
                        />
                      </td>
                      <td>
                        <input
                          className="input input-bordered input-xs w-28 font-mono uppercase"
                          value={
                            autoGenerateIds ? row.resolvedId : row.areaId
                          }
                          readOnly={autoGenerateIds}
                          onChange={(e) =>
                            updateRow(row.key, "areaId", e.target.value)
                          }
                          placeholder="MSM-FR"
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost text-red-600"
                          onClick={() => removeRow(row.key)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {validationErrors.length > 0 && rows.length > 0 && (
            <p className="text-sm text-amber-700">{validationErrors[0]}</p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" className="btn btn-ghost" onClick={handleClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn !bg-main !text-white border-0"
              disabled={isPending || rows.length === 0}
              onClick={handleSubmit}
            >
              {isPending ? "Saving…" : `Save ${rows.length} area(s)`}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ImportAreas;

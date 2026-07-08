"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Trash2, Smartphone, UploadCloud } from "lucide-react";
import {
  useAppReleasesQuery,
  useCreateAppReleaseMutation,
  useUpdateAppReleaseMutation,
  useDeleteAppReleaseMutation,
} from "@/redux/feature/appReleaseSlice";

type AppKey = "bdm" | "da";

const APP_OPTIONS: { value: AppKey; label: string }[] = [
  { value: "bdm", label: "Fiha Pharma (Shop app)" },
  { value: "da", label: "Delivery Assist (Rider app)" },
];

const appLabel = (a: string) => APP_OPTIONS.find((o) => o.value === a)?.label ?? a;

interface Release {
  id: number;
  app: AppKey;
  version: string;
  version_code: number;
  apk_url: string | null;
  release_notes: string;
  is_available: boolean;
  force_update: boolean;
  file_size: number;
  created_on: string;
}

const fmtSize = (bytes: number) => {
  const b = Number(bytes) || 0;
  if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${b} B`;
};

export default function AppUpdateContent() {
  const { data, isLoading, isError, refetch } = useAppReleasesQuery(undefined);
  const [createRelease, { isLoading: isUploading }] = useCreateAppReleaseMutation();
  const [updateRelease] = useUpdateAppReleaseMutation();
  const [deleteRelease] = useDeleteAppReleaseMutation();

  const releases: Release[] = data?.data || [];

  const [app, setApp] = useState<AppKey>("bdm");
  const [version, setVersion] = useState("");
  const [versionCode, setVersionCode] = useState("");
  const [notes, setNotes] = useState("");
  const [forceUpdate, setForceUpdate] = useState(false);
  const [available, setAvailable] = useState(true);
  const [apk, setApk] = useState<File | null>(null);

  const resetForm = () => {
    setApp("bdm");
    setVersion("");
    setVersionCode("");
    setNotes("");
    setForceUpdate(false);
    setAvailable(true);
    setApk(null);
  };

  const handleUpload = async () => {
    if (!version.trim() || !versionCode.trim() || !apk) {
      toast.error("Version, version code and an APK file are required.");
      return;
    }
    if (!apk.name.toLowerCase().endsWith(".apk")) {
      toast.error("Please select a valid .apk file.");
      return;
    }
    const fd = new FormData();
    fd.append("app", app);
    fd.append("version", version.trim());
    fd.append("version_code", versionCode.trim());
    fd.append("release_notes", notes);
    fd.append("force_update", String(forceUpdate));
    fd.append("is_available", String(available));
    fd.append("apk", apk);
    try {
      await createRelease(fd).unwrap();
      toast.success("Release uploaded.");
      resetForm();
    } catch (e: any) {
      toast.error(e?.data?.errors?.version_code?.[0] || e?.data?.message || "Upload failed.");
    }
  };

  const toggle = async (r: Release, field: "is_available" | "force_update") => {
    try {
      await updateRelease({ id: r.id, data: { [field]: !r[field] } }).unwrap();
      toast.success("Updated.");
    } catch {
      toast.error("Update failed.");
    }
  };

  const handleDelete = async (r: Release) => {
    if (!confirm(`Delete release ${r.version} (${r.version_code})?`)) return;
    try {
      await deleteRelease(r.id).unwrap();
      toast.success("Release deleted.");
    } catch {
      toast.error("Delete failed.");
    }
  };

  const inputClass =
    "w-full px-4 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent";

  return (
    <div className="px-4 py-8 text-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Smartphone className="h-7 w-7 text-purple-400" />
            App Update
          </h1>
          <p className="text-gray-300 mt-1">
            Upload a new APK and turn on availability so app users get a download button.
          </p>
        </div>

        {/* Upload card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-700">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-purple-400" /> Upload New Release
            </h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1.5">App</label>
              <select className={inputClass} value={app} onChange={(e) => setApp(e.target.value as AppKey)}>
                {APP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Version (e.g. 1.2.0)</label>
              <input className={inputClass} value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.2.0" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Version Code (number, e.g. 12)</label>
              <input type="number" min="1" className={inputClass} value={versionCode} onChange={(e) => setVersionCode(e.target.value)} placeholder="12" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1.5">Release Notes</label>
              <textarea rows={3} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What's new in this version…" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1.5">APK File</label>
              <input
                type="file"
                accept=".apk,application/vnd.android.package-archive"
                onChange={(e) => setApk(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer"
              />
              {apk && <p className="mt-1 text-xs text-gray-400">{apk.name} · {fmtSize(apk.size)}</p>}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="accent-purple-600 w-4 h-4" />
              Available for download
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={forceUpdate} onChange={(e) => setForceUpdate(e.target.checked)} className="accent-purple-600 w-4 h-4" />
              Force update (mandatory)
            </label>
          </div>
          <div className="px-5 py-4 border-t border-gray-700 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {isUploading ? "Uploading…" : "Upload Release"}
            </button>
          </div>
        </div>

        {/* Releases list */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700">
            <h2 className="text-base font-semibold">Releases</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-[#2c2e34]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">App</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Version</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Code</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Size</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">Available</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">Force</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">APK</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {isLoading ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading…</td></tr>
                ) : isError ? (
                  <tr><td colSpan={8} className="text-center py-12 text-red-400">Error. <button onClick={() => refetch()} className="underline">Retry</button></td></tr>
                ) : releases.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">No releases uploaded yet.</td></tr>
                ) : releases.map((r) => (
                  <tr key={r.id} className="hover:bg-[#2c2e34] transition">
                    <td className="px-4 py-3">
                      <span title={appLabel(r.app)} className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${r.app === "da" ? "bg-blue-500/15 text-blue-300 border-blue-500/30" : "bg-purple-500/15 text-purple-300 border-purple-500/30"}`}>
                        {r.app === "da" ? "Rider" : "Shop"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-white">{r.version}</div>
                      {r.release_notes ? <div className="text-xs text-gray-400 max-w-xs truncate">{r.release_notes}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-300 tabular-nums">{r.version_code}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-300 tabular-nums">{fmtSize(r.file_size)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggle(r, "is_available")}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${r.is_available ? "bg-green-500/15 text-green-300 border-green-500/30" : "bg-gray-700/40 text-gray-300 border-gray-600"}`}
                      >
                        {r.is_available ? "On" : "Off"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggle(r, "force_update")}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${r.force_update ? "bg-red-500/15 text-red-300 border-red-500/30" : "bg-gray-700/40 text-gray-300 border-gray-600"}`}
                      >
                        {r.force_update ? "Forced" : "Optional"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.apk_url ? (
                        <a href={r.apk_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-md text-purple-300 hover:bg-purple-500/15" title="Download APK">
                          <Download className="w-4 h-4" />
                        </a>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDelete(r)} className="inline-flex items-center justify-center w-8 h-8 rounded-md text-red-400 hover:bg-red-500/15" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

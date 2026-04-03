import { useNavigate } from "react-router-dom";
import { useRef } from "react";

type SchoolFormType = "sf1" | "sf2" | "sf5";

interface SchoolFormCardProps {
  type: SchoolFormType;
  name: string;
  schoolYear?: string;
  color: string;
  sectionId: number;
}

const SchoolFormCard: React.FC<SchoolFormCardProps> = ({
  type,
  name,
  schoolYear,
  color,
  sectionId,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleView = () => {
    if (!sectionId) {
      alert("Section ID missing. Cannot view form.");
      return;
    }
    navigate(`/forms/${type}/${sectionId}/view`);
  };

  const handleExport = async () => {
    try {
      const endpointMap: Record<SchoolFormType, string> = {
        sf1: "/api/adviser/sf1",
        sf2: "/api/adviser/sf2",
        sf5: "/api/adviser/sf5",
      };
      const url = endpointMap[type];
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) {
        const err = await response.json();
        alert(err.message || "Failed to export form");
        return;
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${type}_${schoolYear || ""}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export form");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("sf1File", file);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/sf1/parse`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to import SF1");
        return;
      }

      console.log("Imported students:", data.students);
      alert(`Imported ${data.students.length} students successfully`);
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to import SF1");
    } finally {
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-lg shadow-md text-[var(--color-text-50)] font-roboto overflow-hidden">
      <div style={{ backgroundColor: color }} className="p-4">
        <p className="text-lg font-bold">{name}</p>
        {schoolYear && <p className="text-xs opacity-90">SY {schoolYear}</p>}
      </div>

      <div className="px-3 py-2 bg-[var(--color-bg-50)] flex gap-2 rounded-b-lg">
        <button
          onClick={handleView}
          style={{ backgroundColor: color }}
          className="font-figtree text-[var(--color-text-50)] font-bold py-1 px-3 rounded text-sm transition hover:opacity-90"
        >
          View
        </button>

        {/* SF1 import button */}
        {type === "sf1" && (
          <>
            <button
              onClick={handleImportClick}
              className="flex items-center gap-x-1 font-figtree bg-[var(--color-bg-100)] hover:bg-[var(--color-bg-200)] text-[var(--color-text-900)] leading-5 py-1 px-3 rounded font-medium text-xs transition"
            >
              Import
              <img src="/import-icon.svg" className="size-4" />
            </button>
            <input
              type="file"
              accept=".xlsx,.csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </>
        )}

        <button
          onClick={handleExport}
          className="flex items-center gap-x-1 font-figtree bg-[var(--color-bg-100)] hover:bg-[var(--color-bg-200)] text-[var(--color-text-900)] leading-5 py-1 px-3 rounded font-medium text-xs transition"
        >
          Export
          <img src="/export-icon.svg" className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default SchoolFormCard;
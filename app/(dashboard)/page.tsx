"use client";

import { useEffect, useState } from "react";
import { UploadCloud } from "lucide-react";

type Job = {
  id: string;
  status: string;
  owner: string;
  createdAt: string;
  storagePath: string | null;
  fileType: string | null;
};

const statusColors: Record<string, string> = {
  RECEIVED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  EXTRACTING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  NEEDS_REVIEW: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  READY: "bg-green-500/10 text-green-500 border-green-500/20",
  ISSUING: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ISSUED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const jobId = data.job.id;

        // Automatically trigger extraction
        await triggerExtraction(jobId);

        // Wait a moment for extraction to process
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Redirect to review page
        window.location.href = `/jobs/${jobId}`;
      } else {
        alert("Error al subir: " + (data.error || "Error desconocido"));
        setUploading(false);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error al subir archivo");
      setUploading(false);
    }
  };

  const triggerExtraction = async (jobId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}/extract`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Auto-extraction failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Carta Porte Copilot</h1>
        <p className="text-muted-foreground">Sube tu documento para procesarlo automáticamente con IA.</p>
      </header>

      <main className="space-y-8">
        {/* Upload Area */}
        <div
          className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragActive
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-primary/50"
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Subiendo y extrayendo...</p>
            </div>
          ) : (
            <>
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />

              <div className="space-y-4">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                >
                  <span>Seleccionar archivo</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg"
                  />
                </label>
                <p className="text-sm text-muted-foreground">o arrastra y suelta aquí</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                PDF, Excel o Imágenes • Se procesará automáticamente
              </p>
            </>
          )}
        </div>

        {/* Jobs Table */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 border-b">
            <h3 className="font-semibold leading-none tracking-tight">Trabajos Recientes</h3>
            <p className="text-sm text-muted-foreground">
              {jobs.length} {jobs.length === 1 ? "trabajo" : "trabajos"} en total
            </p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="h-24 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                No hay trabajos. Sube un archivo para comenzar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">ID</th>
                      <th className="pb-3 font-medium">Estado</th>
                      <th className="pb-3 font-medium">Archivo</th>
                      <th className="pb-3 font-medium">Creado</th>
                      <th className="pb-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {jobs.map((job) => (
                      <tr key={job.id} className="text-sm hover:bg-muted/50 transition-colors">
                        <td className="py-3 font-mono text-xs">{job.id.slice(0, 8)}...</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[job.status] || "bg-gray-500/10 text-gray-500"
                              }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {job.storagePath?.split("/").pop() || "N/A"}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(job.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <a
                            href={`/jobs/${job.id}`}
                            className="text-primary hover:underline text-sm font-medium"
                          >
                            Revisar
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewJobPage() {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

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
                router.push("/");
                router.refresh();
            } else {
                alert("Upload failed: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8 font-sans">
            <header className="mb-8">
                <button
                    onClick={() => router.push("/")}
                    className="text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    ← Back to Dashboard
                </button>
                <h1 className="text-3xl font-bold tracking-tight">Create New Job</h1>
                <p className="text-muted-foreground">Upload a document to start processing</p>
            </header>

            <main className="max-w-2xl">
                <div
                    className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${dragActive
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
                            <p className="text-muted-foreground">Uploading...</p>
                        </div>
                    ) : (
                        <>
                            <svg
                                className="mx-auto h-12 w-12 text-muted-foreground mb-4"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48"
                                aria-hidden="true"
                            >
                                <path
                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <div className="space-y-2">
                                <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer rounded-md font-semibold text-primary hover:opacity-80 transition-opacity"
                                >
                                    <span>Upload a file</span>
                                    <input
                                        id="file-upload"
                                        name="file-upload"
                                        type="file"
                                        className="sr-only"
                                        onChange={handleFileChange}
                                        accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg"
                                    />
                                </label>
                                <p className="text-sm text-muted-foreground">or drag and drop</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                PDF, Excel, or Image files
                            </p>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

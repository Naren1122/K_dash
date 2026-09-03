"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, Loader2, Sparkles, AlertCircle, CheckCircle2, X } from "lucide-react";
import { extractTaskFromDocumentAction } from "@/lib/actions/ai";
import type { Assignee, Label } from "@/lib/types/types";
import type { DocumentTaskResponse } from "@/lib/schemas/aiSchema";

type DocumentTaskUploaderProps = {
  assignees: Assignee[];
  labels: Label[];
  onPopulate: (taskData: DocumentTaskResponse) => void;
};

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt", ".md", ".csv"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentTaskUploader({
  assignees,
  labels,
  onPopulate,
}: DocumentTaskUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function validateAndSetFile(file: File) {
    setError(null);
    setSuccessMessage(null);

    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file format (${ext}). Supported formats: PDF, Word (.docx), TXT, MD.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds the 10MB limit.");
      return;
    }

    setSelectedFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  }

  function clearSelectedFile() {
    setSelectedFile(null);
    setError(null);
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUploadAndExtract() {
    if (!selectedFile) {
      setError("Please select a document first.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("assignees", JSON.stringify(assignees.map((a) => ({ id: a.id, name: a.name, email: a.email }))));
      formData.append("labels", JSON.stringify(labels.map((l) => ({ id: l.id, name: l.name }))));
      formData.append("currentDate", new Date().toISOString());

      const result = await extractTaskFromDocumentAction(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      onPopulate(result.data);
      setSuccessMessage("Task fields successfully extracted from document! Review details below.");
      clearSelectedFile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract task from document.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.md,.csv"
        className="hidden"
        onChange={handleFileChange}
        disabled={isProcessing}
      />

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && !selectedFile && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-all ${
          isDragging
            ? "border-indigo-500 bg-indigo-50/70 dark:border-indigo-400 dark:bg-indigo-950/40"
            : selectedFile
            ? "border-indigo-300 bg-white/80 dark:border-indigo-800 dark:bg-slate-900/80"
            : "border-indigo-200/80 bg-white/50 hover:border-indigo-400 hover:bg-white/80 dark:border-indigo-800/60 dark:bg-slate-900/40 dark:hover:bg-slate-900/70 cursor-pointer"
        }`}
      >
        {selectedFile ? (
          <div className="flex w-full items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 shadow-2xs">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Ready for Gemini analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUploadAndExtract();
                }}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Extract Task</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelectedFile();
                }}
                disabled={isProcessing}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 cursor-pointer"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100/80 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              Click to browse or drag & drop project document
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              Supports PDF, Word (.docx), Text (.txt, .md) • Max 10MB
            </p>
          </>
        )}
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="text-[10px] font-bold underline cursor-pointer shrink-0"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

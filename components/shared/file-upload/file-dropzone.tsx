"use client";

import { AlertCircle, CheckCircle, FileIcon, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  accept: string[];
  maxSize: number;
  onFileSelect: (file: File) => void;
  currentFile: File | null;
  onRemove: () => void;
  label: string;
  description?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function FileDropzone({
  accept,
  maxSize,
  onFileSelect,
  currentFile,
  onRemove,
  label,
  description,
  error,
  icon,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file extension
      const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
      if (!ext || !accept.includes(ext)) {
        return `Invalid file format. Supported: ${accept.join(", ")}`;
      }

      // Check file size
      if (file.size > maxSize) {
        const maxMB = (maxSize / 1024 / 1024).toFixed(0);
        return `File too large. Maximum size: ${maxMB}MB`;
      }

      return null;
    },
    [accept, maxSize],
  );

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        return;
      }

      setValidationError(null);
      onFileSelect(file);
    },
    [validateFile, onFileSelect],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile],
  );

  const displayError = error || validationError;

  if (currentFile) {
    return (
      <div className="space-y-2">
        <div
          className={cn(
            "p-4 border-2 rounded-lg",
            displayError
              ? "border-red-200 bg-red-50"
              : "border-green-200 bg-green-50",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {displayError ? (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    displayError ? "text-red-900" : "text-green-900",
                  )}
                >
                  {currentFile.name}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    displayError ? "text-red-700" : "text-green-700",
                  )}
                >
                  {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="flex-shrink-0"
              aria-label={`Remove ${label}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {displayError && (
            <p className="mt-2 text-xs text-red-700">{displayError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-blue-500 bg-blue-50"
            : displayError
              ? "border-red-300 bg-red-50"
              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50",
        )}
      >
        <input
          type="file"
          accept={accept.join(",")}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={label}
          aria-describedby={description ? `${label}-description` : undefined}
        />
        <div className="pointer-events-none">
          {icon || <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />}
          <p className="text-sm font-medium text-gray-700 mb-2">
            {isDragging
              ? "Drop file here"
              : `Drag and drop your ${label.toLowerCase()} here`}
          </p>
          <p className="text-xs text-gray-500 mb-4">or click to browse</p>
          {description && (
            <p
              id={`${label}-description`}
              className="text-xs text-gray-500 mb-2"
            >
              {description}
            </p>
          )}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <FileIcon className="h-4 w-4" />
            Select File
          </div>
        </div>
      </div>
      {displayError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {displayError}
        </p>
      )}
    </div>
  );
}

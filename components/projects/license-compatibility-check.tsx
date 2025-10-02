"use client";

import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LicenseType } from "@/lib/types/database";
import {
  checkLicenseCompatibility,
  getLicenseRestrictions,
  suggestMergedLicense,
} from "@/lib/utils/license-compatibility";

interface LicenseCompatibilityCheckProps {
  licenses: LicenseType[];
  projectTitles: string[];
}

export function LicenseCompatibilityCheck({
  licenses,
  projectTitles,
}: LicenseCompatibilityCheckProps) {
  const compatibility = checkLicenseCompatibility(licenses);
  const suggestion = suggestMergedLicense(licenses);

  if (!compatibility.compatible) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 mb-1">
              License Incompatibility
            </h4>
            <p className="text-sm text-red-800">{compatibility.reason}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compatibility Status */}
      <div
        className={`border-2 rounded-lg p-4 ${
          compatibility.warnings && compatibility.warnings.length > 0
            ? "bg-yellow-50 border-yellow-200"
            : "bg-green-50 border-green-200"
        }`}
      >
        <div className="flex items-start gap-3">
          {compatibility.warnings && compatibility.warnings.length > 0 ? (
            <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h4
              className={`font-semibold mb-1 ${
                compatibility.warnings && compatibility.warnings.length > 0
                  ? "text-yellow-900"
                  : "text-green-900"
              }`}
            >
              {compatibility.warnings && compatibility.warnings.length > 0
                ? "Compatible with Considerations"
                : "Licenses Compatible"}
            </h4>

            {compatibility.warnings && compatibility.warnings.length > 0 && (
              <div className="space-y-2 mt-2">
                {compatibility.warnings.map((warning, index) => (
                  <p key={index} className="text-sm text-yellow-800">
                    • {warning}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Licenses */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-3">Current Project Licenses</h4>
        <div className="space-y-2">
          {licenses.map((license, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-700">{projectTitles[index]}</span>
              <Badge variant="outline" className="capitalize">
                {license}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested License */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">
              Suggested Merged License
            </h4>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="capitalize">
                {suggestion.suggestedLicense}
              </Badge>
              <span className="text-sm text-blue-800">{suggestion.reason}</span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-medium text-blue-900 mb-2">
                License Terms:
              </p>
              <ul className="space-y-1">
                {getLicenseRestrictions(suggestion.suggestedLicense).map(
                  (restriction, index) => (
                    <li key={index} className="text-xs text-blue-800">
                      • {restriction}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { apiUrl, uploadsUrl } from "../util/api.js";

export default function ReportPreview({ report }) {
  if (!report) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Preview</h3>
        <p className="text-sm text-gray-600">Select a report to preview.</p>
      </div>
    );
  }

  const isPdf = report.mime_type === "application/pdf";
  const isImage = report.mime_type?.startsWith("image/");
  const fileUrl = uploadsUrl(report.stored_name);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">
          Preview: {report.original_name}
        </h3>
        <a
          className="btn-primary"
          href={apiUrl(`/reports/${report.id}/download`)}
          target="_blank"
          rel="noreferrer"
        >
          Download
        </a>
      </div>

      {isPdf && (
        <embed
          src={fileUrl}
          type="application/pdf"
          className="w-full h-[480px] rounded-lg border"
        />
      )}

      {isImage && (
        <img
          src={fileUrl}
          alt={report.original_name}
          className="max-h-[480px] w-auto rounded-lg border"
        />
      )}

      {!isPdf && !isImage && (
        <p className="text-sm text-gray-600">
          No inline preview. Use Download.
        </p>
      )}
    </div>
  );
}

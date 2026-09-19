import React from 'react';
import { X, Download, FileText } from 'lucide-react';

export interface ProCollectionItem {
  id: string;
  name: string;
  emoji: string;
  pdf: string;
  description: string;
}

interface ProPdfViewerModalProps {
  collection: ProCollectionItem;
  onClose: () => void;
}

export function ProPdfViewerModal({ collection, onClose }: ProPdfViewerModalProps) {
  const pdfUrl = `/assets/${collection.pdf}`;

  return (
    <div 
      id="pdf-viewer-backdrop"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        id="pdf-viewer-container"
        className="w-full max-w-5xl h-[92vh] bg-[#F7F4FA] rounded-3xl border border-[#E5DCED] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-[#F3EDF7] border-b border-[#E6DBEE] py-3.5 px-4 sm:px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5DCED] flex items-center justify-center text-xl flex-shrink-0 shadow-2xs">
              {collection.emoji}
            </div>
            <div className="truncate">
              <h3 className="text-[16px] sm:text-[18px] font-bold text-[#1E1B22] truncate">
                {collection.name} Prompts
              </h3>
              <p className="text-[12px] text-[#6B7280] truncate">
                {collection.description} • PRO Collection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Download Button using <a> with download attribute */}
            <a
              href={pdfUrl}
              download={collection.pdf}
              id="pdf-download-btn"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#5B4296] bg-white hover:bg-[#F3EDF7] active:bg-[#EAE3F2] px-3.5 py-2 rounded-full border border-[#DFD3EC] transition-colors cursor-pointer shadow-2xs"
              title="Download PDF file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>

            {/* Back / Close button (✕) */}
            <button
              onClick={onClose}
              id="pdf-close-btn"
              className="p-2 rounded-full text-gray-600 hover:text-gray-950 hover:bg-[#EAE3F2] active:bg-[#DED3E8] transition-colors cursor-pointer"
              title="Close Viewer"
              aria-label="Close Viewer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Embedded PDF Reader */}
        <div className="flex-1 bg-white p-2 sm:p-3 overflow-hidden flex flex-col">
          <iframe 
            src={pdfUrl} 
            title={`${collection.name} PDF Viewer`}
            className="w-full h-full border-0 rounded-xl bg-[#FAF7FD]"
          />

          {/* Sub-bar */}
          <div className="pt-2 px-2 flex items-center justify-between text-[11.5px] text-[#6B7280]">
            <span className="flex items-center gap-1.5 font-medium">
              <FileText className="w-3.5 h-3.5 text-[#5B4296]" />
              {collection.pdf}
            </span>
            <span className="text-[#8E79B5] font-semibold">
              AI Prompt Library PRO Edition
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

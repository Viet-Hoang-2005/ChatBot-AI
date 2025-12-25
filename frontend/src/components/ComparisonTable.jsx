import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function ComparisonTable({ tools, comparisonTexts }) {
  const toolComparisons = comparisonTexts || [];

  // Template cột cho màn hình lớn: 1 cột tiêu chí + n cột công cụ
  const desktopColumns = `140px repeat(${Math.max(
    tools.length || 1,
    1
  )}, minmax(200px, 1fr))`;

  return (
    <div className="w-full">
      {/* Desktop / Tablet: hiển thị dạng bảng */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[720px] rounded-2xl border border-gray-700/50 bg-bubbleBot shadow-soft overflow-hidden">
          {/* Header: Các công cụ */}
          <div
            className="grid gap-0 border-b border-gray-700/50"
            style={{ gridTemplateColumns: desktopColumns }}
          >
            {/* Tiêu chí */}
            <div className="px-4 py-3 border-r border-gray-700/50 flex items-center">
              <h4 className="font-semibold text-white">Tiêu chí</h4>
            </div>

            {/* Tiêu đề công cụ */}
            {tools.map((tool, idx) => (
              <div
                key={idx}
                className="px-4 py-3 border-r border-gray-700/50 last:border-r-0 flex items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {tool.favicon && (
                    <img
                      src={tool.favicon}
                      alt=""
                      className="w-10 h-10 rounded-lg flex-shrink-0"
                      loading="lazy"
                    />
                  )}

                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-semibold text-white text-sm leading-tight truncate">
                      {tool.title}
                    </span>

                    {tool.link && (
                      <a
                        href={tool.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 transition-colors w-fit"
                        title="Truy cập website"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Truy cập</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Body */}
          <div
            className="grid gap-0 border-t border-gray-700/50"
            style={{ gridTemplateColumns: desktopColumns }}
          >
            {/* Đánh giá nhanh */}
            <div className="px-4 py-3 border-r border-gray-700/50 flex items-center">
              <h4 className="font-semibold text-white">Đánh giá nhanh</h4>
            </div>

            {/* Nội dung so sánh */}
            {tools.map((_, idx) => (
              <div
                key={idx}
                className="px-4 py-3 border-r border-gray-700/50 last:border-r-0"
              >
                <p className="text-gray-300 text-sm leading-relaxed">
                  {toolComparisons[idx] || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: mỗi công cụ là một card riêng */}
      <div className="md:hidden space-y-4">
        {tools.map((tool, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-gray-700/50 bg-bubbleBot p-4 shadow-soft"
          >
            {/* Tiêu đề công cụ */}
            <div className="flex items-start gap-3">
              {tool.favicon && (
                <img
                  src={tool.favicon}
                  alt=""
                  className="w-10 h-10 rounded-lg flex-shrink-0"
                  loading="lazy"
                />
              )}

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm leading-snug">
                  {tool.title}
                </p>

                {tool.link && (
                  <a
                    href={tool.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 transition-colors"
                    title="Truy cập website"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Truy cập</span>
                  </a>
                )}
              </div>
            </div>

            {/* Đánh giá nhanh */}
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-400 mb-1">
                Đánh giá nhanh
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">
                {toolComparisons[idx] || 'N/A'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

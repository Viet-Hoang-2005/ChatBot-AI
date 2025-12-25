import { useEffect, useRef } from 'react';
import { X } from "lucide-react";


export default function Modal({ open, title, iconUrl, link, details, summary, bestFor, onClose}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-xl max-h-[85vh] flex flex-col
                   bg-[#0f1218]/95 backdrop-blur border border-white/10 
                   rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header cố định */}
        <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-white/10">
          {/* Button đóng modal */}
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="absolute top-3 right-3 w-8 h-8 rounded-full
                      bg-white/10 hover:bg-white/20 border border-white/10
                      flex items-center justify-center
                      will-change-transform 
                      transition duration-300 hover:scale-110"
            title="Đóng"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Tên công cụ + logo */}
          <h3 className="text-lg font-semibold text-white pr-8 flex items-center gap-3">
            <span className="truncate">{title}</span>
            {iconUrl && (
              <img
                src={iconUrl}
                alt=""
                className="w-7 h-7 rounded-md flex-shrink-0"
                loading="lazy"
              />
            )}
          </h3>

        </div>

        {/* Nội dung */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
            <div className="space-y-6 text-gray-300 text-sm">              
              {/* Giới thiệu */}
              {summary && (
                <section>
                  <h4 className="font-semibold text-white mb-1">Giới thiệu:</h4>
                  <p>{summary}</p>
                </section>
              )}
              
              {/* Chi tiết */}
              {details?.overview?.length > 0 && (
                <section>
                  <h4 className="font-semibold text-white mb-1">Chi tiết:</h4>
                  <div className="space-y-1">
                    {details.overview.map((line, i) => <div key={i}>{line}</div>)}
                  </div>
                </section>
              )}
              
              {/* Ưu điểm */}
              {details?.advantages && (
                <section>
                  <h4 className="font-semibold text-white">✓ Ưu điểm</h4>
                  <ul className="list-disc ml-5 mt-1">
                    {details.advantages.map((adv, i) => <li key={i}>{adv}</li>)}
                  </ul>
                </section>
              )}
              
              {/* Nhược điểm */}
              {details?.disadvantages && (
                <section>
                  <h4 className="font-semibold text-white">✗ Nhược điểm</h4>
                  <ul className="list-disc ml-5 mt-1">
                    {details.disadvantages.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </section>
              )}
              
              {/* Hướng dẫn nhanh */}
              {details?.quickGuide && details.quickGuide.length > 0 && (
                <section>
                  <h4 className="font-semibold text-white">Hướng dẫn nhanh:</h4>
                  <ol className="list-decimal ml-5 mt-1">
                    {details.quickGuide.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </section>
              )}
              
              {/* Phù hợp nhất cho */}
              {bestFor && (
                <section>
                  <h4 className="font-semibold text-white">Phù hợp nhất cho:</h4>
                  <p className="mt-1">{bestFor}</p>
                </section>
              )}
            </div>
          </div>
        </div>

        {/* Footer với link */}
        {link && (
          <div className="flex-shrink-0 px-5 py-4 border-t border-white/10">
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-4 py-2 rounded-xl
                         bg-pink-500 hover:bg-pink-600 text-white 
                         transition text-sm font-semibold"
            >
              Mở trang công cụ
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
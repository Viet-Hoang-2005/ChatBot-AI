import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from "lucide-react";

export default function CustomSelect({ 
  label, 
  icon: Icon, 
  value, 
  options, 
  onChange, 
  placeholder = "-- Chọn --" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      {/* Label */}
      <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
         {Icon && <Icon className="w-4 h-4 text-gray-500" />} {label}
      </label>
      
      <div className="relative group">
        {/* Nút bấm mô phỏng Select input */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full text-left bg-black/20 border rounded-xl px-4 py-2.5 text-sm transition-all duration-200 flex items-center justify-between
            ${isOpen 
              ? 'border-pink-500 ring-1 ring-pink-500/30 text-white' 
              : 'border-white/10 text-white hover:border-blue-600/60'
            }
          `}
        >
          <span className={value ? "text-white" : "text-gray-500"}>
            {value || placeholder}
          </span>
          {/* Mũi tên xoay */}
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-pink-500' : ''}`} />
        </button>

        {/* Danh sách xổ xuống */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-[#1a1d24] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-[200px] overflow-y-auto custom-scrollbar">
            {options.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(opt)}
                className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors
                  ${value === opt 
                    ? 'bg-pink-500/10 text-pink-500 font-medium' // Style khi đang chọn
                    : 'text-gray-300 hover:bg-pink-500 hover:text-white' // Style khi hover
                  }
                `}
              >
                {opt}
                {value === opt && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
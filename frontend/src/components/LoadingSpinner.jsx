import React from "react";

export default function LoadingSpinner({ 
  message = "Đang xử lý...", 
  size = "md",
  color = "white",
  className = ""
}) {
  // Cấu hình kích thước
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-8 h-8 border-[3px]",
    lg: "w-10 h-10 border-4",
  };

  // Cấu hình màu sắc
  const colorClasses = {
    pink: "border-pink-500/30 border-t-pink-500",
    violet: "border-violet-500/30 border-t-violet-500",
    white: "border-white/20 border-t-white",
  };

  return (
    <div className={`flex flex-col items-center justify-center py-10 w-full h-full ${className}`}>
      <div 
        className={`rounded-full animate-spin ${sizeClasses[size] || sizeClasses.md} ${colorClasses[color] || colorClasses.pink}`} 
      />
      {message && (
        <p className="text-gray-400 text-sm mt-3 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
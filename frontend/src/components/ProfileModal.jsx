import { useEffect, useRef, useState } from 'react';
import { X, User, Save, Trash2, Briefcase, Calendar, MapPin, AlignLeft, VenusAndMars } from "lucide-react";
import CustomSelect from './CustomSelect'; 
import LoadingSpinner from "./LoadingSpinner.jsx";

export default function ProfileModal({ open, initialData, onClose, onSave, onDelete, isLoading}) {
  const dialogRef = useRef(null);
  
  // Dữ liệu form mặc định
  const [formData, setFormData] = useState({
    fullName: "",
    gender: "",
    ageGroup: "",
    country: "",
    customCountry: "",
    profession: "",
    customProfession: "", 
    description: ""
  });
  
  // Danh sách giới tính
  const genders = ["Nam", "Nữ", "Khác"];  
  
  // Danh sách độ tuổi
  const ageGroups = [
    "Trẻ em (< 6 tuổi)",
    "Học sinh (6 ~ 17 tuổi)",
    "Sinh viên (18 ~ 24 tuổi)",
    "Trưởng thành (25 ~ 40 tuổi)",
    "Trung niên (41 ~ 60 tuổi)",
    "Lão niên (> 60 tuổi)"
  ];
  
  // Danh sách quốc gia
  const countries = [
    "Việt Nam",
    "Hoa Kỳ",
    "Nhật Bản",
    "Hàn Quốc",
    "Trung Quốc",
    "Anh",
    "Pháp",
    "Đức",
    "Úc",
    "Canada",
    "Singapore",
    "Thái Lan",
    "Khác"
  ];

  // Danh sách ngành nghề
  const professions = [
    "Học sinh", 
    "Sinh viên", 
    "Giáo viên", 
    "IT", 
    "Data Analysis", 
    "DevOps", 
    "Designer", 
    "Management", 
    "Marketing", 
    "Khác"];

  // Load dữ liệu ban đầu khi mở modal
  useEffect(() => {
    if (open) {
      if (initialData) {
        // Nếu có dữ liệu nhưng không nằm trong list danh sách có sẵn -> Là custom
        const isCustomProf = initialData.profession && !professions.includes(initialData.profession) && initialData.profession !== "Khác";
        const isCustomCountry = initialData.country && !countries.includes(initialData.country) && initialData.country !== "Khác";

        setFormData({
          ...initialData,
          ageGroup: initialData.ageGroup || "",
          
          // Load Quốc gia
          country: isCustomCountry ? "Khác" : (initialData.country || ""),
          customCountry: isCustomCountry ? initialData.country : "",

          // Load Ngành nghề
          profession: isCustomProf ? "Khác" : (initialData.profession || ""),
          customProfession: isCustomProf ? initialData.profession : ""
        });
      } else {
        // Reset form về rỗng hoàn toàn
        setFormData({ 
            fullName: "", 
            gender: "", 
            ageGroup: "", 
            country: "", 
            customCountry: "",
            profession: "", 
            customProfession: "", 
            description: "" 
        });
      }
    }
  }, [open, initialData]);

  // Load data khi mở modal
  useEffect(() => {
    if (open && initialData) {
      setFormData({ ...formData, ...initialData });
    }
  }, [open, initialData]);

  // Đóng bằng ESC
  useEffect(() => {
    function onKey(e) { 
      if (e.key === 'Escape') onClose?.(); 
    }
    if (open) 
      document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Handler thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler thay đổi CustomSelect
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const finalProfession = formData.profession === "Khác" ? formData.customProfession : formData.profession; // Xử lý Ngành nghề
    const finalCountry = formData.country === "Khác" ? formData.customCountry : formData.country;  // Xử lý Quốc gia

    // Chuẩn bị dữ liệu để lưu
    const dataToSave = { 
        ...formData, 
        profession: finalProfession,
        country: finalCountry
    };
    
    // Xóa các field tạm trước khi lưu
    delete dataToSave.customProfession;
    delete dataToSave.customCountry;

    onSave(dataToSave);
  };

  const handleDelete = () => {
    if(confirm("Bạn có chắc chắn muốn xóa toàn bộ thông tin cá nhân?")) {
        onDelete();
        // Reset về rỗng
        setFormData({ 
            fullName: "", 
            gender: "", 
            ageGroup: "", 
            country: "", 
            customCountry: "",
            profession: "", 
            customProfession: "", 
            description: "" 
        });
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div ref={dialogRef} className="relative z-10 w-full max-w-xl h-[80vh] flex flex-col bg-[#0f1218] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-3">
            <User className="w-5 h-5 text-green-400" />
            Thông tin người dùng
          </h3>
          <button onClick={onClose} 
            className="w-8 h-8 rounded-full 
              bg-white/10 hover:bg-white/20 border border-white/10 
              flex items-center justify-center transition will-change-transform hover:scale-110">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0f1218] z-20">
              <LoadingSpinner size="md" color="white" message="Đang load dữ liệu..." />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Họ tên */}
              <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500"/> Họ và tên
                  </label>
                  <input 
                      type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                      placeholder="Điền họ và tên..."
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none hover:border-blue-600/60 transition-colors"
                  />
              </div>

              {/* Giới tính & Độ tuổi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomSelect 
                      label="Giới tính"
                      icon={VenusAndMars}
                      value={formData.gender}
                      options={genders}
                      onChange={(val) => handleSelectChange("gender", val)}
                      placeholder="-- Giới tính --"
                  />

                  <CustomSelect 
                      label="Độ tuổi"
                      icon={Calendar}
                      value={formData.ageGroup}
                      options={ageGroups}
                      onChange={(val) => handleSelectChange("ageGroup", val)}
                      placeholder="-- Độ tuổi --"
                  />
              </div>

              {/* Quốc gia */}
              <div className="space-y-2">
                  <CustomSelect 
                      label="Quốc gia"
                      icon={MapPin}
                      value={formData.country}
                      options={countries}
                      onChange={(val) => handleSelectChange("country", val)}
                      placeholder="-- Chọn quốc gia --"
                  />
                  
                  {formData.country === "Khác" && (
                      <input 
                          type="text" name="customCountry" value={formData.customCountry} onChange={handleChange}
                          placeholder="Nhập tên quốc gia..."
                          className="w-full mt-2 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white hover:border-blue-600/60 focus:outline-none animate-in fade-in slide-in-from-top-2"
                      />
                  )}
              </div>

              {/* Ngành nghề */}
              <div className="space-y-2">
                  <CustomSelect 
                      label="Ngành nghề / Hiện tại là"
                      icon={Briefcase}
                      value={formData.profession}
                      options={professions}
                      onChange={(val) => handleSelectChange("profession", val)}
                      placeholder="-- Chọn nghề nghiệp --"
                  />
                  
                  {formData.profession === "Khác" && (
                      <input 
                          type="text" name="customProfession" value={formData.customProfession} onChange={handleChange}
                          placeholder="Nhập ngành nghề cụ thể..."
                          className="w-full mt-2 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white hover:border-blue-600/60 focus:outline-none animate-in fade-in slide-in-from-top-2"
                      />
                  )}
              </div>

              {/* Mô tả thêm */}
              <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <AlignLeft className="w-4 h-4 text-gray-500"/> Mô tả bản thân
                  </label>
                  <textarea 
                      name="description" value={formData.description} onChange={handleChange}
                      rows={3}
                      placeholder="Sở thích, mục tiêu học tập, phong cách làm việc..."
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white hover:border-blue-600/60 focus:outline-none resize-none"
                  />
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex-shrink-0 p-4 border-t border-white/10 bg-white/5 grid grid-cols-2 gap-4">
            <button
                onClick={handleDelete}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
            >
                <Trash2 className="w-4 h-4" /> Xóa tất cả
            </button>
            <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-cyan-600 hover:opacity-80 transition text-sm font-medium shadow-lg shadow-pink-900/20"
            >
                Lưu thông tin
            </button>
        </div>
      </div>
    </div>
  );
}
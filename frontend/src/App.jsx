// Component gốc của ứng dụng
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import IntroPage from './pages/IntroPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import SupportPage from './pages/SupportPage.jsx';

// Định nghĩa các route cho ứng dụng
export default function App() { 
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang giới thiệu */}
        <Route path="/" element={<IntroPage />} />
        {/* Trang Chat */}
        <Route path="/chat" element={<ChatPage />} />
        {/* Trang About Us */}
        <Route path="/about" element={<AboutPage />} />
        {/* Trang Support */}
        <Route path="/support" element={<SupportPage />} />
        {/* Redirect các route không tồn tại về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
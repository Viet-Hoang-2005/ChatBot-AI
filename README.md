# Kĩ năng nghề nghiệp
Cẩm nang số thông minh - Hướng dẫn sử dụng công nghệ đúng mục đích.
Chatbot AI tìm kiếm và so sánh công cụ trên Internet theo nhu cầu công việc và học tập của sinh viên.
## Frontend (React + Vite + Tailwind CSS)
### Cấu trúc FE
```bash
frontend/
├── src/
│   ├── components/                     # Các component dùng chung
│   │   ├── ChatMessage.jsx             # Hiển thị bong bóng chat (user/bot)
│   │   ├── Header.jsx                  # Header chung cho Intro + About + Support
│   │   ├── MessageInput.jsx            # Ô nhập tin nhắn + nút gửi
│   │   ├── Modal.jsx                   # Popup chi tiết công cụ
│   │   └── SuggestionCard.jsx          # Card gợi ý công cụ
│   │
│   ├── pages/                          # Các trang chính của ứng dụng
│   │   ├── IntroPage.jsx               # Trang bắt đầu
│   │   ├── ChatPage.jsx                # Trang chatbot AI (logic chính)
│   │   ├── AboutPage.jsx               # Trang giới thiệu
│   │   └── SupportPage.jsx             # Trang hỗ trợ người dùng
│   │
│   ├── lib/
│   │   └── api.js                      # Hàm gọi API tới backend
│   │
│   │
│   ├── assets/                         # Thư mục chứa hình ảnh
│   │   ├── Avatar
│   │   ├── Background
│   │   └── Logo
│   │
│   ├── App.jsx                         # Root component quản lý routes
│   ├── main.jsx                        # Entry point cho Vite
│   └── styles.css                      # Global styles + Tailwind
│
├── postcss.config.js                   # PostCSS config
├── tailwind.config.js                  # Tailwind config    
└── vite.config.js                      # Vite build config

```
### Chạy FE
- Cài đặt nodejs và npm
- Cài đặt thư viện react cho fe
```bash
npm install
npm install lucide-react
npm install framer-motion
npm install react-router-dom
npm install react-markdown
```
- Chạy giao diện fe
```bash
cd chat
npm run dev
```
## Backend (Flask + FAISS + Google Gemini)
### Cấu trúc BE
```bash
backend/
├── app.py                      # Flask API server (port 5000)
├── myChat.py                   # Cấu hình json response và call Gemini API
├── db_storage.py               # Cấu hình cache data lưu prompt và response (FAISS + SQLite)
├── requirements.txt            # Các thư viện python cần cài đặt
├── .env                        # API keys
└── query_cache.db              # SQLite cache storage (auto-generated)
```
### Chạy BE
- Cài đặt các thư viện python cần thiết
```bash
python pip install -r requirements.txt
```
- Tạo file .env và đặt Gemini API key
```bash
GOOGLE_API_KEY=""
```
- Chạy server Flask
```bash
python app.py
```
- Xem thống kê cache
```bash
curl http://localhost:5000/cache/stats
```
- Xóa cache
```bash
curl "http://localhost:5000/cache/clear" -Method POST
```

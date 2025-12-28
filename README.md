# Kĩ năng nghề nghiệp
Cẩm nang số thông minh - Hướng dẫn sử dụng công nghệ đúng mục đích.
Chatbot AI tìm kiếm và so sánh công cụ trên Internet theo nhu cầu công việc và học tập của sinh viên.
## Frontend (React + Vite + Tailwind CSS)
### Cấu trúc FE
```bash
frontend/
├── src/
│   ├── components/
│   │   ├── ChatMessage.jsx             # Hiển thị bong bóng chat (user/bot)
│   │   ├── Header.jsx                  # Header chung cho Intro + About + Support
│   │   ├── MessageInput.jsx            # Ô nhập tin nhắn + nút gửi
│   │   ├── SuggestionCard.jsx          # Card gợi ý công cụ
│   │   ├── ComparisonTable.jsx         # Bảng so sánh công cụ
│   │   ├── ToolModal.jsx               # Popup chi tiết công cụ
│   │   ├── HistoryModal.jsx            # Popup lịch sử chat
│   │   ├── ProfileModal.jsx            # Popup hồ sơ người dùng
│   │   └── CustomSelect.jsx            # Tùy chỉnh select box
│   │
│   ├── pages/
│   │   ├── IntroPage.jsx               # Trang bắt đầu
│   │   ├── ChatPage.jsx                # Trang chatbot AI (logic chính)
│   │   ├── AboutPage.jsx               # Trang giới thiệu
│   │   └── SupportPage.jsx             # Trang hỗ trợ người dùng
│   │
│   ├── lib/
│   │   └── api.js                      # Hàm gọi API tới backend
│   │
│   │
│   ├── assets/                         # Thư mục chứa logo, hình ảnh
│   │   ├── Avatar
│   │   ├── Background
│   │   └── Logo
│   │
│   ├── App.jsx                         # Root component quản lý routes
│   ├── main.jsx                        # Entry point cho Vite
│   └── styles.css                      # Global styles + Tailwind
│
├── .env.local                          # Biến môi trường (API URL)
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
npm install uuid
```
- Chạy giao diện fe
```bash
cd chat
npm run dev
```
## Backend (Flask + MongoDB + Google Gemini)
### Cấu trúc BE
```bash
api/
├── index.py                    # Endpoint API chính với Flask
├── myChat.py                   # Cấu hình chatbot AI với Gemini + LangChain
├── requirements.txt            # Các thư viện python cần cài đặt
└── .env                        # API keys và MongoDB URI
```
### Chạy BE
- Cài đặt các thư viện python cần thiết
```bash
python pip install -r requirements.txt
```
- Tạo file .env rồi đặt Gemini API key và MongoDB URI
```bash
GOOGLE_API_KEY=""
MONGODB_URI=""
```
- Chạy server Flask
```bash
python index.py
```
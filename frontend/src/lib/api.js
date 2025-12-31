// Lấy URL cơ sở (Mặc định là /api để khớp với backend)
const getBaseUrl = () => import.meta.env.VITE_API_BASE || '/api';

// Biến lưu tạm User ID trong bộ nhớ (RAM)
let memoryUserId = null;

// Hàm helper để tạo headers có kèm ID dự phòng
const getHeaders = (customHeaders = {}) => {
  const headers = { 
    "Content-Type": "application/json",
    ...customHeaders 
  };
  // Nếu có ID trong bộ nhớ, đính kèm vào Header để Backend đọc dự phòng
  if (memoryUserId) {
    headers["X-Chatbot-User-ID"] = memoryUserId;
  }
  return headers;
};

// Hàm khởi tạo session
export async function initSession() {
  try {
    const res = await fetch(`${getBaseUrl()}/auth/init`, {
      method: "POST",
      headers: getHeaders(),
      credentials: "include", 
    });
    const data = await res.json();
    
    // Lưu ID vào bộ nhớ tạm
    if (data.success && data.user_id) {
      memoryUserId = data.user_id;
    }

    return data;
  } catch (error) {
    console.error("Init session failed", error);
    return null;
  }
}

/* 1. API CHAT */
// Gửi tin nhắn và nhận phản hồi từ API
export async function askTools(query, sessionId, signal) {
  const url = `${getBaseUrl()}/chat?q=${encodeURIComponent(query)}&session_id=${sessionId}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
    signal,
    credentials: "include"
  });
  if (!res.ok) throw new Error('API Error');
  return res.json();
}

// Đặt lại ngữ cảnh hội thoại
export async function resetSessionContext(sessionId) {
  const res = await fetch(`${getBaseUrl()}/chat/reset`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ session_id: sessionId })
  });
  return res.json();
}

/* 2. API SESSIONS (QUẢN LÝ HỘI THOẠI) */
// Lấy danh sách hội thoại
export async function getUserSessions() {
  const res = await fetch(`${getBaseUrl()}/sessions`, {
    headers: getHeaders(),
    credentials: "include"
  });
  if (!res.ok) return [];
  return res.json();
}

// Lấy chi tiết tin nhắn (History)
export async function getSessionHistory(sessionId) {
  const res = await fetch(`${getBaseUrl()}/sessions/${sessionId}`, {
    headers: getHeaders()
  });
  if (!res.ok) return [];
  return res.json();
}

// Đổi tên hội thoại
export async function renameSession(sessionId, newTitle) {
  const res = await fetch(`${getBaseUrl()}/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ title: newTitle })
  });
  return res.json();
}

// Xóa 1 hội thoại
export async function deleteSession(sessionId) {
  const res = await fetch(`${getBaseUrl()}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return res.json();
}

// Xóa tất cả hội thoại
export async function deleteAllHistory() {
  const res = await fetch(`${getBaseUrl()}/sessions`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: "include"
  });
  return res.json();
}

/* 3. API PROFILE */
// Lấy thông tin cá nhân
export async function getUserProfile() {
  const res = await fetch(`${getBaseUrl()}/profile`, {
    headers: getHeaders(),
    credentials: "include"
  });
  if (!res.ok) return null;
  return await res.json();
}

// Lưu thông tin cá nhân
export async function saveUserProfile(profileData) {
  const res = await fetch(`${getBaseUrl()}/profile`, {
    method: "POST",
    credentials: "include",
    headers: getHeaders(),
    body: JSON.stringify({ profile: profileData }),
  });
  return await res.json();
}

// Xóa thông tin cá nhân
export async function deleteUserProfile() {
  await fetch(`${getBaseUrl()}/profile`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include"
  });
}

/* 4. API REPORT & REVIEW */
// Gửi báo lỗi từ người dùng
export async function sendBugReport(data) {
  const res = await fetch(`${getBaseUrl()}/report`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return await res.json();
}

// Gửi hoặc cập nhật đánh giá của user
export async function sendReview(data) {
  const res = await fetch(`${getBaseUrl()}/reviews`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return await res.json();
}

// Lấy danh sách đánh giá của user
export async function getMyReview() {
  const res = await fetch(`${getBaseUrl()}/reviews/me`, {
    headers: getHeaders(),
    credentials: "include"
  });
  if (!res.ok) return null;
  return await res.json();
}

// Xóa đánh giá của user
export async function deleteReview() {
  const res = await fetch(`${getBaseUrl()}/reviews`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include"
  });
  return await res.json();
}

// Lấy danh sách đánh giá của cộng đồng
export async function getReviews() {
  const res = await fetch(`${getBaseUrl()}/reviews/list`, {
    headers: getHeaders()
  });
  if (!res.ok) return [];
  return await res.json();
}
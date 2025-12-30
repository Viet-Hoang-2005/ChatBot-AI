// Lấy URL cơ sở (Mặc định là /api để khớp với backend)
const getBaseUrl = () => import.meta.env.VITE_API_BASE || '/api';

/* 1. API CHAT */
// Gửi tin nhắn và nhận phản hồi từ API
export async function askTools(query, sessionId, userId, signal) {
  const url = `${getBaseUrl()}/chat?q=${encodeURIComponent(query)}&session_id=${sessionId}&user_id=${userId}`;
  const res = await fetch(url, { method: 'GET', signal });
  if (!res.ok) throw new Error('API Error');
  return res.json();
}

// Đặt lại ngữ cảnh hội thoại
export async function resetSessionContext(sessionId) {
  const res = await fetch(`${getBaseUrl()}/chat/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId })
  });
  return res.json();
}

/* 2. API SESSIONS (QUẢN LÝ HỘI THOẠI) */
// Lấy danh sách hội thoại
export async function getUserSessions(userId) {
  const res = await fetch(`${getBaseUrl()}/sessions?user_id=${userId}`);
  if (!res.ok) return [];
  return res.json();
}

// Lấy chi tiết tin nhắn (History)
export async function getSessionHistory(sessionId) {
  const res = await fetch(`${getBaseUrl()}/sessions/${sessionId}`);
  if (!res.ok) return [];
  return res.json();
}

// Đổi tên hội thoại
export async function renameSession(sessionId, newTitle) {
  const res = await fetch(`${getBaseUrl()}/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: newTitle })
  });
  return res.json();
}

// Xóa 1 hội thoại
export async function deleteSession(sessionId) {
  const res = await fetch(`${getBaseUrl()}/sessions/${sessionId}`, {
    method: 'DELETE'
  });
  return res.json();
}

// Xóa tất cả hội thoại
export async function deleteAllHistory(userId) {
  const res = await fetch(`${getBaseUrl()}/sessions?user_id=${userId}`, {
    method: 'DELETE'
  });
  return res.json();
}

/* 3. API PROFILE */
// Lấy thông tin cá nhân
export async function getUserProfile(userId) {
  const res = await fetch(`${getBaseUrl()}/profile?user_id=${userId}`);
  if (!res.ok) return null;
  return await res.json();
}

// Lưu thông tin cá nhân
export async function saveUserProfile(userId, profileData) {
  const res = await fetch(`${getBaseUrl()}/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, profile: profileData }),
  });
  return await res.json();
}

// Xóa thông tin cá nhân
export async function deleteUserProfile(userId) {
  await fetch(`${getBaseUrl()}/profile?user_id=${userId}`, {
    method: "DELETE",
  });
}

/* 4. API REPORT & REVIEW */
// Gửi phản hồi từ người dùng
export async function sendBugReport(data) {
  const res = await fetch(`${getBaseUrl()}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

// Gửi hoặc cập nhật đánh giá của user
export async function sendReview(data) {
  const res = await fetch(`${getBaseUrl()}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

// Lấy danh sách đánh giá của user
export async function getMyReview(userId) {
  const res = await fetch(`${getBaseUrl()}/reviews/me?user_id=${userId}`);
  if (!res.ok) return null;
  return await res.json();
}

// Xóa đánh giá của user
export async function deleteReview(userId) {
  const res = await fetch(`${getBaseUrl()}/reviews?user_id=${userId}`, {
    method: "DELETE",
  });
  return await res.json();
}

// Lấy danh sách đánh giá của cộng đồng
export async function getReviews() {
  const res = await fetch(`${getBaseUrl()}/reviews/list`);
  if (!res.ok) return [];
  return await res.json();
}
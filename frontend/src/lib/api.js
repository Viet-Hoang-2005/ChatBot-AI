const getBaseUrl = () => import.meta.env.VITE_API_BASE || '/api';

// Gửi tin nhắn và nhận phản hồi từ API
export async function askTools(query, sessionId, userId, signal) {
  const url = `${getBaseUrl()}/query?q=${encodeURIComponent(query)}&session_id=${sessionId}&user_id=${userId}`;
  const res = await fetch(url, { method: 'GET', signal });
  if (!res.ok) throw new Error('API Error');
  return res.json();
}

// Lấy danh sách hội thoại
export async function getUserSessions(userId) {
  const res = await fetch(`${getBaseUrl()}/sessions?user_id=${userId}`);
  if (!res.ok) return [];
  return res.json();
}

// Lấy chi tiết tin nhắn trong phiên hội thoại
export async function getSessionHistory(sessionId) {
  const res = await fetch(`${getBaseUrl()}/history?session_id=${sessionId}`);
  if (!res.ok) return [];
  return res.json();
}

// Đổi tên hội thoại
export async function renameSession(sessionId, newTitle) {
  const res = await fetch(`${getBaseUrl()}/history/rename`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, title: newTitle })
  });
  return res.json();
}

// Xóa 1 hội thoại
export async function deleteSession(sessionId) {
  const res = await fetch(`${getBaseUrl()}/history/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId })
  });
  return res.json();
}

// Xóa tất cả hội thoại
export async function deleteAllHistory(userId) {
  const res = await fetch(`${getBaseUrl()}/history/clear_all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  return res.json();
}
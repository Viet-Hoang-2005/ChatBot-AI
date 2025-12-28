import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient, DESCENDING
from datetime import datetime, timezone

# Import myChat
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from myChat import handle_query, is_tool_query, general_chat, reset_consultation

app = Flask(__name__)
CORS(app)

# Cấu hình MongoDB
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["chatbot_db"]
chats_collection = db["conversations"]
users_collection = db["users"]

# 1. API ENDPOINTS QUẢN LÝ HỘI THOẠI VÀ TIN NHẮN
# Endpoint xử lý chat (Lưu User & Bot message)
@app.route("/api/chat", methods=["GET"])
def query():
    # Lấy tham số
    user_query = request.args.get("q")
    session_id = request.args.get("session_id")
    user_id = request.args.get("user_id")

    # Kiểm tra tham số
    if not session_id: session_id = "default_session"
    if not user_query: return jsonify({"error": "Missing query parameter 'q'"}), 400

    user_profile = None
    if user_id:
        user_record = users_collection.find_one({"user_id": user_id})
        if user_record and "profile" in user_record:
            user_profile = user_record["profile"]
            print(f"👤 Loaded for User {user_id}: {user_profile.get('fullName')}")

    try:
        # Xử lý AI
        if is_tool_query(user_query):
            print(f"⏳ [TOOLS] Calling Gemini API for: '{user_query[:50]}...'")
            response = handle_query(user_query, session_id, user_profile)
            if isinstance(response, dict): response.setdefault("mode", "tools")
        else:
            print(f"⏳ [CHAT] Calling Gemini API for: '{user_query[:50]}...'")
            reply_text = general_chat(user_query, session_id, user_profile)
            response = {"mode": "chat", "reply": reply_text}

        # Lưu tin nhắn vào DB
        if session_id and user_id:
            new_messages = [
                {"role": "user", "content": user_query, "timestamp": datetime.now(timezone.utc)},
                {"role": "assistant", "content": response, "timestamp": datetime.now(timezone.utc)}
            ]
            chats_collection.update_one(
                {"session_id": session_id},
                {
                    "$set": {"user_id": user_id, "updated_at": datetime.now(timezone.utc)},
                    "$setOnInsert": {
                        "created_at": datetime.now(timezone.utc),
                        "title": user_query[:60] + "..." if len(user_query) > 60 else user_query
                    },
                    "$push": {"messages": {"$each": new_messages}}
                },
                upsert=True
            )
        return jsonify(response)

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Endpoint đặt lại hội thoại
@app.route("/api/chat/reset", methods=["POST"])
def conversation_reset():
    data = request.json
    session_id = data.get("session_id") or "default_session"
    try:
        msg = reset_consultation(session_id)
        return jsonify({"success": True, "message": msg})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# 2. API ENDPOINTS QUẢN LÝ LỊCH SỬ HỘI THOẠI
# Endpoint lấy danh sách hoặc xóa tất cả sessions của User
@app.route("/api/sessions", methods=["GET", "DELETE"])
def manage_sessions():
    user_id = request.args.get("user_id")
    if not user_id: return jsonify({"error": "Missing user_id"}), 400

    # GET: Lấy danh sách
    if request.method == "GET":
        cursor = chats_collection.find(
            {"user_id": user_id},
            {"session_id": 1, "title": 1, "updated_at": 1, "_id": 0}
        ).sort("updated_at", DESCENDING)
        
        sessions = list(cursor)
        for s in sessions:
            if isinstance(s.get("updated_at"), datetime):
                s["updated_at"] = s["updated_at"].isoformat()
        return jsonify(sessions)

    # DELETE: Xóa tất cả lịch sử của user
    if request.method == "DELETE":
        chats_collection.delete_many({"user_id": user_id})
        return jsonify({"success": True})

# Endpoint thao tác trên 1 session cụ thể: Xem chi tiết, Đổi tên, Xóa
@app.route("/api/sessions/<session_id>", methods=["GET", "PATCH", "DELETE"])
def session_detail(session_id):
    # GET: Lấy lịch sử tin nhắn của session
    if request.method == "GET":
        data = chats_collection.find_one({"session_id": session_id}, {"messages": 1, "_id": 0})
        messages = data.get("messages", []) if data else []
        for msg in messages:
            if isinstance(msg.get("timestamp"), datetime):
                msg["timestamp"] = msg["timestamp"].isoformat()
        return jsonify(messages)

    # PATCH: Đổi tên session
    if request.method == "PATCH":
        new_title = request.json.get("title")
        if not new_title: return jsonify({"error": "Missing title"}), 400
        chats_collection.update_one({"session_id": session_id}, {"$set": {"title": new_title}})
        return jsonify({"success": True})

    # DELETE: Xóa session
    if request.method == "DELETE":
        chats_collection.delete_one({"session_id": session_id})
        return jsonify({"success": True})

# 3. API ENDPOINTS QUẢN LÝ HỒ SƠ NGƯỜI DÙNG
# Endpoint quản lý hồ sơ người dùng (Lấy, Cập nhật, Xóa)
@app.route("/api/profile", methods=["GET", "POST", "DELETE"])
def manage_profile():
    user_id = request.args.get("user_id") or (request.json and request.json.get("user_id"))
    if not user_id: return jsonify({"error": "Missing user_id"}), 400

    # GET: Lấy profile
    if request.method == "GET":
        user = users_collection.find_one({"user_id": user_id}, {"_id": 0, "profile": 1})
        return jsonify(user["profile"] if user and "profile" in user else None)
    
    # POST: Cập nhật profile
    if request.method == "POST":
        profile_data = request.json.get("profile")
        users_collection.update_one(
            {"user_id": user_id},
            {"$set": {"profile": profile_data, "updated_at": datetime.now(timezone.utc)}},
            upsert=True
        )
        return jsonify({"success": True})
    
    # DELETE: Xóa profile
    if request.method == "DELETE":
        users_collection.update_one({"user_id": user_id}, {"$unset": {"profile": ""}})
        return jsonify({"success": True})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
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

# 1. Endpoint xử lý chat (Lưu User & Bot message)
@app.route("/api/query", methods=["GET"])
def query():
    user_query = request.args.get("q")
    session_id = request.args.get("session_id")
    user_id = request.args.get("user_id")

    if not session_id: session_id = "default_session"
    if not user_query: return jsonify({"error": "Missing query parameter 'q'"}), 400

    try:
        # Xử lý AI
        if is_tool_query(user_query):
            print(f"⏳ [TOOLS] Calling Gemini API for: '{user_query[:50]}...'")
            response = handle_query(user_query, session_id)
            if isinstance(response, dict): response.setdefault("mode", "tools")
        else:
            print(f"⏳ [CHAT] Calling Gemini API for: '{user_query[:50]}...'")
            reply_text = general_chat(user_query, session_id)
            response = {"mode": "chat", "reply": reply_text}

        # Lưu vào DB
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

# 2. Endpoint lấy danh sách hội thoại (Đã sửa lỗi Date)
@app.route("/api/sessions", methods=["GET"])
def get_sessions():
    user_id = request.args.get("user_id")
    if not user_id: return jsonify([])

    cursor = chats_collection.find(
        {"user_id": user_id},
        {"session_id": 1, "title": 1, "updated_at": 1, "_id": 0}
    ).sort("updated_at", DESCENDING)
    
    sessions = list(cursor)

    # Convert datetime sang string để tránh lỗi JSON
    for s in sessions:
        if "updated_at" in s and isinstance(s["updated_at"], datetime):
            s["updated_at"] = s["updated_at"].isoformat()
    
    return jsonify(sessions)

# 3. Endpoint lấy chi tiết lịch sử tin nhắn (QUAN TRỌNG: Đã thêm lại)
@app.route("/api/history", methods=["GET"])
def get_history():
    session_id = request.args.get("session_id")
    data = chats_collection.find_one({"session_id": session_id}, {"messages": 1, "_id": 0})
    
    if data and "messages" in data:
        messages = data["messages"]
        for msg in messages:
            if "timestamp" in msg and isinstance(msg["timestamp"], datetime):
                msg["timestamp"] = msg["timestamp"].isoformat()
        return jsonify(messages)
    return jsonify([])

# 4. Các Endpoint phụ (Đổi tên, Xóa, Reset)
@app.route("/api/history/rename", methods=["POST"])
def rename_session():
    data = request.json
    session_id = data.get("session_id")
    new_title = data.get("title")
    if session_id and new_title:
        chats_collection.update_one({"session_id": session_id}, {"$set": {"title": new_title}})
        return jsonify({"success": True})
    return jsonify({"error": "Missing data"}), 400

@app.route("/api/history/delete", methods=["POST"])
def delete_session():
    data = request.json
    session_id = data.get("session_id")
    if session_id:
        chats_collection.delete_one({"session_id": session_id})
        return jsonify({"success": True})
    return jsonify({"error": "Missing session_id"}), 400

@app.route("/api/history/clear_all", methods=["POST"])
def clear_all_history():
    data = request.json
    user_id = data.get("user_id")
    if user_id:
        chats_collection.delete_many({"user_id": user_id})
        return jsonify({"success": True})
    return jsonify({"error": "Missing user_id"}), 400

@app.route("/api/conversation/reset", methods=["POST"])
def conversation_reset():
    data = request.json
    session_id = data.get("session_id") or "default_session"
    try:
        msg = reset_consultation(session_id)
        return jsonify({"success": True, "message": msg})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
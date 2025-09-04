// src/pages/chat/Thread.jsx
import { useParams } from "react-router-dom";
import { useState } from "react";

export default function Thread() {
  const { threadId } = useParams();
  const [messages, setMessages] = useState([
    { id: 1, from: "system", text: `Thread #${threadId}` },
  ]);
  const [text, setText] = useState("");

  function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setMessages((m) => [...m, { id: Date.now(), from: "me", text }]);
    setText("");
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-[#6B271A] mb-4">Chat</h1>
      <div className="rounded-xl border bg-white">
        <div className="p-4 space-y-2 max-h-[50vh] overflow-auto">
          {messages.map((m) => (
            <div key={m.id}>
              <span className="text-xs text-gray-500 mr-2">{m.from}:</span>
              <span>{m.text}</span>
            </div>
          ))}
        </div>
        <form onSubmit={send} className="p-3 border-t flex gap-2">
          <input
            className="flex-1 border rounded-lg px-3 py-2"
            placeholder="Scrivi un messaggio…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="px-4 py-2 rounded-lg bg-[#D54E30] text-white font-semibold">
            Invia
          </button>
        </form>
      </div>
    </main>
  );
}

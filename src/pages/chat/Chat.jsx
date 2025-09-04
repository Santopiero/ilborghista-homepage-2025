// src/pages/chat/Chat.jsx
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCreator, getCurrentUser, listMessages, postMessage, listThreads } from "../../lib/store";

export default function Chat() {
  const { threadId } = useParams();
  const nav = useNavigate();
  const user = getCurrentUser();

  const threads = listThreads()
    .filter(t => t.userId === user.id || true) // MVP: mostra tutti i thread dell’utente; in futuro filtra anche per creator login
    .sort((a,b)=> (b.lastMessageAt||"").localeCompare(a.lastMessageAt||""));

  const active = useMemo(() => threads.find(t => t.id === threadId) || threads[0], [threads, threadId]);
  const creator = active ? getCreator(active.creatorId) : null;
  const msgs = active ? listMessages(active.id) : [];

  const [text, setText] = useState("");

  function send(e) {
    e.preventDefault();
    if (!active || !text.trim()) return;
    postMessage({ threadId: active.id, sender: "user", text });
    setText("");
    nav(`/chat/${active.id}`);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid md:grid-cols-[260px,1fr] gap-6">
      <aside className="rounded-2xl border bg-white overflow-hidden">
        <div className="px-3 py-2 font-semibold border-b">Le tue chat</div>
        <div className="divide-y">
          {threads.map(t => {
            const c = getCreator(t.creatorId);
            return (
              <Link key={t.id} to={`/chat/${t.id}`} className={`block px-3 py-2 text-sm hover:bg-[#FAF5E0] ${active?.id === t.id ? "bg-[#FAF5E0]" : ""}`}>
                <div className="font-semibold text-[#6B271A]">{c?.name || "Creator"}</div>
                <div className="text-xs text-gray-600">{new Date(t.lastMessageAt).toLocaleString()}</div>
              </Link>
            );
          })}
          {threads.length === 0 && <div className="px-3 py-2 text-sm text-gray-600">Nessuna conversazione.</div>}
        </div>
      </aside>

      <section className="rounded-2xl border bg-white flex flex-col">
        {active && creator ? (
          <>
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold text-[#6B271A]">{creator.name}</div>
                <div className="text-xs text-gray-600">{creator.region} · {creator.category}</div>
              </div>
              <Link to={`/creator/${creator.id}`} className="text-sm underline">Vedi profilo</Link>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-2">
              {msgs.map(m => (
                <div key={m.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.sender === "user" ? "ml-auto bg-[#FAF5E0]" : "bg-gray-100"}`}>
                  {m.text}
                  <div className="text-[10px] text-gray-500 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
                </div>
              ))}
              {msgs.length === 0 && <div className="text-sm text-gray-600">Scrivi il primo messaggio…</div>}
            </div>

            <form onSubmit={send} className="p-3 border-t flex gap-2">
              <input className="flex-1 border rounded-xl px-3 py-2" placeholder="Scrivi un messaggio…" value={text} onChange={e=>setText(e.target.value)} />
              <button className="px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold">Invia</button>
            </form>
          </>
        ) : (
          <div className="p-6 text-sm text-gray-600">Seleziona una conversazione a sinistra.</div>
        )}
      </section>
    </main>
  );
}

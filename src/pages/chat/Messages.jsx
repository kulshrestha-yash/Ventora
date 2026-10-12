import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import * as db from "../../lib/db/localStorageStore.js";

export function Messages() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState(() => db.find("conversations"));
  const [messages, setMessages] = useState([]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const conversationId = searchParams.get("c");
  const conversation = conversations.find((item) => item._id === conversationId);
  const otherPerson = conversation?.participants?.find(
    (person) => person.email !== user.email
  );

  function refreshChat() {
    setConversations(db.find("conversations"));
    setMessages(
      db
        .find("messages", (item) => item.conversationId === conversationId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    );
  }

  useEffect(() => {
    refreshChat();
    window.addEventListener("ventora:db", refreshChat);
    window.addEventListener("storage", refreshChat);
    return () => {
      window.removeEventListener("ventora:db", refreshChat);
      window.removeEventListener("storage", refreshChat);
    };
  }, [conversationId]);

  function startConversation(event) {
    event.preventDefault();
    const otherEmail = email.trim().toLowerCase();

    if (otherEmail === user.email.toLowerCase()) {
      setError("Enter another person's email address.");
      return;
    }

    const existing = conversations.find((item) =>
      item.participants?.some((person) => person.email === otherEmail) &&
      item.participants?.some((person) => person.email === user.email)
    );
    const chat = existing || db.insert("conversations", {
      participants: [
        { email: user.email, name: user.name },
        { email: otherEmail, name: otherEmail }
      ]
    });

    setError("");
    setEmail("");
    setSearchParams({ c: chat._id });
    setConversations(db.find("conversations"));
  }

  function sendMessage(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || !conversation) return;

    db.insert("messages", {
      conversationId: conversation._id,
      senderEmail: user.email,
      body: text
    });
    db.updateOne("conversations", conversation._id, { lastMessage: text });
    setMessage("");
    refreshChat();
  }

  return (
    <main className="min-h-screen bg-surface-subtle p-4 text-ink sm:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="text-sm text-ink-muted">Local demo: messages stay in this browser.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              className="text-sm text-primary hover:underline"
              to={user.role === "innovator" ? "/dashboard" : "/feed"}
            >
              Back
            </Link>
            <button className="text-sm text-ink-muted hover:text-ink" onClick={logout}>
              Sign out
            </button>
          </div>
        </header>

        <div className="grid min-h-[65vh] overflow-hidden rounded-xl border border-line bg-surface md:grid-cols-[280px_1fr]">
          <aside className="border-b border-line p-4 md:border-b-0 md:border-r">
            <form className="mb-4 space-y-2" onSubmit={startConversation}>
              <label className="block text-sm font-medium" htmlFor="recipient-email">
                Start a conversation
              </label>
              <input
                id="recipient-email"
                className="w-full rounded-lg border border-line bg-surface p-2 text-sm"
                type="email"
                placeholder="Their email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <button className="rounded-lg bg-primary px-3 py-2 text-sm text-white" type="submit">
                Start chat
              </button>
              {error && <p className="text-sm text-danger">{error}</p>}
            </form>

            <h2 className="mb-2 text-sm font-semibold">Conversations</h2>
            {conversations
              .filter((item) =>
                item.participants?.some((person) => person.email === user.email)
              )
              .map((item) => {
                const person = item.participants?.find(
                  (participant) => participant.email !== user.email
                );
                return (
                  <button
                    className={`mb-1 w-full rounded-lg p-3 text-left text-sm ${
                      item._id === conversationId ? "bg-primary-soft" : "hover:bg-surface-subtle"
                    }`}
                    key={item._id}
                    onClick={() => setSearchParams({ c: item._id })}
                  >
                    <span className="block font-medium">{person?.name || "Conversation"}</span>
                    <span className="block truncate text-ink-muted">
                      {item.lastMessage || "No messages yet"}
                    </span>
                  </button>
                );
              })}
          </aside>

          <section className="flex min-h-[50vh] flex-col p-4">
            <h2 className="border-b border-line pb-3 text-sm font-semibold">
              {otherPerson?.name || "Select or start a conversation"}
            </h2>

            <div className="flex-1 space-y-3 overflow-y-auto py-4">
              {messages.map((item) => (
                <p
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    item.senderEmail === user.email
                      ? "ml-auto bg-primary text-white"
                      : "bg-surface-subtle"
                  }`}
                  key={item._id}
                >
                  {item.body}
                </p>
              ))}
              {conversation && messages.length === 0 && (
                <p className="text-sm text-ink-muted">No messages yet. Say hello.</p>
              )}
            </div>

            <form className="flex gap-2 border-t border-line pt-3" onSubmit={sendMessage}>
              <input
                aria-label="Message"
                className="min-w-0 flex-1 rounded-lg border border-line bg-surface p-2 text-sm"
                placeholder="Write a message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={!conversation}
              />
              <button
                className="rounded-lg bg-primary px-4 text-sm text-white disabled:opacity-50"
                type="submit"
                disabled={!conversation || !message.trim()}
              >
                Send
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

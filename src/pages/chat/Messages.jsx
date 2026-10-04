// src/pages/chat/Messages.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell.jsx";
import {
  Card,
  Button,
  Input,
  Textarea,
  Avatar,
  Badge,
  EmptyState,
  Skeleton,
  Modal
} from "../../components/ui/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";
import { displayNameFor } from "../../lib/disclosure.js";
import {
  MessageSquare,
  Search,
  Paperclip,
  Send,
  ExternalLink,
  ShieldCheck,
  Check,
  MoreVertical,
  Link as LinkIcon,
  X
} from "lucide-react";

export function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isUserOnline, refreshData } = useData();
  const toast = useToast();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(searchParams.get("c") || null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [filterLinksOnly, setFilterLinksOnly] = useState(false);

  // Link attachment popover modal
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");

  const messagesEndRef = useRef(null);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!user?._id) return;
    try {
      const list = await api.conversations.listMine({ userId: user._id });
      setConversations(list);

      // If activeConvId set from URL or not set yet, pick first if desktop
      const queryC = searchParams.get("c");
      if (queryC) {
        setActiveConvId(queryC);
      } else if (list.length > 0 && !activeConvId && window.innerWidth >= 1024) {
        setActiveConvId(list[0]._id);
        setSearchParams({ c: list[0]._id }, { replace: true });
      }
    } catch (err) {
      toast.error("Failed to load conversations.");
    } finally {
      setLoadingList(false);
    }
  }, [user?._id, searchParams, activeConvId, setSearchParams, toast]);

  // Load active thread messages
  const loadMessages = useCallback(async (convId) => {
    if (!convId || !user?._id) return;
    setLoadingMessages(true);
    try {
      const { conversation, counterpart, idea } = await api.conversations.get({
        conversationId: convId,
        userId: user._id
      });
      setActiveConv({ conversation, counterpart, idea });

      const msgs = await api.messages.list({ conversationId: convId });
      setMessages(msgs);

      // Mark read
      await api.messages.markRead({ conversationId: convId, userId: user._id });
      await refreshData();
    } catch (err) {
      toast.error("Could not load message thread.");
      setActiveConv(null);
    } finally {
      setLoadingMessages(false);
    }
  }, [user?._id, refreshData, toast]);

  useEffect(() => {
    loadConversations();

    const handleSync = () => {
      loadConversations();
      if (activeConvId) {
        loadMessages(activeConvId);
      }
    };

    window.addEventListener("ventora:db", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("ventora:db", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [loadConversations, loadMessages, activeConvId]);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConversation = (convId) => {
    setActiveConvId(convId);
    setSearchParams({ c: convId });
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeConvId) return;

    const body = messageText.trim();
    setMessageText("");

    try {
      await api.messages.send({
        conversationId: activeConvId,
        senderId: user._id,
        type: "text",
        body
      });
      loadMessages(activeConvId);
    } catch (err) {
      toast.error(err.message || "Failed to send message.");
    }
  };

  const handleSendLink = async () => {
    if (!attachmentUrl.trim() || !activeConvId) return;
    let url = attachmentUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    try {
      await api.messages.send({
        conversationId: activeConvId,
        senderId: user._id,
        type: "link",
        body: url
      });
      setLinkModalOpen(false);
      setAttachmentUrl("");
      loadMessages(activeConvId);
      toast.success("Link shared in conversation.");
    } catch (err) {
      toast.error("Failed to share link.");
    }
  };

  // Filtered conversations
  const filteredConversations = conversations.filter((c) => {
    const q = searchTerm.toLowerCase();
    const titleMatch = (c.idea?.basics?.title || "").toLowerCase().includes(q);
    const nameMatch = (c.counterpart?.name || "").toLowerCase().includes(q);
    const codeMatch = (c.counterpart?.code || "").toLowerCase().includes(q);
    return titleMatch || nameMatch || codeMatch;
  });

  // Filter messages if shared links chip is active
  const displayedMessages = filterLinksOnly
    ? messages.filter((m) => m.type === "link")
    : messages;

  const linksCount = messages.filter((m) => m.type === "link").length;

  return (
    <AppShell
      title="Messages & Chat"
      subtitle="Encrypted, permission-based communication with verified counterparties"
    >
      <div className="h-[calc(100vh-140px)] min-h-[500px] bg-surface border border-line rounded-2xl shadow-card overflow-hidden flex">
        {/* LEFT PANE: Conversations List (320px) */}
        <aside
          className={`w-full lg:w-80 border-r border-line flex flex-col bg-surface ${
            activeConvId ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Search Header */}
          <div className="p-3.5 border-b border-line">
            <div className="relative">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
              <Input
                placeholder="Search ideas or counterparties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-line">
            {loadingList ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-muted">
                No active conversations found.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv._id === activeConvId;
                const isOnline = isUserOnline(conv.counterpart?._id);

                return (
                  <div
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv._id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary-soft/60"
                        : "hover:bg-surface-subtle"
                    }`}
                  >
                    <div className="relative">
                      <Avatar
                        name={conv.counterpart?.name}
                        code={conv.counterpart?.code}
                        hue={conv.counterpart?.avatarHue}
                        size="md"
                        verified={conv.counterpart?.kyc?.status === "verified"}
                      />
                      {/* Presence Dot */}
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface ${
                          isOnline ? "bg-success" : "bg-ink-faint"
                        }`}
                        title={isOnline ? "Online in this browser" : "Offline"}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink truncate">
                          {displayNameFor(conv.counterpart, user._id, true)}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary text-white font-mono">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-semibold text-primary truncate mt-0.5">
                        {conv.idea?.title || conv.idea?.basics?.title || "Startup Idea"}
                      </div>

                      <div className="text-[11px] text-ink-muted truncate mt-0.5">
                        {conv.lastMessagePreview || "No messages yet"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT PANE: Chat Thread Pane */}
        <section
          className={`flex-1 flex flex-col bg-surface-subtle ${
            !activeConvId ? "hidden lg:flex" : "flex"
          }`}
        >
          {activeConv ? (
            <>
              {/* Thread Header */}
              <div className="h-16 px-6 bg-surface border-b border-line flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveConvId(null)}
                    className="lg:hidden p-1.5 text-ink-muted hover:text-ink mr-1"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <Avatar
                    name={activeConv.counterpart?.name}
                    code={activeConv.counterpart?.code}
                    hue={activeConv.counterpart?.avatarHue}
                    size="sm"
                    verified={activeConv.counterpart?.kyc?.status === "verified"}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink truncate">
                        {displayNameFor(activeConv.counterpart, user._id, true)}
                      </span>
                      {activeConv.counterpart?.kyc?.status === "verified" && (
                        <Badge tone="success-soft" size="sm">
                          <ShieldCheck className="w-3 h-3 mr-0.5" />
                          KYC
                        </Badge>
                      )}
                      <span className="text-[11px] text-ink-muted">
                        {isUserOnline(activeConv.counterpart?._id) ? (
                          <span className="text-success font-medium">● Online</span>
                        ) : (
                          "Offline"
                        )}
                      </span>
                    </div>

                    <div className="text-[11px] text-ink-muted truncate">
                      Re: <strong className="text-ink">{activeConv.idea?.basics?.title || activeConv.idea?.title}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Shared links chip */}
                  <button
                    type="button"
                    onClick={() => setFilterLinksOnly(!filterLinksOnly)}
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      filterLinksOnly
                        ? "bg-primary text-white border-primary"
                        : "bg-surface text-ink-muted border-line hover:text-ink"
                    }`}
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Shared links ({linksCount})</span>
                  </button>

                  <Link
                    to={`/ideas/${activeConv.idea?._id || activeConv.conversation?.ideaId}`}
                    className="text-xs font-semibold text-primary hover:underline hidden sm:inline-block"
                  >
                    View idea →
                  </Link>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {displayedMessages.map((msg) => {
                  const isMine = msg.senderId === user._id;
                  const isSystem = msg.type === "system";

                  if (isSystem) {
                    return (
                      <div key={msg._id} className="text-center py-2">
                        <span className="text-[11px] text-ink-muted bg-surface border border-line px-3 py-1 rounded-full shadow-sm font-medium">
                          {msg.body}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-md p-3.5 text-xs leading-relaxed ${
                          isMine
                            ? "bg-primary text-white rounded-2xl rounded-br-sm shadow-sm"
                            : "bg-surface border border-line text-ink rounded-2xl rounded-bl-sm shadow-sm"
                        }`}
                      >
                        {msg.type === "link" ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1 text-[11px] font-semibold opacity-80">
                              <ExternalLink className="w-3 h-3" />
                              <span>Shared Resource Link:</span>
                            </div>
                            <a
                              href={msg.body}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium underline break-all hover:opacity-80 block"
                            >
                              {msg.body}
                            </a>
                          </div>
                        ) : (
                          <span className="whitespace-pre-line">{msg.body}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-ink-muted mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="p-4 bg-surface border-t border-line shrink-0">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-end gap-2.5 max-w-4xl mx-auto"
                >
                  <button
                    type="button"
                    onClick={() => setLinkModalOpen(true)}
                    className="p-2.5 text-ink-muted hover:text-primary rounded-lg border border-line hover:border-primary transition-colors"
                    title="Share a web link or deck URL"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <div className="flex-1 relative">
                    <textarea
                      rows={1}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message... (Enter sends, Shift+Enter for new line)"
                      className="w-full p-2.5 text-xs bg-surface border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none max-h-32"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!messageText.trim()}
                    className="h-9 px-4 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Send
                  </Button>
                </form>
              </div>
            </>
          ) : (
            // No thread selected ghost view
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-ink">No Conversation Selected</h2>
              <p className="text-xs text-ink-muted max-w-xs mt-1 leading-relaxed">
                {user?.role === "innovator"
                  ? "Accept an investor's connection request to start chatting about your startup idea."
                  : "Chat unlocks when an innovator accepts your outreach request."}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Share Link Modal */}
      <Modal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        title="Share Resource Link"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSendLink} disabled={!attachmentUrl.trim()}>
              Share Link
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-ink-muted leading-relaxed">
            File uploads arrive in Phase 2. Paste a pitch deck, Notion page, or prototype link to share with your counterparty.
          </p>
          <Field label="URL" helper="e.g. https://docsend.com/view/..." required>
            <Input
              placeholder="https://..."
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              autoFocus
            />
          </Field>
        </div>
      </Modal>
    </AppShell>
  );
}

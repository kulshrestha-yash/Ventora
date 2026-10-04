// src/context/DataContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";
import { api } from "../lib/api.js";
import * as db from "../lib/db/localStorageStore.js";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [tokenBalance, setTokenBalance] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState({});

  // Presence channel (same-browser live presence per spec §8.6)
  useEffect(() => {
    if (!user?._id) return;

    let channel = null;
    try {
      channel = new BroadcastChannel("ventora:presence");
      channel.onmessage = (event) => {
        if (event.data?.userId && event.data?.ts) {
          setOnlineUsers((prev) => ({
            ...prev,
            [event.data.userId]: event.data.ts
          }));
        }
      };

      // Broadcast heartbeat every 10s
      const broadcastHeartbeat = () => {
        channel.postMessage({ userId: user._id, ts: Date.now() });
      };

      broadcastHeartbeat();
      const interval = setInterval(broadcastHeartbeat, 10000);

      return () => {
        clearInterval(interval);
        channel.close();
      };
    } catch {
      // BroadcastChannel not available in environment
    }
  }, [user?._id]);

  const refreshData = useCallback(async () => {
    if (!user?._id) return;

    try {
      // 1. Token balance (for investors)
      if (user.role === "investor") {
        const { balance } = await api.tokens.balance({ investorId: user._id });
        setTokenBalance(balance);
      }

      // 2. Unread messages count
      const convs = await api.conversations.listMine({ userId: user._id });
      const totalUnread = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      setUnreadMessagesCount(totalUnread);

      // 3. Pending requests count (for innovators)
      if (user.role === "innovator") {
        const requests = await api.requests.listForInnovator({ innovatorId: user._id });
        const meta = db.getMeta() || {};
        const ignored = meta.ignoredRequests || [];
        const pending = requests.filter((r) => r.status === "pending" && !ignored.includes(r._id));
        setPendingRequestsCount(pending.length);
      }
    } catch (err) {
      console.warn("DataContext refresh error:", err);
    }
  }, [user]);

  useEffect(() => {
    refreshData();

    const handleSync = () => {
      refreshData();
    };

    window.addEventListener("ventora:db", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      window.removeEventListener("ventora:db", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [refreshData]);

  const isUserOnline = useCallback((targetUserId) => {
    if (!targetUserId) return false;
    const lastHeartbeat = onlineUsers[targetUserId];
    if (!lastHeartbeat) return false;
    return Date.now() - lastHeartbeat < 25000; // < 25s
  }, [onlineUsers]);

  return (
    <DataContext.Provider
      value={{
        tokenBalance,
        unreadMessagesCount,
        pendingRequestsCount,
        refreshData,
        isUserOnline
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}

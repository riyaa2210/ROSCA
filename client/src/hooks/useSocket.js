import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

/**
 * Socket URL:
 *  - Dev:  connects to localhost:5000
 *  - Prod (same service): connects to window.location.origin
 *  - Prod (separate static site): connects to VITE_API_URL
 */
const SOCKET_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.MODE === "production" ? window.location.origin : "http://localhost:5000");

export function useSocket(groupId, onPaymentUpdate) {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    if (groupId) socketRef.current.emit("join_group", groupId);

    socketRef.current.on("payment_update",   (data) => onPaymentUpdate?.(data));
    socketRef.current.on("payout_processed", (data) => onPaymentUpdate?.(data));

    return () => {
      if (groupId) socketRef.current.emit("leave_group", groupId);
      socketRef.current.disconnect();
    };
  }, [groupId]);

  return socketRef.current;
}

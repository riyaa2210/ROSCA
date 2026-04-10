import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

// In production the client is served from the same origin as the server,
// so we connect to window.location.origin. In dev, Vite proxies handle it.
const SOCKET_URL =
  import.meta.env.MODE === "production"
    ? window.location.origin
    : "http://localhost:5000";

export function useSocket(groupId, onPaymentUpdate) {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { withCredentials: true });

    if (groupId) {
      socketRef.current.emit("join_group", groupId);
    }

    socketRef.current.on("payment_update", (data) => {
      onPaymentUpdate?.(data);
    });

    socketRef.current.on("payout_processed", (data) => {
      onPaymentUpdate?.(data);
    });

    return () => {
      if (groupId) socketRef.current.emit("leave_group", groupId);
      socketRef.current.disconnect();
    };
  }, [groupId]);

  return socketRef.current;
}

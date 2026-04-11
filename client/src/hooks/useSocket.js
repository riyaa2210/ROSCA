import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

/**
 * Same origin — connect to window.location.origin in production,
 * localhost:5000 in development.
 */
const SOCKET_URL =
  import.meta.env.MODE === "production"
    ? window.location.origin
    : "http://localhost:5000";

export function useSocket(groupId, onPaymentUpdate) {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    if (groupId) socketRef.current.emit("join_group", groupId);

    socketRef.current.on("payment_update", (data) => onPaymentUpdate?.(data));
    socketRef.current.on("payout_processed", (data) => onPaymentUpdate?.(data));

    return () => {
      if (groupId) socketRef.current.emit("leave_group", groupId);
      socketRef.current.disconnect();
    };
  }, [groupId]);

  return socketRef.current;
}

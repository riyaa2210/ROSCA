import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function useSocket(groupId, onPaymentUpdate) {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("/", { withCredentials: true });

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

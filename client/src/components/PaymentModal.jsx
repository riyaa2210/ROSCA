import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FiX, FiShield, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

export default function PaymentModal({ group, month, onClose, onSuccess }) {
  const { user } = useAuth();
  const [step, setStep]       = useState("confirm"); // confirm | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const handlePay = async () => {
    // Guard: Razorpay SDK must be loaded
    if (!window.Razorpay) {
      toast.error("Payment gateway not loaded. Please refresh the page.");
      return;
    }

    setStep("loading");
    setErrorMsg("");

    try {
      // Step 1: Create order on backend
      const { data } = await api.post("/payments/order", {
        groupId: group._id,
        month,
      });

      const { order, key } = data;

      // Step 2: Open Razorpay checkout
      const options = {
        key,
        amount:      order.amount,       // in paise
        currency:    "INR",
        name:        "SaveSangam",
        description: `Contribution — ${group.name} · Month ${month}`,
        order_id:    order.id,
        image:       "https://ui-avatars.com/api/?name=S&background=6366f1&color=fff&bold=true&size=80",

        // Prefill user details so they don't have to type them
        prefill: {
          name:    user?.name  || "",
          email:   user?.email || "",
          contact: user?.phone || "",
        },

        // Razorpay theme
        theme: { color: "#6366f1" },

        // Notes stored on Razorpay dashboard for reconciliation
        notes: {
          groupId:  group._id,
          groupName: group.name,
          month:    String(month),
          userId:   user?._id,
        },

        // Called when payment is successful
        handler: async (response) => {
          try {
            // Step 3: Verify payment signature on backend
            await api.post("/payments/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              groupId: group._id,
              month,
            });

            setStep("success");
            toast.success("Payment successful! 🎉");

            // Refresh group data after 1.5s then close
            setTimeout(() => {
              onSuccess?.();
              onClose();
            }, 2000);

          } catch (verifyErr) {
            setStep("error");
            setErrorMsg(
              verifyErr.response?.data?.message ||
              "Payment was made but verification failed. Contact support with your payment ID: " +
              response.razorpay_payment_id
            );
          }
        },

        // Called when user closes the Razorpay modal without paying
        modal: {
          ondismiss: () => {
            if (step === "loading") setStep("confirm");
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // Handle payment failure from Razorpay
      rzp.on("payment.failed", (response) => {
        setStep("error");
        setErrorMsg(
          response.error?.description ||
          `Payment failed: ${response.error?.reason || "Unknown error"}`
        );
      });

      rzp.open();

    } catch (err) {
      setStep("error");
      setErrorMsg(err.response?.data?.message || "Failed to initiate payment. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && step !== "loading" && onClose()}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          {/* ── Success state ── */}
          {step === "success" && (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.1 }}
                className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <FiCheckCircle size={40} className="text-emerald-600" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                ₹{group.monthlyAmount.toLocaleString("en-IN")} contributed to <strong>{group.name}</strong>
              </p>
              <p className="text-xs text-gray-400 mt-3">Closing automatically...</p>
            </div>
          )}

          {/* ── Error state ── */}
          {step === "error" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Payment Failed</h3>
                <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                  <FiX size={18} />
                </button>
              </div>
              <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl mb-5">
                <FiAlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">{errorMsg}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1">Close</button>
                <button onClick={() => setStep("confirm")} className="btn-primary flex-1">Try Again</button>
              </div>
            </div>
          )}

          {/* ── Confirm / Loading state ── */}
          {(step === "confirm" || step === "loading") && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Payment</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Secured by Razorpay</p>
                </div>
                <button
                  onClick={onClose}
                  disabled={step === "loading"}
                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 disabled:opacity-40"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Payment details */}
              <div className="px-6 py-5 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800">
                  <span className="text-sm text-gray-500">Group</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{group.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800">
                  <span className="text-sm text-gray-500">Month</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{month} of {group.duration}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800">
                  <span className="text-sm text-gray-500">Paying as</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-base font-semibold text-gray-700 dark:text-gray-300">Total Amount</span>
                  <span className="text-2xl font-black text-indigo-600">
                    ₹{group.monthlyAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Security note */}
              <div className="mx-6 mb-5 flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <FiShield size={14} className="text-emerald-500 flex-shrink-0" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  256-bit SSL encrypted · UPI, Cards, Net Banking accepted
                </p>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={step === "loading"}
                  className="btn-secondary flex-1 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePay}
                  disabled={step === "loading"}
                  className="btn-primary flex-1 relative"
                >
                  {step === "loading" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Opening...
                    </span>
                  ) : (
                    `Pay ₹${group.monthlyAmount.toLocaleString("en-IN")}`
                  )}
                </button>
              </div>

              {/* Razorpay branding */}
              <div className="text-center pb-4">
                <p className="text-xs text-gray-400">
                  Powered by{" "}
                  <span className="font-semibold text-[#072654]">Razorpay</span>
                </p>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

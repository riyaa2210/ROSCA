import { useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import Spinner from "./Spinner";

export default function PaymentModal({ group, month, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/payments/order", { groupId: group._id, month });
      const { order, key } = data;

      const options = {
        key,
        amount: order.amount,
        currency: "INR",
        name: "Bhishi App",
        description: `Contribution for ${group.name} - Month ${month}`,
        order_id: order.id,
        handler: async (response) => {
          await api.post("/payments/verify", {
            ...response,
            groupId: group._id,
            month,
          });
          toast.success("Payment successful!");
          onSuccess?.();
          onClose();
        },
        prefill: {},
        theme: { color: "#6366f1" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">Make Payment</h2>
        <div className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Group</span>
            <span className="font-medium text-gray-900 dark:text-white">{group.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Month</span>
            <span className="font-medium text-gray-900 dark:text-white">{month}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount</span>
            <span className="font-bold text-primary-600 text-lg">₹{group.monthlyAmount}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handlePay} disabled={loading} className="btn-primary flex-1">
            {loading ? <Spinner size="sm" /> : "Pay Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

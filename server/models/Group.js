const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  joinedAt: { type: Date, default: Date.now },
  payoutPosition: { type: Number, default: null },
  hasReceivedPayout: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "left"], default: "active" },
});

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [memberSchema],
    monthlyAmount: { type: Number, required: true, min: 1 },
    maxMembers: { type: Number, required: true, min: 2 },
    duration: { type: Number, required: true }, // months
    startDate: { type: Date },
    currentMonth: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled"],
      default: "pending",
    },
    payoutOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    inviteCode: { type: String, unique: true },
    payoutType: { type: String, enum: ["random", "auction", "manual"], default: "random" },
    nextPayoutDate: { type: Date },
  },
  { timestamps: true }
);

// Virtual: total pool per cycle
groupSchema.virtual("totalPool").get(function () {
  return this.monthlyAmount * this.members.filter((m) => m.status === "active").length;
});

groupSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Group", groupSchema);

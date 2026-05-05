"use strict";

const walletService = require("../services/walletService");
const {
  WalletError,
  InsufficientBalanceError,
  WalletNotFoundError,
  DuplicateOperationError,
} = walletService;

// ── Error handler helper ──────────────────────────────────────────────────────
function handleWalletError(err, res) {
  if (err instanceof InsufficientBalanceError) {
    return res.status(422).json({
      code:      err.code,
      message:   err.message,
      available: err.available,
      required:  err.required,
    });
  }
  if (err instanceof WalletNotFoundError) {
    return res.status(404).json({ code: err.code, message: err.message });
  }
  if (err instanceof DuplicateOperationError) {
    return res.status(409).json({ code: err.code, message: err.message });
  }
  if (err instanceof WalletError) {
    return res.status(400).json({ code: err.code, message: err.message });
  }
  // Unknown error
  console.error("[WalletController]", err);
  return res.status(500).json({ message: "Internal server error" });
}

// ── GET /api/wallet ───────────────────────────────────────────────────────────
exports.getMyWallet = async (req, res) => {
  try {
    const wallet = await walletService.getWallet(req.user._id);
    res.json(wallet);
  } catch (err) {
    handleWalletError(err, res);
  }
};

// ── GET /api/wallet/ledger ────────────────────────────────────────────────────
exports.getMyLedger = async (req, res) => {
  try {
    const { page = 1, limit = 20, source, type } = req.query;
    const result = await walletService.getLedger(req.user._id, {
      page:   parseInt(page),
      limit:  Math.min(100, parseInt(limit)),
      source,
      type,
    });
    res.json(result);
  } catch (err) {
    handleWalletError(err, res);
  }
};

// ── GET /api/wallet/reconcile ─────────────────────────────────────────────────
exports.reconcile = async (req, res) => {
  try {
    const result = await walletService.reconcileWallet(req.user._id);
    res.json(result);
  } catch (err) {
    handleWalletError(err, res);
  }
};

// ── POST /api/wallet/deposit  (admin or test use) ─────────────────────────────
exports.deposit = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const { wallet, ledgerEntry } = await walletService.creditWallet(
      req.user._id,
      Number(amount),
      {
        source:      "deposit",
        description: description || "Manual deposit",
        createdBy:   req.user._id,
      }
    );

    res.json({ wallet, ledgerEntry });
  } catch (err) {
    handleWalletError(err, res);
  }
};

// ── POST /api/wallet/withdraw ─────────────────────────────────────────────────
exports.withdraw = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const { wallet, ledgerEntry } = await walletService.debitWallet(
      req.user._id,
      Number(amount),
      {
        source:      "withdrawal",
        description: description || "Withdrawal",
        createdBy:   req.user._id,
      }
    );

    res.json({ wallet, ledgerEntry });
  } catch (err) {
    handleWalletError(err, res);
  }
};

// ── POST /api/wallet/admin/credit  (admin only) ───────────────────────────────
exports.adminCredit = async (req, res) => {
  try {
    const { userId, amount, description, referenceId, referenceModel } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ message: "userId and amount are required" });
    }

    const { wallet, ledgerEntry } = await walletService.creditWallet(
      userId,
      Number(amount),
      {
        source:         "admin_credit",
        description:    description || "Admin credit",
        referenceId:    referenceId    || null,
        referenceModel: referenceModel || null,
        createdBy:      req.user._id,
      }
    );

    res.json({ wallet, ledgerEntry });
  } catch (err) {
    handleWalletError(err, res);
  }
};

// ── POST /api/wallet/admin/debit  (admin only) ────────────────────────────────
exports.adminDebit = async (req, res) => {
  try {
    const { userId, amount, description, referenceId, referenceModel } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ message: "userId and amount are required" });
    }

    const { wallet, ledgerEntry } = await walletService.debitWallet(
      userId,
      Number(amount),
      {
        source:         "admin_debit",
        description:    description || "Admin debit",
        referenceId:    referenceId    || null,
        referenceModel: referenceModel || null,
        createdBy:      req.user._id,
      }
    );

    res.json({ wallet, ledgerEntry });
  } catch (err) {
    handleWalletError(err, res);
  }
};

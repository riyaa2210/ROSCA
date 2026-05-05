"use strict";

const mongoose  = require("mongoose");
const Wallet     = require("../models/Wallet");
const LedgerEntry = require("../models/LedgerEntry");

// ── Custom error classes ──────────────────────────────────────────────────────

class WalletError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "WalletError";
    this.code = code;
  }
}

class InsufficientBalanceError extends WalletError {
  constructor(available, required) {
    super(
      `Insufficient balance: required ₹${required}, available ₹${available}`,
      "INSUFFICIENT_BALANCE"
    );
    this.name = "InsufficientBalanceError";
    this.available = available;
    this.required  = required;
  }
}

class WalletNotFoundError extends WalletError {
  constructor(userId) {
    super(`Wallet not found for user: ${userId}`, "WALLET_NOT_FOUND");
    this.name = "WalletNotFoundError";
  }
}

class DuplicateOperationError extends WalletError {
  constructor(key) {
    super(`Operation already processed: ${key}`, "DUPLICATE_OPERATION");
    this.name = "DuplicateOperationError";
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Run a function inside a MongoDB session with retry on transient errors.
 * Retries up to 3 times on WriteConflict (concurrent session collision).
 */
async function withSession(fn, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction({
        readConcern:  { level: "snapshot" },
        writeConcern: { w: "majority" },
      });

      const result = await fn(session);

      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();

      // Retry on transient transaction errors (WriteConflict, etc.)
      const isTransient =
        err.errorLabels?.includes("TransientTransactionError") ||
        err.code === 112; // WriteConflict

      if (isTransient && attempt < maxRetries - 1) {
        attempt++;
        await new Promise((r) => setTimeout(r, 50 * attempt)); // back-off
        continue;
      }

      // Re-throw known domain errors as-is
      if (err instanceof WalletError) throw err;

      // Wrap duplicate key error (idempotency key collision)
      if (err.code === 11000 && err.keyPattern?.idempotencyKey) {
        throw new DuplicateOperationError(err.keyValue?.idempotencyKey);
      }

      throw err;
    } finally {
      session.endSession();
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * createWallet(userId)
 * Creates a wallet for a new user. Idempotent — safe to call multiple times.
 */
async function createWallet(userId) {
  const existing = await Wallet.findOne({ user: userId });
  if (existing) return existing;

  const wallet = await Wallet.create({ user: userId, balance: 0 });
  return wallet;
}

/**
 * getWallet(userId)
 * Returns the wallet or throws WalletNotFoundError.
 */
async function getWallet(userId) {
  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) throw new WalletNotFoundError(userId);
  return wallet;
}

/**
 * creditWallet(userId, amount, options)
 *
 * Credits the wallet and writes a ledger entry atomically.
 *
 * @param {ObjectId|string} userId
 * @param {number}          amount        - positive number in INR
 * @param {object}          options
 * @param {string}          options.source         - ledger source enum
 * @param {string}          [options.description]  - human-readable note
 * @param {ObjectId}        [options.referenceId]  - group/transaction id
 * @param {string}          [options.referenceModel]
 * @param {string}          [options.idempotencyKey] - prevents double-credit
 * @param {ObjectId}        [options.createdBy]    - admin user id if manual
 *
 * @returns {{ wallet, ledgerEntry }}
 */
async function creditWallet(userId, amount, options = {}) {
  _validateAmount(amount);

  return withSession(async (session) => {
    // Lock the wallet row for update within this session
    const wallet = await Wallet.findOne({ user: userId }).session(session);
    if (!wallet) throw new WalletNotFoundError(userId);
    if (!wallet.isActive) throw new WalletError("Wallet is inactive", "WALLET_INACTIVE");

    const balanceBefore = wallet.balance;
    const balanceAfter  = balanceBefore + amount;

    // Update wallet
    wallet.balance       = balanceAfter;
    wallet.totalCredited += amount;
    await wallet.save({ session });

    // Write ledger entry
    const [ledgerEntry] = await LedgerEntry.create(
      [
        {
          user:            userId,
          wallet:          wallet._id,
          type:            "credit",
          amount,
          balanceBefore,
          balanceAfter,
          source:          options.source,
          description:     options.description,
          referenceId:     options.referenceId    || null,
          referenceModel:  options.referenceModel || null,
          idempotencyKey:  options.idempotencyKey || null,
          createdBy:       options.createdBy      || null,
        },
      ],
      { session }
    );

    return { wallet, ledgerEntry };
  });
}

/**
 * debitWallet(userId, amount, options)
 *
 * Debits the wallet and writes a ledger entry atomically.
 * Throws InsufficientBalanceError if balance < amount.
 *
 * @param {ObjectId|string} userId
 * @param {number}          amount
 * @param {object}          options  - same shape as creditWallet
 *
 * @returns {{ wallet, ledgerEntry }}
 */
async function debitWallet(userId, amount, options = {}) {
  _validateAmount(amount);

  return withSession(async (session) => {
    const wallet = await Wallet.findOne({ user: userId }).session(session);
    if (!wallet) throw new WalletNotFoundError(userId);
    if (!wallet.isActive) throw new WalletError("Wallet is inactive", "WALLET_INACTIVE");

    // ── Insufficient balance check ────────────────────────────────────────────
    if (!wallet.hasSufficientBalance(amount)) {
      throw new InsufficientBalanceError(wallet.balance, amount);
    }

    const balanceBefore = wallet.balance;
    const balanceAfter  = balanceBefore - amount;

    wallet.balance      = balanceAfter;
    wallet.totalDebited += amount;
    await wallet.save({ session });

    const [ledgerEntry] = await LedgerEntry.create(
      [
        {
          user:            userId,
          wallet:          wallet._id,
          type:            "debit",
          amount,
          balanceBefore,
          balanceAfter,
          source:          options.source,
          description:     options.description,
          referenceId:     options.referenceId    || null,
          referenceModel:  options.referenceModel || null,
          idempotencyKey:  options.idempotencyKey || null,
          createdBy:       options.createdBy      || null,
        },
      ],
      { session }
    );

    return { wallet, ledgerEntry };
  });
}

/**
 * transferBetweenWallets(fromUserId, toUserId, amount, options)
 *
 * Atomically debits one wallet and credits another.
 * Both operations happen in the same session — either both succeed or both fail.
 */
async function transferBetweenWallets(fromUserId, toUserId, amount, options = {}) {
  _validateAmount(amount);

  return withSession(async (session) => {
    // Fetch both wallets — sort by _id to prevent deadlock
    const ids = [fromUserId, toUserId].sort();
    const wallets = await Wallet.find({ user: { $in: ids } }).session(session);

    const fromWallet = wallets.find((w) => w.user.toString() === fromUserId.toString());
    const toWallet   = wallets.find((w) => w.user.toString() === toUserId.toString());

    if (!fromWallet) throw new WalletNotFoundError(fromUserId);
    if (!toWallet)   throw new WalletNotFoundError(toUserId);

    if (!fromWallet.hasSufficientBalance(amount)) {
      throw new InsufficientBalanceError(fromWallet.balance, amount);
    }

    const fromBefore = fromWallet.balance;
    const toBefore   = toWallet.balance;

    fromWallet.balance      -= amount;
    fromWallet.totalDebited += amount;
    toWallet.balance        += amount;
    toWallet.totalCredited  += amount;

    await fromWallet.save({ session });
    await toWallet.save({ session });

    const entries = await LedgerEntry.create(
      [
        {
          user:           fromUserId,
          wallet:         fromWallet._id,
          type:           "debit",
          amount,
          balanceBefore:  fromBefore,
          balanceAfter:   fromWallet.balance,
          source:         options.source || "payout",
          description:    options.description,
          referenceId:    options.referenceId   || null,
          referenceModel: options.referenceModel || null,
          idempotencyKey: options.idempotencyKey ? `${options.idempotencyKey}:debit`  : null,
          createdBy:      options.createdBy || null,
        },
        {
          user:           toUserId,
          wallet:         toWallet._id,
          type:           "credit",
          amount,
          balanceBefore:  toBefore,
          balanceAfter:   toWallet.balance,
          source:         options.source || "payout",
          description:    options.description,
          referenceId:    options.referenceId   || null,
          referenceModel: options.referenceModel || null,
          idempotencyKey: options.idempotencyKey ? `${options.idempotencyKey}:credit` : null,
          createdBy:      options.createdBy || null,
        },
      ],
      { session }
    );

    return {
      fromWallet,
      toWallet,
      debitEntry:  entries[0],
      creditEntry: entries[1],
    };
  });
}

/**
 * getLedger(userId, filters)
 * Returns paginated ledger entries for a user.
 */
async function getLedger(userId, { page = 1, limit = 20, source, type } = {}) {
  const filter = { user: userId };
  if (source) filter.source = source;
  if (type)   filter.type   = type;

  const skip  = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    LedgerEntry.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("referenceId"),
    LedgerEntry.countDocuments(filter),
  ]);

  return {
    entries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * reconcileWallet(userId)
 * Recalculates balance from ledger entries and compares to stored balance.
 * Returns { isConsistent, storedBalance, calculatedBalance, diff }.
 * Use for auditing — does NOT modify the wallet.
 */
async function reconcileWallet(userId) {
  const wallet = await getWallet(userId);

  const result = await LedgerEntry.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalCredits: { $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] } },
        totalDebits:  { $sum: { $cond: [{ $eq: ["$type", "debit"]  }, "$amount", 0] } },
      },
    },
  ]);

  const { totalCredits = 0, totalDebits = 0 } = result[0] || {};
  const calculatedBalance = totalCredits - totalDebits;
  const diff = wallet.balance - calculatedBalance;

  return {
    isConsistent:       Math.abs(diff) < 0.001, // float tolerance
    storedBalance:      wallet.balance,
    calculatedBalance,
    totalCredits,
    totalDebits,
    diff,
  };
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _validateAmount(amount) {
  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    throw new WalletError("Amount must be a positive number", "INVALID_AMOUNT");
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  createWallet,
  getWallet,
  creditWallet,
  debitWallet,
  transferBetweenWallets,
  getLedger,
  reconcileWallet,
  // Error classes — import these in controllers for instanceof checks
  WalletError,
  InsufficientBalanceError,
  WalletNotFoundError,
  DuplicateOperationError,
};

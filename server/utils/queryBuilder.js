/**
 * Reusable query builder for MongoDB search, filter, sort, paginate
 */

/**
 * Parse common query params from req.query
 * Supports: search, status, type, dateFrom, dateTo, sortBy, order, page, limit
 */
exports.parseQuery = (query) => {
  const {
    search = "",
    status = "",
    type = "",
    dateFrom = "",
    dateTo = "",
    sortBy = "createdAt",
    order = "desc",
    page = 1,
    limit = 20,
  } = query;

  return {
    search: search.trim(),
    status: status.trim(),
    type: type.trim(),
    dateFrom: dateFrom ? new Date(dateFrom) : null,
    dateTo: dateTo ? new Date(dateTo) : null,
    sortBy,
    order: order === "asc" ? 1 : -1,
    page: Math.max(1, parseInt(page)),
    limit: Math.min(100, Math.max(1, parseInt(limit))),
  };
};

/**
 * Build a MongoDB sort object
 * Special case: "amount" sorts by amount field
 */
exports.buildSort = (sortBy, order) => {
  const allowed = ["createdAt", "amount", "name", "monthlyAmount", "paidAt"];
  const field = allowed.includes(sortBy) ? sortBy : "createdAt";
  return { [field]: order };
};

/**
 * Build date range filter for a given field
 */
exports.buildDateFilter = (field, dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return {};
  const filter = {};
  if (dateFrom) filter.$gte = dateFrom;
  if (dateTo) {
    // Include the full end day
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    filter.$lte = end;
  }
  return { [field]: filter };
};

/**
 * Build pagination metadata
 */
exports.paginate = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

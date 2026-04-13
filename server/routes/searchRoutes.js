const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { globalSearch } = require("../controllers/searchController");

router.use(protect);
router.get("/", globalSearch);

module.exports = router;

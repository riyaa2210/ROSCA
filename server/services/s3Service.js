const path = require("path");
const fs = require("fs");

const UPLOADS_DIR = path.join(__dirname, "../uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Returns the public URL for a stored file
exports.getFileUrl = (filename) => {
  return `/uploads/${filename}`;
};

// Delete a file by its URL path
exports.deleteLocalFile = (fileUrl) => {
  if (!fileUrl) return;
  const filename = path.basename(fileUrl);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

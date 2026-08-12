const router = require('express').Router();
const multer = require('multer');
const ctrl = require('../controllers/aiImport.controller');
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const protectedImport = [authenticate, adminOnly, upload.single('file'), ctrl.importQuestions];

// Keep both paths so older/newer frontend builds remain compatible.
router.post('/import-questions', ...protectedImport);
router.post('/quizzes/import-questions', ...protectedImport);

module.exports = router;

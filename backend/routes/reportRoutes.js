const router = require('express').Router();
const c = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);
router.get('/summary', c.getSummary);
router.get('/occupancy', c.getOccupancy);
router.get('/monthly-revenue', c.getMonthlyRevenue);
router.get('/top-guests', c.getTopGuests);

module.exports = router;

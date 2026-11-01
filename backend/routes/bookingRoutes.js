const router = require('express').Router();
const c = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(c.getBookings).post(c.createBooking);
router.route('/:id').get(c.getBooking).put(c.updateBooking).delete(c.deleteBooking);

module.exports = router;

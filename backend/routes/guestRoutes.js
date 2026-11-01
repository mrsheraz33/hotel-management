const router = require('express').Router();
const c = require('../controllers/guestController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(c.getGuests).post(c.createGuest);
router.route('/:id').get(c.getGuest).put(c.updateGuest).delete(c.deleteGuest);

module.exports = router;

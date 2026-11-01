const router = require('express').Router();
const c = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(c.getStaff).post(c.createStaff);
router.route('/:id').get(c.getStaffMember).put(c.updateStaff).delete(c.deleteStaff);

module.exports = router;

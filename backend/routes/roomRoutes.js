const router = require('express').Router();
const c = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/filter/:status', c.filterRooms);
router.route('/').get(c.getRooms).post(c.createRoom);
router.route('/:id').get(c.getRoom).put(c.updateRoom).delete(c.deleteRoom);

module.exports = router;

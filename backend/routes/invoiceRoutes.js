const router = require('express').Router();
const c = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(c.getInvoices).post(c.createInvoice);
router.route('/:id').get(c.getInvoice).put(c.updateInvoice).delete(c.deleteInvoice);

module.exports = router;

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/',              ctrl.create);
router.get('/mine',           ctrl.getMine);
router.get('/earnings',       ctrl.getEarnings);
router.get('/:id',            ctrl.getOne);
router.patch('/:id/cancel',   ctrl.cancel);

module.exports = router;

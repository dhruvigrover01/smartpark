const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/parkingController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/',            ctrl.getNearby);
router.get('/mine',        protect, ctrl.getMine);
router.get('/:id',         ctrl.getOne);
router.post('/',           protect, restrictTo('owner','admin'), ctrl.create);
router.put('/:id',         protect, ctrl.update);
router.delete('/:id',      protect, ctrl.remove);
router.patch('/:id/verify',protect, restrictTo('admin'), ctrl.verify);

module.exports = router;

const express = require( "express" );
const { getOrders, getRecentOrder, getRecentOrderReverse, getOrderByStatus, updateStatus, getSingleOrder } = require( "../../controller/admin/merchantOrder" );
const router = express.Router();

router.get( '/', getOrders );
router.get( '/recent', getRecentOrder );
router.get( '/older', getRecentOrderReverse );
router.route( '/status' )
      .get( getOrderByStatus )
      .patch( updateStatus );

router.get( '/:id', getSingleOrder );

module.exports = router;
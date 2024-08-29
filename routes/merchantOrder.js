const express = require( "express" );
const { getOrders, getRecentOrder, getRecentOrderReverse, getOrderByStatus } = require( "../controller/merchantOrder" );
const router = express.Router();

router.get( '/', getOrders );
router.get( '/recent', getRecentOrder );
router.get( '/older', getRecentOrderReverse );
router.get( '/status', getOrderByStatus );

module.exports = router;
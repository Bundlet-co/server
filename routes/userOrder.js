const express = require( "express" );
const { createOrder, getOrder, getSingleOrder, cancelOrder, deliveredOrder } = require( "../controller/userOrderController" );
const router = express.Router();


router.route( "/" )
      .post( createOrder )
      .get( getOrder )

router.route( '/:id' )
      .get( getSingleOrder )
      .put( cancelOrder )
      .patch(deliveredOrder)
module.exports = router
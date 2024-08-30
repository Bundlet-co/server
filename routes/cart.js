const express = require( "express" );
const { getCart, addTocart, editCartItem, clearAll, deleteCartItem } = require( "../controller/cartController" );
const router = express.Router();



router.route( "/" )
      .get( getCart )
      .post( addTocart )
      .patch( editCartItem )
      .delete(clearAll)

router.route( "/:id" )
      .delete(deleteCartItem)

module.exports = router
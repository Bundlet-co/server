const express = require( "express" );
const { getCart, addTocart, editCartItem, clearAll, deleteCartItem, addAllToCart } = require( "../controller/cartController" );
const router = express.Router();



router.route( "/" )
      .get( getCart )
      .post( addTocart )
      .patch( editCartItem )
      .delete( clearAll )
      
router.post('/add',addAllToCart)

router.route( "/:id" )
      .delete(deleteCartItem)

module.exports = router
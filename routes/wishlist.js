const { getWishlist, addToWishlist, removeFromWishlist, addAllToWishlist, removeFromAllWishlist } = require( "../controller/wishlistController" );

const router = require( "express" ).Router();


router.route( '/' )
      .get( getWishlist )
      .post( addToWishlist )
      .delete(removeFromAllWishlist)

router.post('/add',addAllToWishlist)

router.route( '/:id' )
      .delete(removeFromWishlist)

module.exports = router
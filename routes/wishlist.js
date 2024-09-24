const { getWishlist, addToWishlist, removeFromWishlist, addAllToWishlist } = require( "../controller/wishlistController" );

const router = require( "express" ).Router();


router.route( '/' )
      .get( getWishlist )
      .post( addToWishlist )

router.post('/add',addAllToWishlist)

router.route( '/:id' )
      .delete(removeFromWishlist)

module.exports = router
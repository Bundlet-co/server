const express = require( "express" );
const { getProduct, getSingleProduct, getProductByCategory, searchFilter, getRandomProducts, getFlashDeals } = require( "../controller/userProductController" );
const router = express.Router();


router.get( '/', getProduct );
router.get( '/flash', getFlashDeals );
router.get( '/category', getProductByCategory );
router.get( '/search', searchFilter );
router.get( '/carousel', getRandomProducts );
router.get( '/:id', getSingleProduct );


module.exports = router;
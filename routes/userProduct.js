const express = require( "express" );
const { getProduct, getSingleProduct } = require( "../controller/userProductController" );
const router = express.Router();


router.get( '/', getProduct )
router.get('/:id',getSingleProduct)


module.exports = router;
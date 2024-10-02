const express = require( "express" );
const { createMerchant, loginMerchant} = require( "../../controller/admin/merchantAuthController" );
const router = express.Router();


router.post( '/register', createMerchant );
router.post( "/login", loginMerchant );


module.exports = router
const express = require( "express" );
const { createMerchant, loginMerchant, editMerchant, deleteMerchant, updateDp } = require( "../controller/merchantAuthController" );
const { verifyMerchant } = require( "../middlewares/auth" );
const router = express.Router();


router.post( '/register', createMerchant );
router.post( "/login", loginMerchant );


module.exports = router
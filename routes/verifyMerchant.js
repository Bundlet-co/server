const { verifyMerchantCode, resendMerchantVerification } = require( "../controller/verifyMerchantController" );

const router = require( "express" ).Router();


router.post( '/', verifyMerchantCode );
router.get( '/:email', resendMerchantVerification );

module.exports = router
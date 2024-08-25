const { verifyCode, resendVerification } = require( "../controller/verifyController" );

const router = require( "express" ).Router();



router.post( '/', verifyCode )
router.get("/:email", resendVerification)


module.exports = router
const { logout, logoutMerchant } = require( "../controller/logoutController" );

const router = require( "express" ).Router();
const merchantRouter = require( "express" ).Router();



router.get( '/',logout );

merchantRouter.get( '/', logoutMerchant );

module.exports ={router,merchantRouter}
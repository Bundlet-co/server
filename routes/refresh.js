const express = require( "express" );
const { refresh, merchantRefresh } = require( "../controller/refreshController" );
const router = express.Router();


router.get( '/', refresh )
router.get('/merchant', merchantRefresh)


module.exports = router
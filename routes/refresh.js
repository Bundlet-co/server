const express = require( "express" );
const { refresh, merchantRefresh } = require( "../controller/refreshController" );
const router = express.Router();


router.get( '/', refresh )


module.exports = router
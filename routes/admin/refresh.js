const express = require( "express" );
const { refresh, merchantRefresh } = require( "../../controller/refreshController" );
const router = express.Router();


router.get('/', merchantRefresh)


module.exports = router
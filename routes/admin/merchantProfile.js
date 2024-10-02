const express = require( "express" );
const { editMerchant, deleteMerchant, updateDp } = require( "../../controller/admin/merchantAuthController" );
const router = express.Router();


router.route( "/:id" )
      .put( editMerchant )
      .patch( updateDp )
      .delete( deleteMerchant );

module.exports = router
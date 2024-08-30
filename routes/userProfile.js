const express = require( "express" );
const {editUser, deleteUser } = require( "../controller/userAuthController" );
const router = express.Router();



router.route( '/:id' )
      .put( editUser )
      .delete( deleteUser );



module.exports = router
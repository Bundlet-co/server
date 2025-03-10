const express = require( "express" );
const {editUser, deleteUser, deposit } = require( "../controller/userAuthController" );
const router = express.Router();


router.get("/",deposit)
router.route( '/:id' )
      .put( editUser )
      .delete( deleteUser );



module.exports = router
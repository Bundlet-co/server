const express = require( "express" );
const { createUser, loginUser, editUser, deleteUser } = require( "../controller/userAuthController" );
const { verifyJwt } = require( "../middlewares/auth" );
const router = express.Router();



router.post( '/register', createUser );
router.post( '/login', loginUser );

router.route( '/:id', verifyJwt )
      .put( editUser )
      .delete( deleteUser );



module.exports = router
const express = require( "express" );
const { createUser, loginUser, editUser, deleteUser } = require( "../controller/userAuthController" );
const { verifyJwt } = require( "../middlewares/auth" );
const router = express.Router();



router.post( '/register', createUser );
router.post( '/login', loginUser );




module.exports = router
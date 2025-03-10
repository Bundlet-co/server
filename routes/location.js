const express = require( "express" );
const { fetchLoactions } = require( "../controller/locationController" );
const router = express.Router();


router.get( "/", fetchLoactions );

module.exports = router
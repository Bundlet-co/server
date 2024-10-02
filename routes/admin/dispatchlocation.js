const express = require( "express" );
const { createDispatchCenter, getDispatch, editDispatch, deleteDispatch, getDispatchByplace } = require( "../../controller/admin/dispatchCenterController" );
const router = express.Router();


router.route( '/' )
      .post( createDispatchCenter )
      .get( getDispatch )
      
router.get('/search',getDispatchByplace)
router.route( '/:id' )
      .put( editDispatch )
      .delete( deleteDispatch )
      

module.exports = router;
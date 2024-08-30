const express = require( "express" );
const { getSuplementryProduct, deleteAllSuplementryProduct, createSuplementryProduct, updateImage, getSingleSuplementryProduct, deleteSuplementryProduct, editSuplementryProdct } = require( "../controller/supplementryProduct" );
const router = express.Router();

router.route( '/' )
      .get( getSuplementryProduct )
      .delete( deleteAllSuplementryProduct )
      .post( createSuplementryProduct )
      .patch( updateImage )
      
router.route( '/:id' )
      .get( getSingleSuplementryProduct )
      .delete( deleteSuplementryProduct )
      .patch( editSuplementryProdct )


module.exports = router;
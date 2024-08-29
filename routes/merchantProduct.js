const express = require( "express" );
const { getProduct, createProduct, getSingleProduct, uploadImageAndDp, updateProduct, deleteProduct, deleteImage } = require( "../controller/merchantProductController" );
const router = express.Router();

router.route( '/' )
      .get( getProduct )
      .post( createProduct )
      .delete( deleteImage );

router.route( '/:id' )
      .get( getSingleProduct )
      .patch( uploadImageAndDp )
      .put( updateProduct )
      .delete( deleteProduct );


module.exports= router
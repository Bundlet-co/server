const express = require( "express" );
const { getSubcategory, createSubcategory, editSubCategory, deleteSubCategory } = require( "../controller/merchantSubCategoryController" );
const router = express.Router();




router.route( '/' )
      .get( getSubcategory )
      .post( createSubcategory )
      
router.route( '/:id' )
      .patch( editSubCategory )
      .delete(deleteSubCategory)


module.exports= router
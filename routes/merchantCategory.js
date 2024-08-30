const express = require( "express" );
const { createCategory, getCategories, editCategories, deleteCategory } = require( "../controller/merchantCategoryController" );
const router = express.Router();


router.route( '/' )
      .post( createCategory )
      .get( getCategories )


router.route( '/:id' )
      .patch( editCategories )
      .delete(deleteCategory)


module.exports = router;
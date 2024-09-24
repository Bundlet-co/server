const { getCategories } = require( "../controller/userCategoryController" );

const router = require( "express" ).Router();

router.get( '/', getCategories );

module.exports = router;
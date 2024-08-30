const { Prisma, PrismaClient } = require( "@prisma/client" );
const { sendSuccessResponse, sendErrorResponse } = require( "../utils/responseHelper" );

const prisma = new PrismaClient();


const createSubcategory = async ( req, res ) =>
{
      try {
            const { name, slug, main_category } = req.body;
            if ( !name, !main_category ) return sendErrorResponse( res, 400, "All field is required", null );
            
            const category = await prisma.subCategory.create( {
                  data: {
                        name, main_category, slug
                  }
            } );

            return sendSuccessResponse( res, 201, "Category was created successfully", { category } );
      } catch (error) {
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const getSubcategory = async ( req, res ) =>
{
      try {
            const { main_category } = req.query
            if ( !main_category ) return sendErrorResponse( res, 400, "main category is required" );
            const category = await prisma.subCategory.findMany({where:{main_category}});
            return sendSuccessResponse( res, 200, "Categories found", { category } );



      } catch ( error ) {
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const editSubCategory = async ( req, res ) =>
{
      const { id } = req.params;
      if ( !id ) return sendErrorResponse( res, 400, "Category Id is needed" );
      try {
            const { name, slug } = req.body;
            const product = await prisma.subCategory.findUniqueOrThrow( { where: { id } } );

            product.name = name ? name : product.name;
            product.slug = slug ? slug : product.slug;

            const editedCatagory = await prisma.subCategory.update( {
                  where: { id },
                  data: product
            } );

            return sendSuccessResponse( res, 202, "Category updated", { category: editedCatagory } );

      } catch ( error ) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === "P2025")
                  return sendErrorResponse(res,404,"Category not found", null)
            }
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};


const deleteSubCategory = async ( req, res ) =>
{
      const { id } = req.params;
      if ( !id ) return sendErrorResponse( res, 400, "Category Id is needed" );
      try {
            await prisma.subCategory.delete( { where: { id } } );
            return sendSuccessResponse( res, 202, "Category deleted", null );
      } catch ( error ) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === "P2025")
                  return sendErrorResponse(res,404,"Category not found", null)
            }
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

module.exports = {createSubcategory,getSubcategory,editSubCategory,deleteSubCategory}
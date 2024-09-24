const { Prisma, PrismaClient } = require( "@prisma/client" );
const { sendSuccessResponse, sendErrorResponse } = require( "../utils/responseHelper" );

const prisma = new PrismaClient();


const createCategory = async ( req, res ) =>
{
      try {
            const { name, slug, description } = req.body;
            if ( !name, !description ) return sendErrorResponse( res, 400, "All field is required", null );
            
            const category = await prisma.category.create( {
                  data: {
                        name, description, slug
                  }
            } );

            return sendSuccessResponse( res, 201, "Category was created successfully", { category } );
      } catch ( error ) {
            console.error(error);
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if ( error.code === "P2002" )
                        return sendErrorResponse(res,409,"Category Already exist")
            }
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const getCategories = async ( req, res ) =>
{
      try {
            const category = await prisma.category.findMany( {
                  include: {
                        subCategory:true
                  }
            });
            return sendSuccessResponse( res, 200, "Categories found", { category } );

      } catch ( error ) {
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const editCategories = async ( req, res ) =>
{
      const { id } = req.params;
      if ( !id ) return sendErrorResponse( res, 400, "Category Id is needed" );
      try {
            const { name, slug, description } = req.body;
            const product = await prisma.category.findUniqueOrThrow( { where: { id } } );

            product.name = name ? name : product.name;
            product.slug = slug ? slug : product.slug;
            product.description = description ? description : product.description;

            const editedCatagory = await prisma.category.update( {
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


const deleteCategory = async ( req, res ) =>
{
      const { id } = req.params;
      if ( !id ) return sendErrorResponse( res, 400, "Category Id is needed" );
      try {
            await prisma.category.delete( { where: { id } } );
            return sendSuccessResponse( res, 202, "Category deleted", null );
      } catch ( error ) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === "P2025")
                  return sendErrorResponse(res,404,"Category not found", null)
            }
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

module.exports = {createCategory,getCategories,editCategories,deleteCategory}
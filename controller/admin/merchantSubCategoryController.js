const { Prisma, PrismaClient } = require( "@prisma/client" );
const { sendSuccessResponse, sendErrorResponse } = require( "../../utils/responseHelper" );

const prisma = new PrismaClient();


const createSubcategory = async ( req, res ) =>
{
      try {
            const { name, slug, category_id } = req.body;
            if ( !name, !category_id ) return sendErrorResponse( res, 400, "All field is required", null );
            
            const category = await prisma.subCategory.create( {
                  data: {
                        name, category_id, slug
                  }
            } );

            return sendSuccessResponse( res, 201, "Category was created successfully", { category } );
      }  catch ( error ) {
            console.error(error);
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                  if ( error.code === "P2002" )
                        return sendErrorResponse(res,409,"Category Already exist")
            }
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const getSubcategory = async ( req, res ) =>
{
      try {
            const { category_id } = req.query
            if ( !category_id ) {
                  const category = await prisma.subCategory.findMany();
            return sendSuccessResponse( res, 200, "Categories found", { category } );
            }
            const category = await prisma.subCategory.findMany({where:{category_id}});
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
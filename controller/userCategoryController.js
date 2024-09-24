const { PrismaClient } = require( "@prisma/client" );
const { sendSuccessResponse, sendErrorResponse } = require( "../utils/responseHelper" );

const prisma = new PrismaClient();

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

module.exports = { getCategories };
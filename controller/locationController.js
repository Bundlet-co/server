const { PrismaClient, Prisma } = require( '@prisma/client' );
const { sendSuccessResponse, sendErrorResponse } = require( '../utils/responseHelper' );

const prisma = new PrismaClient();

const fetchLoactions = async ( req, res ) =>
{
      try {
            const locations = await prisma.dispatchLocation.findMany();
            sendSuccessResponse( res, 200, "Locations Found", { locations } );
      } catch (error) {
            return sendErrorResponse(res,500,"Internal server error",error)
      }
};

module.exports ={fetchLoactions}
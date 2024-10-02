const { PrismaClient, Prisma } = require( '@prisma/client' );
const { sendSuccessResponse, sendErrorResponse } = require( '../../utils/responseHelper' );

const prisma = new PrismaClient();

const createDispatchCenter = async ( req, res ) =>
{
      const { country, state, city, lga, address } = req.body;
      if ( !country || !state || !city || !lga || !address ) return sendErrorResponse( res, 400, "All field is required" );
      try {
            const dispatchCenter = await prisma.dispatchLocation.create( {
                  data: {
                        country, state, city, lga, address
                  }
            })
            return sendSuccessResponse(res,201,"Dispatch location was added successfully",{location:dispatchCenter})
      } catch ( error ) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if ( error.code === "P2002" )
                        return sendErrorResponse(res,409,"Dispatch center already exist")
            }
            return sendErrorResponse(res,500,"Internal server error",{error})
      }
};


const getDispatch = async ( req, res ) =>
{
      try {
            const dispatchCenter = await prisma.dispatchLocation.findMany();
            return sendSuccessResponse( res, 200, "Dispatch center was retrieved successfully", { location: dispatchCenter } );
      } catch (error) {
            return sendErrorResponse( res, 500, "Internal server error", { error } );
      }
};


const getDispatchByplace = async ( req, res ) =>
{
      const { country, state, city, lga } = req.query;
      if ( !country && !state && !city && !lga  ) return await getDispatch( req, res );
      try {
            let whereClause = {};
            if ( country ) {
                  whereClause = {...whereClause,
                        country
                  }
            }
            if ( state ) {
                  whereClause = {...whereClause,state}
            }
            if ( city ) {
                  whereClause = {...whereClause,city}
            }

            const dispatchCenter = await prisma.dispatchLocation.findMany( { where: whereClause } )
            
            return sendSuccessResponse( res, 200, "Dispatch center was retrieved successfully", { location: dispatchCenter } );
      } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === "P2025")
                  return sendErrorResponse(res,404,"Merchant does not exist")
            }
            return sendErrorResponse( res, 500, "Internal server error", { error } );
      }
};

const editDispatch = async ( req, res ) =>
{
      const { id } = req.params
      if (!id)  return sendErrorResponse( res, 400, "All field is required" );

      try {
            const { country, state, city, lga,address } = req.body;
            const dispatchCenter = await prisma.dispatchLocation.update( {
                  where: { id },
                  data:{ country, state, city, lga, address }
            } )

            return sendSuccessResponse( res, 200, "Address updated successfully", {location:dispatchCenter} );
      } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === "P2025")
                  return sendErrorResponse(res,404,"Merchant does not exist")
            }
            return sendErrorResponse( res, 500, "Internal server error", { error } );
      }
};



const deleteDispatch = async ( req, res ) =>
{
      const { id } = req.params
      if (!id)  return sendErrorResponse( res, 400, "All field is required" );

      try {
            const dispatchCenter = await prisma.dispatchLocation.delete( {
                  where: { id },
            } )

            return sendSuccessResponse( res, 200, "Address updated successfully", {location:dispatchCenter} );
      } catch ( error ) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === "P2025")
                  return sendErrorResponse(res,404,"Merchant does not exist")
            }
            return sendErrorResponse( res, 500, "Internal server error", { error } );
      }
};


module.exports = { createDispatchCenter, getDispatch, getDispatchByplace, editDispatch, deleteDispatch };
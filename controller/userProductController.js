const { Prisma, PrismaClient } = require( "@prisma/client" );

const prisma = new PrismaClient();

const getProduct = async ( req, res ) =>
{
      try {
            const skip = +req.query.skip || 0;
            const PAGE_NUMBER = 10;
            const productCount = await prisma.product.count();

            if ( productCount === 0 ) return res.status( 200 ).json( { message: "No product was found for user" } );

            const products = await prisma.product.findMany( {
                  include: {
                        suplementryProducts: true
                  },
                  skip,
                  take: PAGE_NUMBER,
            } );

            return sendSuccessResponse( res, 202, "Prodct fetched", { products, count: productCount } );
      } catch ( error ) {
            console.error(error);
            return sendErrorResponse(res,500,"Internal server error",error)
      }
};

const getSingleProduct = async ( req, res ) =>
{
      try {
            const { id } = req.params;

            if ( !id ) return sendErrorResponse(res,400,"Product Id is required");

            const product = await prisma.product.findUniqueOrThrow( { where: { id }, include:{suplementryProducts:true} } );

            return sendSuccessResponse(res,202,"Product Found",{product})

      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                  if (e.code === "P2025")
                  return sendErrorResponse(res,404,"Product not found", null)
            }
            console.log(e)
            return sendErrorResponse(res,500,"Internal server error",e)
      }
};


module.exports = { getProduct, getSingleProduct };
const { PrismaClient, Prisma } = require( '@prisma/client' );
const { sendErrorResponse, sendSuccessResponse } = require( '../utils/responseHelper' );


const prisma = new PrismaClient();

const addToWishlist = async ( req, res ) =>
{
      const { product_id } = req.body;
      if (!product_id) return sendErrorResponse(res,400,"Product id is required")
      try {
            const userId = res.user.id
            if ( !userId ) return sendErrorResponse( res, 403, "You must be logged in" )
            const wishlist = await prisma.wishlist.create( {
                  data: {
                        product_id,
                        userId
                  }
            } );
            return sendSuccessResponse(res,201,"Added to favorite",{wishlist})
      } catch (error) {
            sendErrorResponse(res,500,"Internal Server error",{error})
      }
};

const addAllToWishlist = async (req,res) =>
{
      const { wishlist } = req.body;
      if ( !wishlist ) return sendErrorResponse( res, 400, "All field is required" );
      try {
            const newWishlist = wishlist.map( item =>
            {
                  return { product_id:item.product_id, userId: res.user.id };
            } )
            await prisma.wishlist.createMany( { data: newWishlist } )
            return sendSuccessResponse(res,201,"Added to favorites")
      } catch ( error ) {
            console.error(error);
            sendErrorResponse(res,500,"Internal Server error",{error})
      }
}

const removeFromWishlist = async ( req, res ) =>
{
      const { id } = req.params;
      const userId = res.user.id
      if ( !id || !userId ) return sendErrorResponse( res, 400, "User must be logged in and product id is required" ); 
      try {
            await prisma.wishlist.delete( {
                  where: {
                        product_id:id,
                        userId
                  }
            } )
            return sendSuccessResponse(res,201,"Removed from favorite")
      } catch ( error) {
            sendErrorResponse(res,500,"Internal Server error",{error})
      }
};

const removeFromAllWishlist = async ( req, res ) =>
{
      const userId = res.user.id
      if ( userId ) return sendErrorResponse( res, 400, "User must be logged in and product id is required" ); 
      try {
            await prisma.wishlist.deleteMany( {
                  where: {
                        userId
                  }
            } )
            return sendSuccessResponse(res,201,"Removed from favorite")
      } catch ( error) {
            sendErrorResponse(res,500,"Internal Server error",{error})
      }
};

const getWishlist = async ( req, res ) =>
{
      const userId = res.user.id
      if ( !userId ) return sendErrorResponse( res, 403, "You must be logged in" )
      try {

            const wishlist = await prisma.wishlist.findMany( {
                  where: {
                        userId
                  },
            } );
            return sendSuccessResponse( res, 202, "Wishlist fetched", { products:wishlist } );
      } catch (error) {
            sendErrorResponse(res,500,"Internal Server error",{error})
      }
};

module.exports = {addToWishlist,removeFromWishlist,getWishlist,addAllToWishlist,removeFromAllWishlist}
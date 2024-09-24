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
            await prisma.wishlist.create( {
                  data: {
                        product_id,
                        userId
                  }
            } );
            return sendSuccessResponse(res,201,"Added to favorite")
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
                  return { ...item, userId: res.user.id };
            } )
            const userList = await prisma.wishlist.createManyAndReturn( { data: newWishlist } )
            return sendSuccessResponse(res,201,"Added to favorites",{products:userList})
      } catch (error) {
            sendErrorResponse(res,500,"Internal Server error",{error})
      }
}

const removeFromWishlist = async ( req, res ) =>
{
      const { id } = req.params;
      const userId = res.user.id
      if ( !id || userId ) return sendErrorResponse( res, 400, "User must be logged in and product id is required" ); 
      try {
            await prisma.wishlist.delete( {
                  where: {
                        id,
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
            const skip = +req.query.skip || 0;
            const PAGE_NUMBER = 10;

            const wishlistCount = await prisma.wishlist.count( { where: { userId } } );

            if ( wishlistCount === 0 ) return sendSuccessResponse( res, 202, "Wishlist empty", { products: [], count: 0 } );

            const wishlist = await prisma.wishlist.findMany( {
                  where: {
                        userId
                  },
                  take: PAGE_NUMBER,
                  skip
            } );
            return sendSuccessResponse( res, 202, "Wishlist fetched", { products:wishlist, count: wishlistCount } );
      } catch (error) {
            sendErrorResponse(res,500,"Internal Server error",{error})
      }
};

module.exports = {addToWishlist,removeFromWishlist,getWishlist,addAllToWishlist}
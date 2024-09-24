const { Prisma, PrismaClient } = require( "@prisma/client" );
const { sendErrorResponse, sendSuccessResponse } = require( "../utils/responseHelper" );

const prisma = new PrismaClient();

const addTocart = async ( req, res ) =>
{
      const { productId, quantity } = req.body;
      if ( !productId || !quantity ) return sendErrorResponse( res, 400, "All field is required" );
      try {
            const cart = await prisma.cartItem.create( {
                  data: {
                        userId: res.user.id,
                        productId,
                        quantity:parseInt(quantity)
                  }
            })

            return sendSuccessResponse(res,201,"Item added to cart", {cart})
      } catch ( error ) {
            console.error(error);
            return sendErrorResponse(res,500,"Internal server error",error)
      }
};

const addAllToCart = async ( req, res ) =>
{
      const { cart } = req.body;
      if ( cart ) return sendErrorResponse( res, 400, "All field is required" );
      try {
            const newItem = cart.map( item =>
            {
                  return {...item, userId: res.user.id}
            })
            const cartUpdate = await prisma.cartItem.createMany( {
                  data: newItem
            } )
            return sendSuccessResponse( res, 201, "Item added to cart", { cart: cartUpdate } );
      } catch ( error ) {
            console.error(error);
            return sendErrorResponse(res,500,"Internal server error",error)
      }
}

const getCart = async ( req, res ) =>
{
      try {
            const skip = +req.query.skip || 0;
            const PAGE_NUMBER = 10;
            const count = await prisma.cartItem.count( {
                  where: { userId: res.user.id }
            } );
            const cart = await prisma.cartItem.findMany( {
                  where: { userId: res.user.id },
                  include: {
                        product: true
                  },
                  skip,
                  take: PAGE_NUMBER
            } );
            
            if ( cart.length === 0 ) return sendSuccessResponse( res, 200, "Cart is empty", { cart,count } );

            return sendSuccessResponse( res, 200, "Cart retrived successfully", { cart } );
      } catch ( error ) {
            console.error( error );
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const editCartItem = async ( req, res ) =>
{
      const { id, quantity } = req.body;
      if ( !id || !quantity ) return sendErrorResponse( res, 400, "All Fiels are required" );
      try {
            const cartItem = await prisma.cartItem.update( {
                  where: { id, userId:res.user.id }, data: {
                  quantity:parseInt(quantity)
                  }
            } )
            return sendSuccessResponse( res, 200, "Item updated successfully", { cartItem } );
      } catch (error) {
            console.error( error );
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === "P2025")
                  return sendErrorResponse(res,404,"Cart Item not found", null)
            }
            
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const deleteCartItem = async ( req, res ) =>
{
      const { id } = req.params;
      if ( !id ) return sendErrorResponse( res, 400, "All Fiels are required" );
      try {
            await prisma.cartItem.delete( {
                  where: { id,userId:res.user.id },
            } )
            return sendSuccessResponse( res, 200, "Item removed successfully");
      } catch ( error ) {
            console.error( error );
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === "P2025")
                  return sendErrorResponse(res,404,"Cart Item not found", null)
            }
            
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const clearAll = async ( req, res ) =>
{
      try {
            await prisma.cartItem.deleteMany( {
                  where: { userId:res.user.id },
            } )
            return sendSuccessResponse( res, 200, "Cart cleared successfully");
      } catch ( error ) {
            console.error( error );
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === "P2025")
                  return sendErrorResponse(res,404,"Cart Item not found", null)
            }
            
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};


module.exports = {getCart,addTocart,editCartItem,deleteCartItem,clearAll,addAllToCart}

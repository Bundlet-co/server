const { Prisma, PrismaClient } = require( "@prisma/client" );
const { sendErrorResponse, sendSuccessResponse } = require( "../utils/responseHelper" );

const prisma = new PrismaClient();

const addTocart = async ( req, res ) =>
{
      const { productId, quantity, variation,supplementaryProducts, price,total } = req.body;
      if ( !productId || !quantity || !price ) return sendErrorResponse( res, 400, "All field is required" );
      try {
            const cart = await prisma.cartItem.create( {
                  data: {
                        userId: res.user.id,
                        productId,
                        quantity:parseInt(quantity),
                        variation:  variation || undefined,
                        price: parseFloat( price ),
                        total: parseFloat(total),
                        supplementaryProducts: {
                              create: supplementaryProducts.map( ( productId ) => ( {
                                    productId
                              }))
                        }
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
      const { carts } = req.body;
      if ( carts ) return sendErrorResponse( res, 400, "All field is required" );
      try {
            const cartItems = carts.map((item) => {
                  const { supplementaryProducts, ...mainCartData } = item;
                  return { ...mainCartData, userId: res.user.id };
            });

            // Add cart items to the database
            await prisma.cartItem.createMany({
                  data: cartItems,
            });

            // Process supplementary products if provided
            const supplementaryData = carts.flatMap((item) =>
                  (item.supplementaryProducts || []).map((productId) => ({
                  cartItemId: item.id,
                  productId,
                  }))
            );

            if (supplementaryData.length > 0) {
                  await prisma.cartItemSupplement.createMany({
                  data: supplementaryData,
                  });
            }

            // Fetch the updated cart items with their supplementary products
            const addedCartItemsWithSupplements = await prisma.cartItem.findMany({
                  where: { userId: res.user.id },
                  include: {
                  product: true,
                  supplementaryProducts: {
                  include: { product: true },
                  },
                  },
            });
            return sendSuccessResponse( res, 201, "Item added to cart", { carts: addedCartItemsWithSupplements } );
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
                        product: true,
                        supplementaryProducts: {
                              include: {
                                    product:true
                              }
                        }
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
      const { id, quantity,variation,supplementaryProducts,total } = req.body;
      if ( !id || !quantity ) return sendErrorResponse( res, 400, "All Fiels are required" );
      try {
            await prisma.cartItem.update( {
                  where: { id, userId:res.user.id }, data: {
                        quantity: parseInt( quantity ),
                        variation: variation || undefined,
                        total:parseFloat(total),
                  }
            } )

             if (supplementaryProducts && supplementaryProducts.length > 0) {
                  // Clear existing supplementary products for the cart item
                  await prisma.cartItemSupplement.deleteMany({
                  where: { cartItemId: id },
                  });

                  // Add new supplementary products
                  await prisma.cartItemSupplement.createMany({
                  data: supplementaryProducts.map((productId) => ({
                  cartItemId: id,
                  productId,
                  })),
                  });
            }
            const cartItemWithSupplements = await prisma.cartItem.findUnique({
                  where: { id },
                  include: {
                  product: true,
                  supplementaryProducts: {
                  include: { product: true }, // Fetches details for each supplementary product
                  },
                  },
            });
            return sendSuccessResponse( res, 200, "Item updated successfully", { cart:cartItemWithSupplements } );
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

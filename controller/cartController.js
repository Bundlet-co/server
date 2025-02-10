const { Prisma, PrismaClient } = require( "@prisma/client" );
const { sendErrorResponse, sendSuccessResponse } = require( "../utils/responseHelper" );
const {v4:uuid} = require("uuid")

const prisma = new PrismaClient();

const addTocart = async ( req, res ) =>
{
      const { productId, quantity, variation, supplementaryProducts, price, total } = req.body;
      console.log(req.body)
      if ( !productId || !quantity || !price ) return sendErrorResponse( res, 400, "All field is required" );
      try {
            const existcart = await prisma.cartItem.findMany( { where: { userId: res.user.id } } );
            const isExist = existcart.find( item => (item.productId === productId && item.variation && item.variation?.variant === variation?.variant) ||(item.productId === productId && !item.variation) )
            if ( isExist ) {
                  const cart = await prisma.cartItem.update( {
                        where: {
                        id:isExist.id
                        },
                        data: {
                              quantity: isExist.quantity + 1,
                              total: isExist.price * ( isExist.quantity + 1 )
                        }
                  } )
                  return sendSuccessResponse(res,201,"Item added to cart", {cart})
            }
            const cart = await prisma.cartItem.create( {
                  data: {
                        userId: res.user.id,
                        productId,
                        quantity:parseInt(quantity),
                        variation:  variation || undefined,
                        price: parseFloat( price ),
                        total: parseFloat(total),
                        
                  }
            })

            return sendSuccessResponse(res,201,"Item added to cart", {cart})
      } catch ( error ) {
            console.error(error);
            return sendErrorResponse(res,500,"Internal server error",{error})
      }
};

const addAllToCart = async (req, res) => {
  const { carts } = req.body;
  if (!carts) return sendErrorResponse(res, 400, "All fields are required");

  try {
    const newCartItems = await Promise.all(
      carts.map(async (item) => {
        const { supplementaryProducts, id, name, quantity, ...mainCartData } = item;

        // Check if this cart item already exists
        const existingCartItem = await prisma.cartItem.findFirst({
          where: {
            userId: res.user.id,
                    productId:item.productId
          },
        });

        if (existingCartItem && existingCartItem.variation.variant === item.variation.variant) {
          // If item exists, update quantity and total
          return await prisma.cartItem.update({
            where: { id: existingCartItem.id },
            data: {
              quantity: { increment: quantity },
              total: existingCartItem.total + (mainCartData.price * quantity),
            },
          });
        } else {
          // If item does not exist, create a new cart item
          return await prisma.cartItem.create({
            data: {
              productId:item.productId,
              userId: res.user.id,
                      quantity,
                      variation: item.variation,
                      price: item.price,
              total: mainCartData.price * quantity,
            },
          });
        }
      })
    );

    // Extract IDs of newly created/updated cart items
    const cartItemIds = newCartItems.map((cartItem) => cartItem.id);

    // Add supplementary products for each cart item if applicable
    const supplementaryData = carts.flatMap((cartItem, index) =>
      (cartItem.supplementaryProducts || []).map((supplementary) => ({
        cartItemId: cartItemIds[index],
        productId: supplementary.id,
        quantity: supplementary.quantity,
        price: supplementary.price,
      }))
    );

    if (supplementaryData.length > 0) {
      await prisma.cartItemSupplement.createMany({
        data: supplementaryData,
      });
    }

    // Fetch updated cart items with supplementary products
    const addedCartItemsWithSupplements = await prisma.cartItem.findMany({
      where: { userId: res.user.id },
      include: {
        product: true,
        supplementaryProducts: {
          include: { product: true },
        },
      },
    });

    return sendSuccessResponse(res, 201, "Items added to cart", { carts: addedCartItemsWithSupplements });
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res, 500, "Internal server error", error);
  }
};

const getCart = async ( req, res ) =>
{
      try {
            const carts = await prisma.cartItem.findMany( {
                  where: { userId: res.user.id },
                  include: {
                        product: true,
                        supplementaryProducts: {
                              include: {
                                    product:true
                              }
                        }
                  },
            } );
            
            if ( carts.length === 0 ) return sendSuccessResponse( res, 200, "Cart is empty", { carts } );

            return sendSuccessResponse( res, 200, "Cart retrived successfully", { carts } );
      } catch ( error ) {
            console.error( error );
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const editCartItem = async ( req, res ) =>
{
      const { id, quantity,supplementaryProducts,total } = req.body;
      if ( !id || !quantity ) return sendErrorResponse( res, 400, "All Fiels are required" );
      try {
            await prisma.cartItem.update( {
                  where: { id, userId:res.user.id }, data: {
                        quantity: parseInt( quantity ),
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

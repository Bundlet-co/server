const { Prisma, PrismaClient } = require( "@prisma/client" );
const { sendSuccessResponse, sendErrorResponse } = require( "../utils/responseHelper" );
const { updateOrderStatus } = require( "../utils/orderHelper" );
const { sendMail } = require( "../utils/sendMail" );

const prisma = new PrismaClient();

const createOrder = async ( req, res ) =>
{
      try {
            const { userId, netAmount, address, orderProduct } = req.body;
            if ( !userId || !netAmount || !address || !orderProduct ) return sendErrorResponse( res, 400, "All field is required" );

            const user = await prisma.user.findUniqueOrThrow( { where: { id: res.user.id } } );
            
            if ( user.balance < parseFloat( netAmount ) ) return sendErrorResponse( res, 400, "Insufficient Balance" );
            
            const order = await prisma.order.create( {
                  data: {
                        userId,
                        netAmount: parseFloat( netAmount ),
                        address,
                        products: {
                              create:orderProduct.map((product)=>({
                              productId: product.productId,
                              price: product.price,
                              quantity: product.quantity,
                              variation: product.variation ? product.variation : undefined,
                              supplementryProducts: product.supplementryProducts ? JSON.parse(product.supplementryProducts) : null
                        }))
                        }
                  }, include: {
                        products: {
                              include: {
                                    product: {
                                          include: {
                                                merchant:true
                                          }
                                    }
                              }
                        }
                  }
            } );

            await Promise.all(order.products.map( async ( item ) =>
            {
                  const product = await prisma.product.findUniqueOrThrow( { where: { id: item.productId } } )
                  product.quantity -= item.quantity
                  if ( product.quantity < 1 ) {
                        product.inStock = false
                  }
                  await prisma.product.update( {
                        where: {
                              id:item.productId
                        },
                        data: product
                  })
            }))
            const merchantProduct = {};

            order.products.forEach( item =>
            {
                  const merchantId = item.product.merchant.id;
                  if ( !merchantProduct[ merchantId ] ) {
                        merchantProduct[ merchantId ] = {
                              merchant: item.product.merchant,
                              products:[]
                        }
                  };
                  merchantProduct[ merchantId ].products.push( item );
            } )
            console.log(merchantProduct);
            
            for ( const merchantId in merchantProduct ) {
                  const { merchant, products } = merchantProduct[ merchantId ];
                  const orderDate = new Date( order.createdAt ).toLocaleDateString();
                  const orderItems = products.map(item => `
                        <li>${item.product.name} - ${item.price} (Quantity: ${item.quantity})</li>
                  `).join( '' );
                  const html = `
                        <!DOCTYPE html>
                        <html lang="en">
                              <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <title>New Order Notification</title>
                                    <style>
                                          body {
                                                font-family: Arial, sans-serif;
                                                background-color: #f4f4f4;
                                                color: #333;
                                                line-height: 1.6;
                                                margin: 0;
                                                padding: 0;
                                          }
                                          .container {
                                                padding: 20px;
                                                max-width: 600px;
                                                margin: 0 auto;
                                                border-radius: 5px;
                                                background-color: #338EF7;
                                                min-height: 50dvh;
                                          }
                                          .header {
                                                text-align: center;
                                                color: #fefefe;
                                          }
                                          .content {
                                                padding: 20px 0;
                                          }
                                          .order-details {
                                                margin-bottom: 20px;
                                          }
                                          .order-details h2 {
                                                font-size: 20px;
                                                margin-bottom: 10px;
                                          }
                                          .order-details p {
                                                margin: 5px 0;
                                          }
                                          .footer {
                                                text-align: center;
                                                color: #777;
                                                font-size: 12px;
                                                padding-top: 20px;
                                                border-top: 1px solid #ddd;
                                          }
                                    </style>
                              </head>
                              <body>
                                    <div class="container">
                                          <div class="header">
                                                <h1>New Order Received!</h1>
                                          </div>
                                          <div class="content">
                                                <div class="order-details">
                                                      <h2>Order #${order.id}</h2>
                                                      <p><strong>Customer ID:</strong> ${userId}</p>
                                                      <p><strong>Order Date:</strong> ${orderDate}</p>
                                                      <p><strong>Shipping Address:</strong> ${address}</p>
                                                </div>
                                                <div class="order-items">
                                                      <h2>Items Ordered:</h2>
                                                      <ul>
                                                            ${orderItems}
                                                      </ul>
                                                </div>
                                          </div>
                                          <div class="footer">
                                                <p>&copy; 2024 Your Company Name. All rights reserved.</p>
                                                <p>This is an automated message. Please do not reply to this email.</p>
                                          </div>
                                    </div>
                              </body>
                        </html>
                  `

                  const from = `Bundlet Support<${ process.env.EMAIL }>`;
                  const subject = "New Order Received";
                  
                  await sendMail(from,merchant.email,subject,html)
            }

            const updated = await prisma.user.update( {
                  where: {
                        id: userId,
                  },
                  data: {
                        balance: user.balance - parseFloat( netAmount )
                  }
            } );
            delete updated.password;
            delete updated.verification_code;
            delete updated.refresh_token
            delete updated.resetPasswordToken



            return sendSuccessResponse( res, 201, "Order has been created", { order, user:updated } );
      } catch ( error ) {
            console.error( error );
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const getOrder = async ( req, res ) =>
{
      try {
            const order = await prisma.order.findMany( {
                  where: {
                        userId:res.user.id
                  },
                  include: {
                        products: {
                              include: {
                                    product:true
                              }
                        },
                        events:true
                  }
            } );

            return sendSuccessResponse( res, 200, "Order found", { orders:order } );
      } catch ( error ) {
            console.error( error );
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const getSingleOrder = async ( req, res ) =>
{
      const { id } = req.params;
      if ( !id ) return sendErrorResponse( res, 400, "Order Id is required" );
      try {
            const order = await prisma.order.findUniqueOrThrow( {
                  where: {
                        id
                  },
                  include: {
                        products: {
                              include: {
                                    product:true
                              }
                        }
                  }
            } )

            return sendSuccessResponse( res, 200, "Orders fetched", { orders: order })
      } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === "P2025")
                  return sendErrorResponse(res,404,"Product not found", null)
            }
            return sendErrorResponse(res,500,"Internal server error",error)
      }
}

const cancelOrder = async ( req, res ) =>
{
      const { id } = req.params;
      if ( !id ) return sendErrorResponse( res, 400, "Order Id is required" );
      try {
            const order = await prisma.order.update( {
                  where: {
                        id,
                        userId:res.user.id
                  },
                  data: {
                        status:"CANCELLED"
                  }
            } )
            await updateOrderStatus(order.id,"CANCELLED")
            return sendSuccessResponse( res, 200, "Order has been cancelled", { order } );
      } catch ( error ) {
            console.error( error );
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const deliveredOrder = async ( req, res ) =>
{
      const { id } = req.params;
      if ( !id ) return sendErrorResponse( res, 400, "Order Id is required" );
      try {
            const order = await prisma.order.update( {
                  where: {
                        id,
                        userId:res.user.id
                  },
                  data: {
                        status:"DELIVERED"
                  }
            } )
            return sendSuccessResponse( res, 200, "Order has been cancelled", { order } );
      } catch ( error ) {
            console.error( error );
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};


module.exports = {createOrder,getOrder,cancelOrder,getSingleOrder,deliveredOrder}
const { PrismaClient } = require( "@prisma/client" );
const { sendErrorResponse, sendSuccessResponse } = require( "../../utils/responseHelper" );
const { updateOrderStatus } = require( "../../utils/orderHelper" );

const prisma = new PrismaClient();

const getOrders = async ( req, res ) =>
{
      try {
            const { id } = res.merchant;
            if ( !id ) return res.status( 400 ).json( { message: "Merchant Id is required" } );

            const orders = await prisma.order.findMany( {
                  where: {
                        products: {
                              some: {
                                    product: {
                                          merchant_id: id
                                    }
                              }
                        }
                  },
                  include: {
                        products: {
                              include: {
                                    product: true
                              }
                        },
                        user: {
                              select: {
                                    name: true,
                                    email: true,
                                    phone_number: true,
                                    address: true
                              }
                        }
                  },
            } );


            return sendSuccessResponse( res, 202, "Orders Found", { orders } );
      } catch ( error ) {
            console.error( error );
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const getRecentOrder = async ( req, res ) =>
{
      try {
            const { id } = res.merchant;
            if ( !id ) return res.status( 400 ).json( { message: "Merchant Id is required" } );
            const count = await prisma.order.count( {
                  where: {
                        products: {
                              some: {
                                    product: {
                                          merchant_id: id
                                    }
                              }
                        }
                  }
            } ); // count of orders
            const orders = await prisma.order.findMany( {
                  where: {
                        products: {
                              some: {
                                    product: {
                                          merchant_id: id
                                    }
                              }
                        }
                  },
                  include: {
                        products: {
                              where: {
                                    product: {
                                          merchant_id: id
                                    }
                              }
                        },
                        user: {
                              select: {
                                    name: true,
                                    email: true,
                                    phone_number: true,
                                    address: true
                              }
                        }
                  },
                  orderBy: {
                        createdAt: "desc"
                  },
            } );

            return sendSuccessResponse( res, 202, "Recent Orders Found", { orders, count } );
      } catch ( error ) {
            console.error( error );
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const getRecentOrderReverse = async ( req, res ) =>
{
      try {
            const { id } = res.merchant;
            if ( !id ) return res.status( 400 ).json( { message: "Merchant Id is required" } );
            const count = await prisma.order.count( {
                  where: {
                        products: {
                              some: {
                                    product: {
                                          merchant_id: id
                                    }
                              }
                        }
                  }
            } ); // count of orders
            const orders = await prisma.order.findMany( {
                  where: {
                        products: {
                              some: {
                                    product: {
                                          merchant_id: id
                                    }
                              }
                        }
                  },
                  include: {
                        products: {
                              include: {
                                    product: true
                              }
                        },
                        user: {
                              select: {
                                    name: true,
                                    email: true,
                                    phone_number: true,
                                    address: true
                              }
                        }
                  },
                  orderBy: {
                        createdAt: "asc"
                  },
            } );

            return sendSuccessResponse( res, 202, "Recent Orders Found", { orders, count } );
      } catch ( error ) {
            console.error( error );
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const getOrderByStatus = async ( req, res ) =>
{
      try {
            const { id } = res.merchant;
            const status = req.query.status

            if ( !status ) return res.status( 400 ).json( { message: "Status filter required" } );


            const count = await prisma.order.count( {
                  where: {
                        products: {
                              some: {
                                    status:status.toUpperCase(),
                                    product: {
                                          merchant_id: id,
                                    },
                              },
                        },
                  }
            } );

            const orders = await prisma.order.findMany( {
                  where: {
                        status:status.toUpperCase(),
                        products: {
                              some: {
                                    status:status.toUpperCase(),
                                    product: {
                                          merchant_id: id,
                                    },
                              }
                        }
                  },
                  include: {
                        products: {
                              where: {
                                    product: {
                                          merchant_id: id
                                    }
                              }
                        },
                        user: {
                              select: {
                                    name: true,
                                    email: true,
                                    phone_number: true,
                                    address: true
                              }
                        }
                  },
            } );

            return sendSuccessResponse( res, 202, "Orders Found", { orders, count } );
      } catch (error) {
            console.error( error );
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
}
const getSingleOrder = async ( req, res ) =>
{
      try {
            const { id } = req.params
            if (!id ) {
                  return res.status(400).json({ message: "Id is required" });
            };
            const order = await prisma.order.findUniqueOrThrow( {
                  where: {
                        id
                  },
                  include: {
                        products: {
                              include: {
                                    product: true
                              }
                        },
                        user: {
                              select: {
                                    name: true,
                                    email: true,
                                    phone_number: true,
                                    address: true
                              }
                        }
                  },
            } )

            
            return sendSuccessResponse(res,202,"Order Found",{order})
      } catch (error) {
            console.error( error );
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
}

const updateStatus = async ( req, res ) =>
{
      const { id,status } = req.query
      
      try {
            if (!id || !status) {
                  return res.status(400).json({ message: "Both 'id' and 'status' are required" });
            };

            await prisma.order.update( {
                  where: {
                        id
                  }, data: {
                        status:status.toUpperCase(),
                  }
            } ); 

            const order = await prisma.order.findUniqueOrThrow( {
                  where: {
                        id
                  },
                  include: {
                        products: {
                              where: {
                                    product: {
                                          merchant_id: id
                                    }
                              }
                        },
                        user: {
                              select: {
                                    name: true,
                                    email: true,
                                    phone_number: true,
                                    address: true
                              }
                        }
                  },
            })

            await updateOrderStatus( id, status.toUpperCase() );

            return sendSuccessResponse(res,202,"Order Status Updated", {order})
      } catch (error) {
            console.error( error );
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
}



module.exports = {getOrders,getRecentOrder,getOrderByStatus, getRecentOrderReverse,updateStatus,getSingleOrder}
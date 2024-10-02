const { PrismaClient } = require( "@prisma/client" );
const { sendErrorResponse, sendSuccessResponse } = require( "../../utils/responseHelper" );
const { updateOrderStatus } = require( "../../utils/orderHelper" );

const prisma = new PrismaClient();

const getOrders = async ( req, res ) =>
{
      try {
            const { id } = res.merchant;
            const skip = +req.query.skip || 0;
            const PAGE_NUMBER = 10;
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
                  },
                  include: {
                        products: {
                              include: {
                                    product: true
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
                        }
                  },
                  skip,
                  take:PAGE_NUMBER
            } );

            return sendSuccessResponse( res, 202, "Orders Found", { orders, count } );
      } catch ( error ) {
            console.error( error );
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const getRecentOrder = async ( req, res ) =>
{
      try {
            const { id } = res.merchant;
            const skip = +req.query.skip || 0;
            const PAGE_NUMBER = 10;
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
                  },
                  include: {
                        products: {
                              include: {
                                    product: true
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
                        }
                  },
                  orderBy: {
                        createdAt: "desc"
                  },
                  skip,
                  take:PAGE_NUMBER
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
            const skip = +req.query.skip || 0;
            const PAGE_NUMBER = 10;
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
                  },
                  include: {
                        products: {
                              include: {
                                    product: true
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
                        }
                  },
                  orderBy: {
                        createdAt: "asc"
                  },
                  skip,
                  take:PAGE_NUMBER
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
            const skip = +req.query.skip || 0;
            const status = req.query.status
            const PAGE_NUMBER = 10;

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
                  },
                  include: {
                        products: {
                              include: {
                                    product: true
                              }
                        }
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
                              include: {
                                    product: true
                              }
                        }
                  },
                  skip,
                  take:PAGE_NUMBER
            } );

            return sendSuccessResponse( res, 202, "Orders Found", { orders, count } );
      } catch (error) {
            console.error( error );
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
}

const updateStatus = async ( req, res ) =>
{
      const { id,status } = req.query
      
      try {
            const orders = await prisma.orderProduct.update( {
                  where: {
                        id
                  }, data: {
                        status:status.toUpperCase()
                  }
            } );

            await updateOrderStatus(id,status.toUpperCase())

            return sendSuccessResponse(res,202,"Order Accepted", {orders})
      } catch (error) {
            console.error( error );
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
}



module.exports = {getOrders,getRecentOrder,getOrderByStatus, getRecentOrderReverse,updateStatus}
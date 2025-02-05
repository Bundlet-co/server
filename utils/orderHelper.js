const { PrismaClient } = require( "@prisma/client" );

const prisma = new PrismaClient();


const updateOrderStatus = async ( orderId,status ) =>
{
      try {
            await prisma.orderProduct.updateMany( {
                  where: { orderId },
                  data: { status: status.toUpperCase() }
            })
            return console.log("updated");
      } catch (error) {
            console.error( error );
            return error
      }
};


const updateOrderProductStatus = async ( orderProductId, status ) =>
{
      try {
            const orderProduct = await prisma.orderProduct.update( {
                  where: { id: orderProductId },
                  data: { status: status.toUpperCase() },
                  include:{order:true}
            } )
            await updateOrderStatus(orderProduct.orderId,status)
      } catch (error) {
            console.error( error );
            return error
      }
};


module.exports = {updateOrderProductStatus,updateOrderStatus}
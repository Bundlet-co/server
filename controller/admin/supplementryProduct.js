const { PrismaClient, Prisma } = require( '@prisma/client' );
const { sendErrorResponse, sendSuccessResponse } = require( '../../utils/responseHelper' );
const fs = require("fs").promises

const prisma = new PrismaClient();

const getSingleSuplementryProduct = async (req,res) =>
{
      try {
            const { id } = req.params;
            const suplementry = await prisma.suplementryProduct.findUniqueOrThrow( { where: { id } } )
            return sendSuccessResponse( res, 202, "product found", {suplementry} );
      } catch ( error ) {
            console.error( error );
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === "P2025")
                  return sendErrorResponse(res,404,"Product not found", null)
            }
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const getSuplementryProduct = async ( req, res ) =>
{
      try {
            const { product_id } = req.query
            const skip = +req.query.skip || 0;
            const PAGE_NUMBER = 10;

            if ( !product_id ) {
                  const count = await prisma.suplementryProduct.count()
                  const suplementry = await prisma.suplementryProduct.findMany( {
                        skip,
                        take: PAGE_NUMBER
                  } );
                  console.log(suplementry);
                  return sendSuccessResponse(res,200,"suplementry product found", {suplementry,count})
            }

            const count = await prisma.suplementryProduct.count( {
                  where: {
                        product_id,
                  },
            })
            const suplementry = await prisma.suplementryProduct.findMany( {
                  where: {
                        product_id,
                  },
                  skip,
                  take: PAGE_NUMBER
            } );

            return sendSuccessResponse(res,200,"suplementry product found", {suplementry,count})
      } catch (error) {
            console.error( error );
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === "P2025")
                  return sendErrorResponse(res,404,"Product not found", null)
            }
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
};

const deleteSuplementryProduct = async ( req, res ) =>
{
      const { id } = req.params
      if ( !id ) return sendErrorResponse( res, 400, "Product Id is required" );
      try {
            const product = await prisma.suplementryProduct.delete( {
                  where: { id }
            } );

            await fs.unlink( product.dp );
            return sendSuccessResponse( res, 202, "Product deleted sucessfully" );
      } catch (error) {
            console.error( error );
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === "P2025")
                  return sendErrorResponse(res,404,"Product not found", null)
            }
            if (error.code === "ENOENT"){
                  return sendSuccessResponse(res,202,"Product deleted",null)
            }
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
}

const deleteAllSuplementryProduct = async ( req, res ) =>
{
      const { product_id } = req.query
      if ( !id ) return sendErrorResponse( res, 400, "Product Id is required" );
      try {
            const product = await prisma.suplementryProduct.findMany( { where: { product_id } } );

            await prisma.suplementryProduct.deleteMany({where:{product_id}})

            product.map( async ( item ) =>
            {
                  return await fs.unlink( item.dp );
            } );

            return sendSuccessResponse( res, 202, "Supplementry product deleted successfully",null);
            
      } catch (error) {
            console.error( error );
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === "P2025")
                  return sendErrorResponse(res,404,"Product not found", null)
            }
            if (error.code === "ENOENT"){
                  return sendSuccessResponse(res,202,"Product deleted",null)
            }
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
}


const createSuplementryProduct = async ( req, res ) =>
{
      const { name, category, slug, description, product_id, price } = req.body;
      const { dp } = req.file
      if ( !name || !category || !slug || !description || !product_id || !price ) return sendErrorResponse( res, 400, "All field is required", null );
      try {
            
            const product = await prisma.suplementryProduct.create( {
                  data: {
                        name, category, slug, description, product_id, price: parseFloat( price ), dp: dp.path
                  }
            } );

            return sendSuccessResponse( res, 201, "Product created", { product } );
            
      } catch (error) {
            console.error(error);
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
}

const editSuplementryProdct = async ( req, res ) =>
{
      const { id } = req.params
      if ( !id ) return sendErrorResponse( res, 400, "Product Id is required" );
      try {
            const { name, category, slug, description, price,product_id } = req.body;
            const product = await prisma.suplementryProduct.findFirstOrThrow( { where: { id, product_id } } );
            product.name = name ? name : product.name
            product.category = category ? category : product.category;
            product.slug = slug ? slug : product.slug
            product.description = description ? description : product.description
            product.price = price ? parseFloat( price ) : product.price
            
            const editedProduct = await prisma.suplementryProduct.update( {
                  where: { id, product_id },
                  data: product
            } );

            return sendSuccessResponse( res, 200, "Product edited", { product: editedProduct } );
      } catch (error) {
            console.error( error );
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === "P2025")
                  return sendErrorResponse(res,404,"Product not found", null)
            }
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
}



const updateImage = async ( req, res ) =>
{
      const { id, product_id } = req.query;
      const { suplementryImage } = req.file;
      if ( !id || !suplementryImage ) return sendErrorResponse( res, 400, "Product Id or suplementry image is required" );
      try {
            let previous;
            const product = await prisma.suplementryProduct.findFirstOrThrow( { where: { id, product_id } } );

            previous = product;

            product.dp = suplementryImage.path;

            await prisma.suplementryProduct.update( {
                  where: {
                        id,product_id
                  },
                  data: product
            } )
            
            await fs.unlink( previous.dp );

            return sendSuccessResponse( res, 202, "Profile image updated", product );

      } catch (error) {
            console.error( error );
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === "P2025")
                  return sendErrorResponse(res,404,"Product not found", null)
            }
            if (error.code === "ENOENT"){
                  return sendSuccessResponse( res, 202, "Profile image updated", product );
            }
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
}





module.exports = { getSuplementryProduct, getSingleSuplementryProduct,deleteAllSuplementryProduct,deleteSuplementryProduct,createSuplementryProduct,editSuplementryProdct, updateImage };
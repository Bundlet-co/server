const { PrismaClient, Prisma } = require( '@prisma/client' );
const { sendSuccessResponse, sendErrorResponse } = require( '../utils/responseHelper' );
const fs = require( "fs" ).promises;

const prisma = new PrismaClient();

const createProduct = async ( req, res ) =>
{
      const { name, category, slug, description, price, color, size, quantity, discount_type, discount_amount, opening_date, available_till, delivery_duration, dispatch_location, tags, suplementry_product } = req.body
      const { dp, images, suplementryImage } = req.files;
      try {
            if ( !res.merchant.id ) return sendErrorResponse(res,401,"Not a merchant");
            if ( !name || !category || !description || !price || !quantity || !discount_amount || !discount_type || !opening_date || !available_till || !delivery_duration || !dispatch_location || !dp ) return sendErrorResponse( res, 400, "Product name, category,description, price,quantity, discount_type, discount_amount, opening_date, available_till, delivery_duration, dispatch_location is required" );
            if ( images.length < 3 ) return sendErrorResponse( res, 400, "image should be greater or equall to three", null );
            
            const newProduct = await prisma.product.create( {
                  data: {
                        name,
                        category,
                        slug,
                        description,
                        price: parseFloat( price ),
                        color,
                        size,
                        quantity: parseInt( quantity ),
                        discount_amount: parseFloat( discount_amount ),
                        discount_type,
                        opening_date,
                        available_till: parseInt( available_till ),
                        delivery_duration: parseInt( delivery_duration ),
                        dispatch_location,
                        tags,
                        dp: dp[ 0 ].path,
                        images: images.map( ( image ) => image.path ),
                        merchant_id: res.merchant.id
                  }
            } )

            console.log(newProduct);

            if ( !suplementry_product ) return sendSuccessResponse( res, 201, "Product created", { product:newProduct } );
            
            const suplementry = suplementry_product.map(async (product,index) =>
            {
                  return await prisma.suplementryProduct.create( {
                        data: {
                              name: product.name,
                              category: product.category,
                              slug: product.slug,
                              description: product.description,
                              price: parseFloat( product.price ),
                              product_id: newProduct.id,
                              dp:suplementryImage[index].path
                        }
                  })
            } )
            const supplementaryProduct = Promise.all( suplementry );

            const product = { ...newProduct, supplementaryProduct };
            return sendSuccessResponse(res,201,"Product created",{product})
      } catch (error) {
            console.error( error );
            await fs.unlink( dp[ 0 ].path)
            images.map( async image =>
            {
                  await fs.unlink( image.path )
            } )
            suplementryImage.map( async image =>
            {
                  await fs.unlink( image.path )
            } )
            return sendErrorResponse(res,500,"Internal server error",error)
      }
};

const getProduct = async ( req, res ) =>
{
      try {
            const skip = +req.query.skip || 0;
            const PAGE_NUMBER = 10;
            const productCount = await prisma.product.count( { where: { merchant_id: res.merchant.id } } );

            if ( productCount === 0 ) return sendSuccessResponse(res,202,"Product empty",{products:[], count:0})

            const products = await prisma.product.findMany( {
                  where: { merchant_id: res.merchant.id },
                  include: {
                        suplementryProducts: true
                  },
                  skip,
                  take: PAGE_NUMBER,
            } );

            return sendSuccessResponse( res, 202, "Prodct fetched", { products, count: productCount } );
      } catch ( error ) {
            console.error(error);
            return sendErrorResponse(res,500,"Internal server error",error)
      }
};

const updateProduct = async ( req, res ) =>
{
      try {
            const { name, category, slug, description, price, color, size, quantity, discount_type, discount_amount, delivery_duration, dispatch_location, tags } = req.body;
            const { id } = req.params;
            
            if ( !id ) return sendErrorResponse(res,400,"Product Id is required");

            const editedProduct = await prisma.product.update( {
                  where: { id },
                  data: {
                        name,
                        category,
                        slug,
                        description,
                        price:parseFloat(price),
                        color,
                        size,
                        quantity,
                        discount_amount,
                        discount_type,
                        delivery_duration,
                        dispatch_location,
                        tags
                  }
            } )
            
            return sendSuccessResponse(res,202,"Product updated successfully",{product:editedProduct})
      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                  if (e.code === "P2025")
                  return sendErrorResponse(res,404,"Product not found", null)
            }
            console.log(e)
            return sendErrorResponse(res,500,"Internal server error",e)
      }
};

const getSingleProduct = async ( req, res ) =>
{
      try {
            const { id } = req.params;

            if ( !id ) return sendErrorResponse(res,400,"Product Id is required");

            const product = await prisma.product.findUniqueOrThrow( { where: { id }, include:{suplementryProducts:true} } );

            return sendSuccessResponse(res,202,"Product Found",{product})

      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                  if (e.code === "P2025")
                  return sendErrorResponse(res,404,"Product not found", null)
            }
            console.log(e)
            return sendErrorResponse(res,500,"Internal server error",e)
      }
};

const deleteProduct = async ( req, res ) =>
{
      try {
            const { id } = req.params;

            if ( !id ) return sendErrorResponse(res,400,"Product Id is required");

            const product = await prisma.product.delete( { where: { id } } );

            await fs.unlink( product.dp )
            product.images.map( async ( image ) =>
            {
                  await fs.unlink(image)
            } )

            return sendSuccessResponse( res, 200, "product deleted successfully" );

      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                  if (e.code === "P2025")
                  return sendErrorResponse(res,404,"Product not found", null)
            }
            if (e.code === "ENOENT"){
                  return sendSuccessResponse(res,204,"Product deleted",null)
            }
            console.log(e)
            return sendErrorResponse(res,500,"Internal server error",e)
      }
}


const uploadImageAndDp = async ( req, res ) =>
{
      try {
            const { id } = req.params;

            let previous;
            if ( !id ) return sendErrorResponse(res,400,"Product Id is required");
            const { dp, images } = req.files;

            const product = await prisma.product.findUniqueOrThrow( { where: { id } } );
            previous = product

            product.dp = dp ? dp.path : product.dp
            if ( product.images.length === 5 || ( product.images.length + images.length ) > 5 ) return res.status( 400 ).json( { message: "Product images should be less than 5 in total" } );
            product.images = images ? [ ...product.images, images ] : product.images
            
            const editedProduct = await prisma.product.update( {
                  where: {
                        id
                  }
            } )
            
            if ( dp ) {
                  await fs.unlink(previous.dp)
            }
            return sendSuccessResponse( res, 202, "Product updated successfully", { product: editedProduct } );
      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                  if (e.code === "P2025")
                  return sendErrorResponse(res,404,"Product not found", null)
            }
            if (e.code === "ENOENT"){
                  return sendSuccessResponse(res,204,"Product Image updated",{dp:dp.path})
            }
            console.log(e)
            return sendErrorResponse(res,500,"Internal server error",e)
      }
};

const deleteImage = async ( req, res ) =>
{
      try {
            const {path,id} = req.body
            if ( !id ) return sendErrorResponse(res,400,"Product Id is required");
            const product = await prisma.product.findFirstOrThrow( { where: { id,merchant_id:res.merchant.id } } );

            const image = product.images.find( img => img === path )
            
            if ( !image ) return sendErrorResponse(res,404,"Product Image not found", null)
            
            await fs.unlink( image );
            product.images = product.images.filter( img => img !== image )
            
            await prisma.product.update( { where: { id }, data: product } )
            return sendSuccessResponse( res, 200, "product deleted successfully" );
      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                  if (e.code === "P2025")
                  return sendErrorResponse(res,404,"Product not found", null)
            }
            if (e.code === "ENOENT"){
                  return sendSuccessResponse( res, 200, "product deleted successfully" );
            }
            console.log(e)
            return sendErrorResponse(res,500,"Internal server error",e)
      }
};


module.exports = {createProduct,deleteImage,deleteProduct,updateProduct,uploadImageAndDp,getProduct,getSingleProduct}
const { PrismaClient, Prisma } = require( '@prisma/client' );
const { sendSuccessResponse, sendErrorResponse } = require( '../../utils/responseHelper' );
const fs = require( "fs" ).promises;

const prisma = new PrismaClient();


const createProduct = async ( req, res ) =>
{
      const { name, category, slug, description, price,  quantity,variation, discount_type, discount_amount, opening_date, available_till, delivery_duration, dispatch_location, suplementry_product,unit,product_type } = req.body
      const { dp, images, suplementryImage } = req.files;
      try {
            
            if ( !res.merchant.id ) return sendErrorResponse(res,401,"Not a merchant");
            if ( !name || !category || !description || !price || !quantity || !delivery_duration || !dispatch_location || !dp ||!unit ||!product_type ) return sendErrorResponse( res, 400, "Product name, category,description, price,quantity, discount_type, discount_amount, opening_date, available_till, delivery_duration, dispatch_location is required" );
            if ( images.length < 1 ) return sendErrorResponse( res, 400, "image should be greater or equal to 1", null );
            
            const newProduct = await prisma.product.create( {
                  data: {
                        name,
                        category,
                        slug,
                        description,
                        price: parseFloat( price ),
                        quantity: parseInt( quantity ),
                        discount_type,
                        discount_amount: parseFloat(discount_amount),
                        available_till: parseInt( available_till ),
                        delivery_duration: parseInt( delivery_duration ),
                        dispatch_location,
                        unit,
                        product_type,
                        variation: JSON.parse( variation ),
                        opening_date,
                        dp: dp[ 0 ].path,
                        images: images.map( image => image.path ),
                        merchant_id: res.user.id
                  }
            } )
            if ( !suplementry_product ) return sendSuccessResponse( res, 201, "Product created", { product:newProduct } );
            
            const supProduct = JSON.parse(suplementry_product)
            const suplementry = supProduct.map(async (product,index) =>
            {
                  return await prisma.suplementryProduct.create( {
                        data: {
                              name: product.name,
                              price: parseFloat( product.price ),
                              product_id: newProduct.id,
                              quantity: parseInt(product.quantity),
                              dp:suplementryImage[index].path
                        }
                  })
            } )
            const supplementaryProduct = await Promise.all( suplementry );

            const product = { ...newProduct, supplementaryProduct };
            console.log(product);
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
            const { name, category, slug, description, price,  quantity,variation, discount_type, discount_amount, opening_date, available_till, delivery_duration, dispatch_location,unit,product_type } = req.body;
            const { id } = req.params;
            
            if ( !id ) return sendErrorResponse(res,400,"Product Id is required");

            const editedProduct = await prisma.product.update( {
                  where: { id },
                  data: {
                        name,
                        category,
                        slug,
                        description,
                        price: parseFloat( price ),
                        quantity: parseInt( quantity ),
                        discount_type,
                        discount_amount: parseFloat(discount_amount),
                        available_till: parseInt( available_till ),
                        delivery_duration: parseInt( delivery_duration ),
                        dispatch_location,
                        unit,
                        product_type,
                        variation: variation,
                        opening_date,
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

            
            const suplementry = await prisma.suplementryProduct.findMany( { where: { product_id: id } } );
            await prisma.suplementryProduct.deleteMany( { where: { product_id: id } } );
            const product = await prisma.product.delete( { where: { id } } );

            await fs.unlink( product.dp )
            product.images.map( async ( image ) =>
            {
                  await fs.unlink(image)
            } )

            suplementry.map(async item =>
            {
                  await fs.unlink(item.dp)
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
{const { dp, images } = req.files;
      try {
            const { id } = req.params;

            
            if ( !id ) return sendErrorResponse(res,400,"Product Id is required");

            const product = await prisma.product.findUniqueOrThrow( { where: { id } } );
            const previous = await prisma.product.findUniqueOrThrow( { where: { id } } );

            product.dp = dp ? dp.path : product.dp
            if ( images && images.length >0 ) {
                  if ( product.images.length === 5 || ( product.images.length + images.length ) > 5 ) return res.status( 400 ).json( { message: "Product images should be less than 5 in total" } );
                  product.images = images ? [ ...product.images, images ] : product.images
            }
            
            const editedProduct = await prisma.product.update( {
                  where: {
                        id
                  }, data: {
                        dp: dp ? dp.path : previous.dp,
                        images:images ? [...previous.images,...images.map(image=> image.path)]: previous.images
                  }
            } )
            
            if ( dp ) {
                  await fs.unlink(previous.dp)
            }
            console.log( editedProduct );
            console.log(dp.path);
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
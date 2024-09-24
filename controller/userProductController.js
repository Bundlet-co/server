const { Prisma, PrismaClient } = require( "@prisma/client" );
const { sendErrorResponse, sendSuccessResponse } = require( "../utils/responseHelper" );

const prisma = new PrismaClient();

const getProduct = async ( req, res ) =>
{
      try {
            const skip = +req.query.skip || 0;
            const PAGE_NUMBER = 10;
            const productCount = await prisma.product.count();

            if ( productCount === 0 ) return res.status( 200 ).json( { message: "No product was found for user" } );

            const products = await prisma.product.findMany( {
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

const getProductByCategory = async ( req, res ) =>
{
      const skip = +req.query.skip || 0;
      const category = req.query.category;
      if ( !category ) return sendErrorResponse( res, 400, "Category is required" );
      try {
            const PAGE_NUMBER = 10;
            const count = await prisma.product.count( {
                  where: {
                        category:category.toLowerCase()
                  }
            } );

            if ( count === 0 ) return sendSuccessResponse( res, 200, "Category empty", { products: [], count } );

            const products = await prisma.product.findMany( {
                  where: {
                        category
                  },
                  include: {
                        suplementryProducts:true
                  },
                  skip,
                  take:PAGE_NUMBER
            } )

            return sendSuccessResponse( res, 200, "Product fetched", { products, count } );
      } catch ( error ) {
            console.error(error);
            return sendErrorResponse(res,500,"Internal server error",error)
      }
}

const searchFilter = async ( req, res ) =>
{
      const { search, minPrice, maxPrice,skip } = req.query;
      let whereClause = {};
      try {
            const PAGE_NUMBER = 10;
            if ( search ) {
                  whereClause.name = {
                        contains: search,
                        mode: "insensitive",
                  };
                  whereClause.description = {
                        contains: search,
                        mode: "insensitive",
                  }
            }
            if ( minPrice ) whereClause.price = { gte: minPrice };
            if ( maxPrice ) whereClause.price = { lte: maxPrice };

            const count = await prisma.product.count( { where: whereClause } )
            
            if ( count === 0 ) return sendSuccessResponse( res, 200, "Category empty", { products: [], count } );

            const products = await prisma.product.findMany( {
                  where: whereClause,
                  include: {
                        suplementryProducts: true
                  },
                  skip: +skip || 0,
                  take:PAGE_NUMBER
            } )
            
            return sendSuccessResponse( res, 200, "Product fetched", { products, count } );
      } catch ( error ) {
            console.error(error);
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
}

const getRandomProducts = async ( req, res ) =>
{
      try {
            const PAGE_NUMBER = 3;
            const count = await prisma.product.count();
            if ( count === 0 ) return sendSuccessResponse( res, 200, "Category empty", { products: [], count } );

            const randomOffset = Math.floor( Math.random() * count );
            const adjustedOffset = Math.max( 0, randomOffset - PAGE_NUMBER );
            const products = await prisma.product.findMany( {
                  take: PAGE_NUMBER,
                  skip: adjustedOffset
            } )
            
            return sendSuccessResponse( res, 200, "fetched product carousel", { products, count } );
      } catch ( error ) {
            console.error(error);
            return sendErrorResponse( res, 500, "Internal server error", error );
      }
}



module.exports = { getProduct, getSingleProduct, getProductByCategory, getRandomProducts, searchFilter };
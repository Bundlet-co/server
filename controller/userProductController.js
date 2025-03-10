const { Prisma, PrismaClient } = require( "@prisma/client" );
const { sendErrorResponse, sendSuccessResponse } = require( "../utils/responseHelper" );
const { addDays,parseISO } = require( "date-fns" );

const prisma = new PrismaClient();

const getProduct = async ( req, res ) =>
{
      try {
            const skip = +req.query.skip || 0;
            const PAGE_NUMBER = 10;
            const productCount = await prisma.product.count();

            if ( productCount === 0 ) return res.status( 200 ).json( { message: "No product was found for user",products:[], count: productCount } );

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


const getFlashDeals = async ( req, res ) =>
{
      try {
            const skip = +req.query.skip || 0;
            const PAGE_NUMBER = 10;
            const currentDate = new Date();
            const productCount = await prisma.product.count( {
                  where: {
                        AND: [
                              {
                                    opening_date: {
                                          lte: currentDate.toISOString(), // Opening date must be in the past
                                    },
                              },
                              {
                                    available_till: {
                                          not: null, // Ensure available_till is set
                                    },
                              },
                              {
                                    available_till: {
                                          gt: 0, // Ensure available_till is greater than 0
                                    },
                              },
                        ],
                  },
            });

            if ( productCount === 0 ) return res.status( 200 ).json( { message: "No product was found for user", products:[], count: productCount  } );
            
            

            const products = await prisma.product.findMany( {
                  where: {
                        AND: [
                              {
                                    opening_date: {
                                          lte: currentDate.toISOString(), // Opening date must be in the past
                                    },
                              },
                              {
                                    available_till: {
                                          not: null, // Ensure available_till is set
                                    },
                              },
                              {
                                    available_till: {
                                          gt: 0, // Ensure available_till is greater than 0
                                    },
                              },
                        ],
                  },
                  include: {
                        suplementryProducts: true
                  },
                  skip,
                  take: PAGE_NUMBER,
            } );

            const filteredProduct = products.filter( product =>
            {
                  const openingDate = parseISO( product.opening_date );
                  const availableUntilDate = addDays( openingDate, product.available_till || 0 );
                  return availableUntilDate >= currentDate;
            } )
            return sendSuccessResponse( res, 202, "Prodct fetched", { products:filteredProduct, count: productCount } );
      } catch (error) {
            console.error(error);
            return sendErrorResponse(res,500,"Internal server error",error)
      }
}

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
                        category:category
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
            if (search) {
                  whereClause.OR = [
                  {
                        name: {
                              contains: search,
                              mode: "insensitive",
                        },
                  },
                  {
                        description: {
                              contains: search,
                              mode: "insensitive",
                        },
                  },
                  ];
            }

            // Add price filters if they exist
            if (minPrice || maxPrice) {
                  whereClause.price = {};
                  if (minPrice) whereClause.price.gte = parseFloat(minPrice);
                  if (maxPrice) whereClause.price.lte = parseFloat(maxPrice);
            }

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

const getCarousel = async ( req, res ) =>
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

const getRandomProducts = async ( req, res ) =>
{
      try {
            const PAGE_NUMBER = 10;
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



module.exports = { getProduct, getSingleProduct, getProductByCategory, getRandomProducts, searchFilter,getFlashDeals,getCarousel };
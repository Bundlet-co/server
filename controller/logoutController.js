const { PrismaClient, Prisma } = require( '@prisma/client' );
const { sendSuccessResponse, sendErrorResponse } = require( '../utils/responseHelper' );

const prisma = new PrismaClient();

const logout = async ( req, res ) =>
{
      const cookies = req.cookies;
      if( !cookies?.refreshToken ) return sendSuccessResponse( res, 204, "Looge out" );
      try {
            const refreshToken = cookies.refreshToken
            const user = await prisma.user.findFirstOrThrow( {
                  where: {
                        refresh_token: {
                              has: refreshToken
                        }
                  }
            } );
            user.refresh_token = user.refresh_token.filter( token => token !== refreshToken );
            await prisma.user.update( {
                  where: {
                        id:user.id,
                        refresh_token: {
                              has: refreshToken
                        }
                  },
                  data: user
            } );
            res.clearCookie( "refreshToken", {
                  httpOnly: true,
            })
            return sendSuccessResponse(res,204,"Logged out was completed")
      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                  if (e.code === "P2025")
                  return sendSuccessResponse(res,204,"User not found", null)
            }
            console.log(e)
            return sendErrorResponse(res,500,"Internal server error",e)
      }
};

const logoutMerchant = async ( req, res ) =>
{
      const cookies = req.cookies;
      if( !cookies?.refreshToken ) return sendSuccessResponse( res, 204, "Logged out was successful" );
      try {
            const refreshToken = cookies.refreshToken
            const user = await prisma.merchant.findFirstOrThrow( {
                  where: {
                        refresh_token: {
                              has: refreshToken
                        }
                  }
            } );
            user.refresh_token = user.refresh_token.filter( token => token !== refreshToken );
            await prisma.merchant.update( {
                  where: {
                        id:user.id,
                        refresh_token: {
                              has: refreshToken
                        }
                  },
                  data: user
            } );
            res.clearCookie( "refreshToken", {
                  httpOnly: true,
            })
            return sendSuccessResponse(res,204,"Logged out was completed")
      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                  if (e.code === "P2025")
                  return sendSuccessResponse(res,204,"merchant not found", null)
            }
            console.log(e)
            return sendErrorResponse(res,500,"Internal server error",e)
      }
};


module.exports ={logout,logoutMerchant}
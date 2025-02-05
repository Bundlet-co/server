const { PrismaClient, Prisma } = require( '@prisma/client' );
const argon = require( "argon2" );
const randomString = require("crypto-random-string");
const { sendMail } = require( '../../utils/sendMail' );
const jwt = require( "jsonwebtoken" );
const { sendSuccessResponse, sendErrorResponse } = require( '../../utils/responseHelper' );
const fs = require( "fs" ).promises;

const prisma = new PrismaClient();


const createMerchant = async ( req, res ) =>
{
      const { name, email, password, address, phone } = req.body;
      const dp = req.file;
      if ( !name || !email || !password || !address || !phone || !dp ) return res.status( 400 ).json( { message: "All fields required",name, email, password, address, phone ,dp } );
      try {
            
            
            const code = randomString({ length: 6, type: "numeric" });

            const hashedPassword = await argon.hash( password );

            const html = `
                  <!DOCTYPE html>
                  <html lang="en">
                  <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Verify Your Email Address</title>
                  <style>
                  body {
                        font-family: sans-serif;
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
                        padding: 20px;
                        color: #fefefe;
                  }
                  .cta {
                        text-align: center;
                        margin-top: 20px;
                        color: #fefefe;
                  }
                  a {
                        color: #fff2eb;
                        text-decoration: none;
                  }
                  </style>
                  </head>
                  <body>
                  <div class="container">
                  <div class="header">
                        <h1>Welcome to Bundlet-co Merchant!</h1>
                  </div>
                  <div class="content">
                        <p>Thank you for signing up for an account on Bundlet as a vendor. To verify your email address and unlock full access to our features, please enter the verification code below.</p>
                  </div>
                  <div class="cta">
                        <h1>${code}</h1>
                  </div>
                  <div class="content">
                        <p>For your security, this verification code will expire in 15 minutes.</p>
                  </div>
                  <div class="content">
                        <p>If you didn't create an account on Bundlet-co Merchant, please ignore this email.</p>
                  </div>
                  </div>
                  </body>
                  </html>
                              `;
            const subject = "Verify your Bundlet Merchant Account!";
            const from = `Bundlet Support<${ process.env.EMAIL }>`;
            
            await prisma.merchant.create( {
                  data: {
                        name, email, phone, password: hashedPassword, address, dp: dp.path,
                        verification_code:code
                  }
            } )
            await sendMail( from, email, subject, html );

            return sendSuccessResponse( res, 201, "Merchant created", { email } );

      } catch ( e ) {
            console.error(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if ( e.code === "P2002" )
                  return sendErrorResponse(res,409,"Email Already exist")
      }
            return sendErrorResponse(res,500,"Internal server error",e)
            
      } finally {
            setTimeout(async () => {
                  const user = await prisma.merchant.findFirst( { where: { email } } )
                  if ( user.verification_code !== null ) {
                        await prisma.user.update({
                              where: { email },
                              data: {
                              verification_code: "",
                              },
                        });
                  }
            }, 900000);
      }
};

const loginMerchant = async ( req, res ) =>
{
      try {
            const { email, password } = req.body;
            if ( !email || !password ) return res.status( 400 ).json( { message: "All feild must be entered" } );

            const foundUser = await prisma.merchant.findUniqueOrThrow( { where: { email } } );

            const validatePassword = await argon.verify( foundUser.password, password )
            if ( !validatePassword ) return res.status( 401 ).json( { message: "Invalid credentials" } );


            const accessToken = jwt.sign(
                  {
                        email: foundUser.email,
                        id: foundUser.id,
                        name:foundUser.name
                  },
                  process.env.ACCESS_TOKEN,
                  {
                  expiresIn: "3h",
                  }
            )

            const refreshToken = jwt.sign(
                  {
                        email: foundUser.email,
                        id: foundUser.id,
                        name:foundUser.name
                  },
                  process.env.REFRESH_TOKEN,
                  {
                  expiresIn: "30d",
                  }
            )

            await prisma.merchant.update( {
                  where: { email: foundUser.email },
                  data: {
                        refresh_token:[refreshToken, ...foundUser.refresh_token]
                  }
            } )
            
            const user = { ...foundUser, accessToken };
            delete user.refresh_token;
            delete user.resetPasswordToken
            delete user.verification_code;
            delete user.password;

            res.cookie("refreshToken", refreshToken, {
                  httpOnly: true,
                  maxAge: 30 * 24 * 60 * 60 * 1000,
                  sameSite: 'None',
                  secure: true,
            } );
            
            return sendSuccessResponse( res, 200, "Login was successfull", { user } );

      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                  if (e.code === "P2025")
                  return sendErrorResponse(res,404,"Merchant does not exist")
            }
            console.log( e )
            return sendErrorResponse( res, 500, "Internal server error", e );
      }
};


const editMerchant = async ( req, res ) =>
{
      try {
            const { id } = req.params;
            const { name, address, website, bank_name, account_name, account_number, phone} = req.body;

            if ( !id ) return res.status( 400 ).json( { message: "Merchant Id is required" } );

            const merchant = await prisma.merchant.update( {
                  where: { id },
                  data: {
                        name,
                        address,
                        website,
                        bank_name,
                        account_name,
                        account_number,
                        phone
                  }
            } );
            
            delete merchant.refresh_token;
            delete merchant.resetPasswordToken
            delete merchant.verification_code;
            delete merchant.password;
            return sendSuccessResponse( res, 200, "Merchant updated successfully", merchant );
      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                  if ( e.code === "P2025" )
                        return sendErrorResponse( res, 404, "Merchant does not exist" );
            }
            console.log(e)
            return sendErrorResponse( res, 500, "Internal server error", e );
      }
}

const updateDp = async( req, res ) => {
      try {
            const { id } = req.params;
            const { dp } = req.file;
            if ( !dp || !id ) return res.status( 400 ).json( { message: "Photo or Id missing" } );

            const merchant = await prisma.merchant.findUniqueOrThrow( { where: { id } } );

            await fs.unlink( `${ merchant.dp }` );

            merchant.dp = dp.path;
            await prisma.merchant.update( { where: { id }, data: merchant } );
            return sendSuccessResponse(res,202,"Profile Image updated",{dp:dp.path})
            

      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === "P2025"){
                  sendErrorResponse(res,404,"Merchant does not exist")
                  await fs.unlink( `${ dp.path }` );
                  return;
                  }
            }
            if (e.code === "ENOENT"){
                  user.dp = dp.path;
                  await prisma.user.update( { data: user, where: { id } } );
                  return sendSuccessResponse(res,202,"Profile Image updated",{dp:dp.path})
            }
            sendErrorResponse( res, 500, "Internal server error", e );
            await fs.unlink( `${ dp.path }` );
            return;
      }
}

const deleteMerchant = async (req,res) =>
{
      try {
            const { id } = req.params;
            const user = await prisma.merchant.findUniqueOrThrow( { where: { id } } );
            await prisma.merchant.delete( { where: { id } } );
            await fs.unlink( `${ user.dp }` )
            return sendSuccessResponse(res,204,"Merchant deleted",null)
      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === "P2025"){
                  return sendErrorResponse(res,404,"Merchant does not exist")
                  }
            }
            if (e.code === "ENOENT"){
                  return sendSuccessResponse(res,204,"Merchant deleted",null)
            }
            return sendErrorResponse( res, 500, "Internal server error", e );
            
      }
}


module.exports= {createMerchant, loginMerchant,editMerchant,updateDp,deleteMerchant}


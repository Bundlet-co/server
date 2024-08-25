const { PrismaClient, Prisma } = require( "@prisma/client" );
const { sendMail } = require( "../utils/sendMail" );
const randomString = require("crypto-random-string");

const prisma = new PrismaClient();


const verifyCode = async ( req, res ) =>
{
      try {
            const { email, code } = req.body;
            const user = await prisma.user.findUniqueOrThrow( { where: { email } } );
            if ( user.verification_code !== code ) return res.status( 403 ).json( { message: "Invalid code" } );
            await prisma.user.update( {
                  where: { email, verification_code:code }, data: {
                        verification_code: null,
                        isVerified:true
                  }
            } )
            const html = `
                  <!DOCTYPE html>
                        <html lang="en">
                              <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <title>Your Email is Verified!</title>
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
                                          background-color: #338EF7;
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
                                          text-decoration: none;
                                          color: #fff;
                                    }
                                    </style>
                              </head>
                              <body>
                                    <div class="container">
                                    <div class="header">
                                          <h1>Welcome to Bundlet-co!</h1>
                                    </div>
                                    <div class="content">
                                          <p>Hi ${ user.name },</p>
                                          <p>Your email address has been successfully verified. You're now ready to explore all the great things Bundlet-co has to offer.</p>
                                    </div>
                                    <div class="cta">
                                          <a href="${process.env.FRONTEND_URL}">Start Exploring Now!</a>
                                    </div>
                                    </div>
                              </body>
                        </html>
                        `;
            const subject = "Verification Successful!";
            const from = `Bundlet-co Support<${ process.env.EMAIL }>`;
            await sendMail(from,email,subject,html)
            return res.json( { message: "Email verified successfully" } );
      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                  if (e.code === "P2025")
                  return res.status(404).json({ message: "User not found" });
            }
            console.log(e)
            return res.status(500).json({ message: "internal server error", error: e });
      }
};


const resendVerification = async ( req, res ) =>
{
      try {
            const { email } = req.params;
            const user = await prisma.user.findUniqueOrThrow( { where: { email:email } } );
            if ( user.isVerified ) return res.status( 202 ).json( { message: "User already verified" } );
            const code = randomString( { length: 6, type: "numeric" } );
            
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
                                          <h1>Welcome to Bundlet-co!</h1>
                                    </div>
                                    <div class="content">
                                          <p>Thank you for signing up for an account on Bundlet-co. To verify your email address and unlock full access to our features, please enter the verification code below.</p>
                                    </div>
                                    <div class="cta">
                                          <h1>${code}</h1>
                                    </div>
                                    <div class="content">
                                          <p>For your security, this verification code will expire in 15 minutes.</p>
                                    </div>
                                    <div class="content">
                                          <p>If you didn't create an account on Bundlet-co, please ignore this email.</p>
                                    </div>
                                    </div>
                              </body>
                        </html>
                        `;
            const subject = "Verify your account Bundlet-co!";
            const from = `Bundlet-co Support<${ process.env.EMAIL }>`;
            
            await sendMail( from, email, subject, html );

            await prisma.user.update( {
                  where: { email }, data: {
                  verification_code: code
            }})

            return res.status( 200 ).json( { message: "Verification mail was sent successfully" } );
      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                  if (e.code === "P2025")
                  return res.status(404).json({ message: "User not found" });
            }
            console.log(e)
            return res.status(500).json({ message: "internal server error", error: e });
      } finally {
            setTimeout(async () => {
                  await prisma.user.update({
                  where: { email },
                  data: {
                  verification_code: "",
                  },
                  });
            }, 900000);
      }
};


module.exports = {verifyCode,resendVerification}
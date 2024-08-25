const { PrismaClient, Prisma } = require( '@prisma/client' );
const argon = require( "argon2" );
const randomString = require("crypto-random-string");
const { sendMail } = require( '../utils/sendMail' );
const jwt = require("jsonwebtoken")

const prisma = new PrismaClient();

const createUser = async ( req, res ) =>
{
      try {
            const { name, email, password, phone_number  } = req.body;
            if ( !name || !email || !password || !phone_number ) return res.status( 400 ).json( { message: "All feilds are required" } );

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
                        <h1>Welcome to Bundlet-co!</h1>
                  </div>
                  <div class="content">
                        <p>Thank you for signing up for an account on Bundlet. To verify your email address and unlock full access to our features, please enter the verification code below.</p>
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
                  const subject = "Verify your account Bundlet!";
                  const from = `Bundlet Support<${process.env.EMAIL}>`;
            await prisma.user.create( {
                  data: {
                        name,email,phone_number,password:hashedPassword,verification_code:code
                  }
            } )
            
            await sendMail( from, email, subject, html );
            return res.status( 201 ).json( { message: "Account created", data: { email } } );
      } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === "P2002")
            return res.status(409).json({ message: "Email already exist" });
      }
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

const loginUser = async ( req, res ) =>
{
      try {
            const { email, password } = req.body;
            if ( !email || !password ) return res.status( 400 ).json( { message: "Enter all feilds" } );

            const foundUser = await prisma.user.findUniqueOrThrow( { where: { email } } );

            const validatePassword = await argon.verify( foundUser.password, password );
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

            await prisma.user.update( {
                  where: { email: foundUser.email },
                  data: {
                        refresh_token:[refreshToken, ...foundUser.refresh_token]
                  }
            } )
            
            const user = { ...foundUser, accessToken }
            delete user.password;
            delete user.verification_code;
            delete user.refresh_token
            delete user.resetPasswordToken

            return res.status( 200 ).json( { message: "Login was successful", data: { ...user } } );

      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                  if (e.code === "P2025")
                  return res.status(404).json({ message: "User not found" });
            }
            console.log(e)
            return res.status(500).json({ message: "internal server error", error: e });
      }
};

const editUser = async ( req, res ) =>
{
      try {
            const {phone_number, name,address} = req.body
            const { id } = req.params;
            if ( !id ) return res.status( 400 ).json( { message: "User id is required" } );

            const user = await prisma.user.findUniqueOrThrow( { where: { id } } );

            user.phone_number = phone_number
            user.name = name
            user.address = address ? user.address.push( { id: user.address.length + 1, address } ) : address;

            await prisma.user.update( { where: { id }, data: user } );

            return res.status( 200 ).json( { message: "Profile updated" } );
      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                  if (e.code === "P2025")
                  return res.status(404).json({ message: "User not found" });
            }
            console.log(e)
            return res.status(500).json({ message: "internal server error", error: e });
      }
};

const deleteUser = async ( req, res ) =>
{
      try {
            const { id } = req.params;
            if ( !id ) return res.status( 400 ).json( { message: "User id is required" } );
            await prisma.user.delete( { where: { id } } );
            return res.status( 200 ).json( { message: "Profile deleted" } );
      } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                  if (e.code === "P2025")
                  return res.status(404).json({ message: "User not found" });
            }
            console.log(e)
            return res.status(500).json({ message: "internal server error", error: e });
      }
};


module.exports = { createUser, loginUser, editUser, deleteUser };
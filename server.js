require("dotenv").config();
const compression = require( "compression" );
const express = require("express");
const cors = require( "cors" );
const cookieParser = require( "cookie-parser" );

const figlet = require( 'figlet' );
const multer = require( 'multer' );
const credentials = require( "./middlewares/credentials" );
const corsOption = require( "./config/corsOption" );
const { verifyJwt, verifyMerchant } = require( './middlewares/auth' );
const { logout, logoutMerchant } = require( "./controller/logoutController" );
const PORT = process.env.PORT || 3500;

const app = express();
app.use(compression({
  level: 8,
  threshold: 1024,
} ) );

// Middlewares
app.use(credentials);
app.use( cors( corsOption ) );
app.use(express.urlencoded({ extended: true, limit: "200mb" }));
app.use(express.json({limit:"500mb"}));

app.use( cookieParser() );

app.use( express.static( "public" ) );

//Multer for Merchant and product
const storeStorage = multer.diskStorage( {
  destination: "./public/images/vendors",
  filename: ( req, file, cb ) =>
  {
    const uniqueSuffix = Date.now() + "-" + Math.round( Math.random() * 1e9 );
    cb( null, file.fieldname + '-' + uniqueSuffix + file.originalname );
  }
} );

const productStorage = multer.diskStorage( {
  destination: "./public/images/products",
  filename: ( req, file, cb ) =>
  {
    const uniqueSuffix = Date.now() + "-" + Math.round( Math.random() * 1e9 );
    cb( null, file.fieldname + '-' + uniqueSuffix + file.originalname );
  }
} );

const suplementryStorage = multer.diskStorage( {
  destination: "./public/images/suplementry",
  filename: ( req, file, cb ) =>
  {
    const uniqueSuffix = Date.now() + "-" + Math.round( Math.random() * 1e9 );
    cb( null, file.fieldname + '-' + uniqueSuffix + file.originalname );
  }
} );

const storeUpload = multer( { storage: storeStorage } );
const storeCp = storeUpload.single( 'dp' );

const productUpload = multer( { storage: productStorage } );
const productCp = productUpload.fields( [ { name: "dp", maxCount: 1 }, { name: "images", maxCount: 5 }, { name: "suplementryImage", maxCount: 5 } ] );

const suplementryUpload = multer( { storage: suplementryStorage } );
const suplementryCp = suplementryUpload.single( "suplementryImage" );

//User Route without JWT verification
app.get( '/', ( req, res ) =>
{
  res.status( 301 ).redirect( process.env.FRONTEND_URL );
} );
app.use( '/auth', require( './routes/userAuth' ) );
app.use( '/refresh', require( "./routes/refresh" ) );
app.use( '/verify', require( "./routes/userVerify" ) );
app.use( '/product', require( "./routes/userProduct" ) );
app.use( '/categories', require( './routes/userCategory' ) );


//Merchant Routes without verification
app.get( '/merchant', ( req, res ) =>
{
  res.status( 301 ).redirect( process.env.ADMIN_FRONTEND_URL );
} );
app.use( '/merchant/auth', storeCp, require( './routes/merchantAuth' ) );
app.use( '/merchant/verify', require( "./routes/verifyMerchant" ) );

//User Routes with jwt verification
app.use( verifyJwt );
app.use( '/wishlist', require( "./routes/wishlist" ) );
app.use( '/profile', require( "./routes/userProfile" ) );
app.use( "/cart", require( "./routes/cart" ) );
app.use( "/order", require( "./routes/userOrder" ) );
app.use( "/logout", logout );


//Merchant Routes with jwt verification
app.use( verifyMerchant );
app.use( "/merchant/profile", storeCp, require( "./routes/merchantProfile" ) );
app.use( '/merchant/product',productCp, require( './routes/merchantProduct' ) );
app.use( '/merchant/order', require( "./routes/merchantOrder" ) );
app.use( '/merchant/suplementry', suplementryCp, require( './routes/merchantSupplementry' ) );
app.use( '/merchant/category', require( './routes/merchantCategory' ) );
app.use( '/merchant/subcategory', require( "./routes/merchantSubCategory" ) );
app.use( '/merchant/logout', logoutMerchant );

app.listen( PORT, () =>
{
  figlet.text( 'Bundlet API 1.0', {
    font: 'Doom',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 100,
    whitespaceBreak: true,
  }, (err, asciiArt) => {
    if (err) {
      console.error(err);
      return;
    }
      console.log( asciiArt );
      console.log( `server is running on port ${ PORT }` );
  } );
} );

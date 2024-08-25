require("dotenv").config();
const compression = require( "compression" )
const express = require("express");
const cors = require( "cors" );
const cookieParser = require( "cookie-parser" );

const figlet = require( 'figlet' );
const multer = require( 'multer' );
const credentials = require( "./middlewares/credentials" );
const corsOption = require( "./config/corsOption" );
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

app.use( express.static( "public" ) )


app.get( '/', ( req, res ) =>
{
  res.status(301).redirect('http://localhost:5173')
} )

app.use( '/auth', require( './routes/userAuth' ) );
app.use( '/refresh', require( "./routes/refresh" ) );
app.use('/user-verify', require("./routes/userVerify"))


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

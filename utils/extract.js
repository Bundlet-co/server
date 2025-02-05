const extractPublicId = ( url="" ) =>
{
      const parts = url.split( "/" );
      const filename = parts.pop();
      const folder = parts.slice( 7 ).join( "/" );
      return folder.replace(`/${filename}`, "").replace(/\.[^/.]+$/, "");
};


module.exports ={extractPublicId}
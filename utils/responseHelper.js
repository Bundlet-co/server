

const sendResponse = ( res, statusCode, success, message, data = null ) =>
{
      return res.status( statusCode ).json( {
            success,
            message,
            data
      } );
};

const sendSuccessResponse = ( res, statusCode, message, data ) =>
{
      return sendResponse( res, statusCode, true, message, data );
};

const sendErrorResponse = ( res, statusCode, message, error ) =>
{
      return sendResponse( res, statusCode, false, message, error );
};

module.exports = { sendResponse, sendSuccessResponse, sendErrorResponse };
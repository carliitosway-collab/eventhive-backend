const { expressjwt: jwt } = require("express-jwt");

// Function used to extract the JWT token from the request's 'Authorization' Headers
function getTokenFromHeaders(req) {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
}

// ✅ Required auth (si no hay token -> 401)
const isAuthenticated = jwt({
  secret: process.env.TOKEN_SECRET,
  algorithms: ["HS256"],
  requestProperty: "payload",
  getToken: getTokenFromHeaders,
});

// ✅ Optional auth (si hay token lo valida y setea payload, si no hay token no falla)
const isAuthenticatedOptional = jwt({
  secret: process.env.TOKEN_SECRET,
  algorithms: ["HS256"],
  requestProperty: "payload",
  getToken: getTokenFromHeaders,
  credentialsRequired: false,
});

module.exports = {
  isAuthenticated,
  isAuthenticatedOptional,
};

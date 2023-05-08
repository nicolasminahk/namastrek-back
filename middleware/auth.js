// const express = require('express')
// const jwt = require('express-jwt')
// const jwks = require('jwks-rsa')
// const mongoose = require('mongoose')
// const User = require('./user.model')
// const app = express()

// // Set up JWT authentication middleware
// const authConfig = {
//     domain: 'dev-v68nrhhmjwsv23p7.us.auth0.com',
//     audience: 'https://dev-v68nrhhmjwsv23p7.us.auth0.com/api/v2/',
// }

// app.use(
//     jwt({
//         secret: jwks.expressJwtSecret({
//             cache: true,
//             rateLimit: true,
//             jwksRequestsPerMinute: 5,
//             jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`,
//         }),
//         audience: authConfig.audience,
//         issuer: `https://${authConfig.domain}/`,
//         algorithms: ['RS256'],
//     })
// )

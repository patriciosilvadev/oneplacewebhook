
module.exports = {
    twilioAccountId: process.env.TWILIO_ACCOUNT_ID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioNumeroEmprendedor: process.env.NUM_EMPRENDEDOR,
    twilioNumeroCliente: process.env.NUM_CLIENTE,
    mongoDbUser: process.env.OP_MONGODB_USER,
    mongoDbPassword: process.env.OP_MONGODB_PASSWORD,
    montoDbDatabase: process.env.OP_MONGODB_DATABASE,
    facebookAccessToken: process.env.PAGE_ACCESS_TOKEN,
    facebookVerificationToken: process.env.VERIFICATION_TOKEN,
    messageTypeFacebook: 1,
    messageTypeWhatsapp: 2,
    keySecret: process.env.KEY_SECRET
    
}
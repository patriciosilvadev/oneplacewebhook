const {Router} = require('express');
const router = Router();
const {indexController, chatController, postHookWhatsapp, getHookFacebook, postHookFacebook, contactmessagesController, messagesController} = require('../controllers/IndexController');
const authController = require('../controllers/AuthController');
const authMiddleware = require('../middleware/auth');

router.get('/', indexController);

router.get('/chat', chatController);

router.post("/hookWhatsapp", postHookWhatsapp);

router.get("/hookFacebook", getHookFacebook);

router.post("/hookFacebook", postHookFacebook);

router.get('/contactmessages', authMiddleware.Validate, contactmessagesController);

router.get('/messages/:socialnetwork/:useraccountid/:clientaccountid', authMiddleware.Validate, messagesController);

router.post('/auth/register', authController.register);

router.post('/auth/login', authController.login);

router.post('/auth/validate', authController.validate_token);

module.exports = router;
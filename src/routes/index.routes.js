const {Router} = require('express');
const router = Router();
const {indexController, chatController, postHookWhatsapp, getHookFacebook, postHookFacebook, LeftMessagesController, contactmessagesController, messagesController} = require('../controllers/index.controller');

router.get('/', indexController);

router.get('/chat/:user', chatController);

router.post("/hookWhatsapp", postHookWhatsapp);

router.get("/hookFacebook", getHookFacebook);

router.post("/hookFacebook", postHookFacebook);

router.get('/leftmessages/:user', LeftMessagesController);

router.get('/contactmessages/:userid', contactmessagesController);

router.post('/messages/', messagesController);

module.exports = router;
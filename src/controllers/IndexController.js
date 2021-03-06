const config = require('../config');
const request = require("request");
const daoMongo = require('../services/MessageService');

const indexController = (req, res) => {
    res.render('index');
}

const chatController = (req, res) => {
    //! TODO: Se debe establecer el UserId desde el token
    let userId = 'Oneplace1';
    res.render('chat');
}

/**
 * Controlador para el webhook de Whatsapp, este método consulta la cuenta del mensaje recibido, si la encuentra
 * realiza el registro del mensaje recibido asignandolo al usuario registrado en la aplicación y se realiza el 
 * envío de la notificación a través del socket io específico.
 * 
 * Se espera recibir la siguiente estructura y ejemplo de datos: 
 * {"SmsMessageSid":"SM990908a439b3667ef6d5a54500b53da0","NumMedia":"0","SmsSid":"SM990908a439b3667ef6d5a54500b53da0",
 * "SmsStatus":"received","Body":"hola","To":"whatsapp:+14155238886","NumSegments":"1","MessageSid":"SM990908a439b3667ef6d5a54500b53da0",
 * "AccountSid":"AC172cbb76359af9692e1e21aa1f1812d3","From":"whatsapp:+57316491XXXX","ApiVersion":"2010-04-01"}
 * 
 * @param {} req 
 * @param {*} res 
 */
const postHookWhatsapp = async (req, res) => {
    console.log('postHookWhatsapp: ' + req.body.Body);
   
    let objRespuesta = {
        "MessageId":"",
        "Message":"",
        "Client":"",
        "User":"",
        "ConversationName":"",
        "SocialNetwork":config.messageNetworkWhatsapp,
        "MessageType":config.messageTypeInbound, 
        "Time": Date.now
    }

    if (Object.keys(req.body).length === 0)
        res.status(500).send('error');
    else {
        //Almacena el mensaje en la BD.           
        const result = await daoMongo.createMessage(req.body.SmsMessageSid, req.body.From, req.body.To, req.body.Body, config.messageTypeInbound, config.messageNetworkWhatsapp, req.body.AccountSid);
        const account = await daoMongo.getAccountByIdNetwork(req.body.AccountSid, config.messageNetworkWhatsapp);        
        const lastmessage = await daoMongo.getLastMessageByAccountIdAndClient(account.UserId, req.body.From);
        
        objRespuesta.Message = req.body.Body;
        objRespuesta.User = req.body.To;
        objRespuesta.Client = req.body.From;
        objRespuesta.MessageId = req.body.SmsMessageSid;
        objRespuesta.ConversationName = lastmessage.ConversationName; //=== 'undefined'? "": lastmessage.ConversationName;               

        //Emitir el mensaje por SocketIO
        require('../index').emitMessage(objRespuesta, account.SocketId);

        //devuelve ok al api. Este no valida un mensaje en específico, solo la respuesta 200 http
        res.status(200).send('ok');
    }
}

const getHookFacebook = (req, res) => {
    // Verificar la coincidendia del token
    if (req.query["hub.verify_token"] === config.facebookVerificationToken) {
        // Mensaje de exito y envio del token requerido
        console.log("webhook verificado!");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        // Mensaje de fallo
        console.error("La verificacion ha fallado, porque los tokens no coinciden");
        res.sendStatus(403);
    }
}

/**
 * Controlador para el webhook de Facebook, este metodo consulta la cuenta del mensaje recibido, si la encuentra
 * realiza el registro del mensaje recibido asignándolo al usuario registrado en la aplicación y se realiza el 
 * envío de la notificación a través del socket io específico.
 * 
 * Se espera recibir la siguiente estructura y ejemplo de datos: 
 * {"object":"page", "entry":[{"id":"103063468342065", "time":1458692752478, "messaging":[{"sender":{ "id":"13235324321"},
 *  "recipient":{"id":"103063468342065"}, "message": "TEST_MESSAGE"}]}]}
 * 
 * @param {} req 
 * @param {*} res 
 */
const postHookFacebook = async (req, res) => {
    console.log('hookFacebook ' + JSON.stringify(req.body));

    let objRespuesta = {
        "MessageId":"",
        "Message":"",
        "Client":"",
        "User":"",
        "ConversationName":"",
        "SocialNetwork":config.messageNetworkFacebook,
        "MessageType":config.messageTypeInbound,
        "Time": Date.now
    }

    // Verificar si el evento proviene del pagina asociada
    if (req.body.object == "page") {
        // Si existe multiples entradas entradas
        for (const entry of req.body.entry) {
            // Iterara todos lo eventos capturados
            for (const event of entry.messaging) {
                if (event.message && !event.message.is_echo) {
                    const result = await daoMongo.createMessage(event.sender.id, event.sender.id, event.recipient.id, event.message.text, config.messageTypeInbound, config.messageNetworkFacebook, null);
                    console.log("ID Facebook: " + event.recipient.id);
                    console.log("result " + JSON.stringify(result));
                    const account = await daoMongo.getAccountByIdNetwork(event.recipient.id, config.messageNetworkFacebook);
                    const lastmessage = await daoMongo.getLastMessageByAccountIdAndClient(account.UserId, event.sender.id);

                    objRespuesta.Message = event.message.text;
                    objRespuesta.User = event.recipient.id;
                    objRespuesta.Client = event.sender.id;
                    objRespuesta.ConversationName = lastmessage.ConversationName;
                    objRespuesta.MessageId = event.sender.id;                    

                    //Emitir el mensaje por SocketIO
                    require('../index').emitMessage(objRespuesta, account.SocketId);
                } else {
                    console.log('No hay cuenta registrada ' + event.recipient.id);
                }
            }
        }
        res.sendStatus(200);
    }
}

/**
 * Función para retornar el conjunto de contactos de una cuenta junto con el ultimo mensaje recibido
 * 
 * @param {*} req 
 * @param {*} res 
 */
const contactmessagesController = async (req, res) => {
    let userId = req.user;

    if (!userId) {
        res.status(404).json('usuario no encontrado!');
    }
    else {
        try {
            const contacts = await daoMongo.getContacts(userId);
            res.status(200).send(contacts);
        } catch (error) {
            res.status(404).json({ error: error.toString() });
        }
    }
}

const messagesController = async (req, res) => {    
    userAccountId = req.params.useraccountid; 
    client = req.params.client;
    socialNetwork = req.params.socialnetwork;

    try {
        const messages = await daoMongo.getMessagesByClient(userAccountId, client, socialNetwork);
        res.status(200).json(messages);
    } catch (error) {
        res.status(404).json({ error: error.toString() });
    }
}

const chatnewController = (req, res) => {
    res.render('chatnew');
}

/**
 * Función para retornar los datos de la cuenta segun el usuario
 * 
 * @param {*} req 
 * @param {*} res 
 */
const useraccountController = async (req, res) => {
    let userId = req.user;

    if (!userId) {
        res.status(404).json('usuario no encontrado!');
    }
    else {
        try {
            const Account = await daoMongo.getAccount(userId);
            res.status(200).send(Account);
        } catch (error) {
            res.status(404).json({ error: error.toString() });
        }
    }
}

/**
 * Función para cambiar el nombre de una conversación. Ponerle un nombre "amigable"
 * 
 * @param {*} req 
 * @param {*} res 
 */
const conversationnameController = async (req, res) => {    
    userId = req.params.userid; 
    client = req.params.clientaccountid;
    conversationName = req.params.conversationname;

    try {
        const messages = await daoMongo.setConversationNameByUserId(userId, client, conversationName);
        res.status(200).json(messages);
    } catch (error) {
        res.status(404).json({ error: error.toString() });
    }
}

module.exports = { indexController, chatController, postHookWhatsapp, getHookFacebook, postHookFacebook, contactmessagesController, messagesController, chatnewController, useraccountController, conversationnameController }

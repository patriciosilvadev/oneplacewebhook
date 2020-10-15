// Require express and body-parser
const express = require("express")
  , http = require('http');
const bodyParser = require('body-parser')


// Initialize express and define a port
const app = express()
const PORT = process.env.PORT || 8080;

var server = http.createServer(app); 
var io = require('socket.io').listen(server); 

io.set('origins', '*:*'); 

const qs = require("querystring");
const MessagingResponse = require('twilio').twiml.MessagingResponse;


// Tell express to use body-parser's JSON parsing

app.use(function(req, res, next) { 
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*'); 
  res.header('Access-Control-Allow-Credentials', 'true'); 
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE'); 
  res.header('Access-Control-Expose-Headers', 'Content-Length'); 
  res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range'); 
  if (req.method === 'OPTIONS') { 
  return res.send(200); 
  } else { 
  return next(); 
  } 
}); 


// Start express on the defined port
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))


app.use(bodyParser.json())

app.get("/", (req, res) => {
    //res.status(200).send({ message: 'Get utilizado.' })
    res.sendFile("index.html", { root: __dirname });
})

app.get("/chat", (req, res) => {
  //res.status(200).send({ message: 'Get utilizado.' })
  res.sendFile("index2.html", { root: __dirname });
})

app.post("/hookWhatsapp", (req, res) => {
  const formValues = qs.parse(req.body);

  const twiml = new MessagingResponse();
  twiml.message('You said: ' + formValues.Body);

  console.log(formValues);
  console.log(JSON.stringify(req.body))
  io.sockets.emit('message', req.Body)

  res.status(200).send({body: twiml.toString(),
    headers: { 'Content-Type': 'application/xml' },
    isRaw: true
  });
  
  
  
})


const accountSid = process.env.TWILIO_ACCOUNT_ID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

io.on('connection', function (socket) { 
  socket.on('message', function (data) { 
    client.messages.create({
     body: data,
     from: 'whatsapp:+14155238886',
     to: 'whatsapp:+573164911001'
   }).then(message => console.log(message.sid));
  }); 
});

/*var clients = 0;
io.on('connection', function(socket) {
  console.log('A user connected');

  //Send a message when 
  setTimeout(function() {
     //Sending an object when emmiting an event
     socket.emit('testerEvent', { description: 'A custom event named testerEvent!'});
  }, 4000);

  socket.on('clientEvent', function(data) {
    console.log(data);
 });

 clients++;
 io.sockets.emit('broadcast',{ description: clients + ' clients connected!'});
 socket.emit('newclientconnect',{ description: 'Hey, welcome!'});
   socket.broadcast.emit('newclientconnect',{ description: clients + ' clients connected!'})
   socket.on('disconnect', function () {
      clients--;
      socket.broadcast.emit('newclientconnect',{ description: clients + ' clients connected!'})
   });
});*/
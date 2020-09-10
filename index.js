// Require express and body-parser
const express = require("express")
const bodyParser = require("body-parser")

// Initialize express and define a port
const app = express()
const PORT = process.env.PORT || 8080;

// Tell express to use body-parser's JSON parsing
app.use(bodyParser.json())

// Start express on the defined port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))


app.use(bodyParser.json())

app.get("/", (req, res) => {
    res.status(200).end({ message: 'Get utilizado.' })
})

app.post("/hook", (req, res) => {
  console.log(req.body) // Call your action on the request here
  res.status(200).end({ message: 'Post recibido.' }) // Responding is important
})

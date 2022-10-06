require('dotenv').config()
const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")
app.use(express.json()) // server can now accept json

const mountRoutes = require("./routes")
mountRoutes(app) // mount the routes... 



const posts = [
    {
        username: "username1",
        title: "Post1"
    },
    {
        username: "username2", 
        title: "Post2"
    },
    {
        username: "username3",
        title: "Post3"
    }
]

app.get("/posts",authenticateToken, (req, res) => {
    console.log(`req.user.name: ${req.user.name}`)
    res.json(posts.filter(post => post.username === req.user.name))
})

// middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"] // header with format Bearer TOKEN 
    //const token = authHeader && authHeader.split(" ")[1] // TOKEN part of the header... or return undefined if doesn't exist
    // for some reason the authHeader doesn't have format "Bearer TOKEN"
    const token = authHeader
    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        console.log("jwt callback in authenticateToken middleware. user: ")
        console.log(user)
        req.user = user // change request object
        next()
    })
}



app.listen(3000)
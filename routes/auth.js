require('dotenv').config()
const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")
const db = require('../db')
app.use(express.json()) // server can now accept json
const router = express.Router()
module.exports = router


const getUserFromDB = async (username) => {
    querytext = "SELECT * FROM bruger WHERE username=$1"
    queryvals = [username]
    const res = await db.query(querytext, queryvals)
    return res["rows"][0]
}
const insertRefreshToken = async (refreshToken) => {
    const res = await db.query("INSERT INTO refreshtoken VALUES ($1)", [refreshToken])
    return res
}
const refreshTokenExists = async (refreshToken) => {
    const res = await db.query("SELECT * FROM refreshtoken WHERE refreshtoken=$1", [refreshToken])
    return (res.rows[0] ? true : false) // returns true if refreshToken exists, false otherwise.
}

router.get("/", async (req, res) => {
    try {
        const qRes = await getUserFromDB("jaro")
        res.json({msg: qRes})
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})
// get new accesstoken
router.post("/token", async (req,res) => {
    const refreshToken = req.body.token
    if (refreshToken === null) return res.sendStatus(401)
    const isValid = await refreshTokenExists(refreshToken)
    console.log(`refreshToken: ${refreshToken} isValid: ${isValid}`)
    if (!isValid)  return res.sendStatus(403)
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        const accessToken = generateAccessToken({name: user.name})
        res.json({accessToken: accessToken})
    })
})
router.post("/login", async (req, res) => {
    let user
    try {
        user = await getUserFromDB(req.body.name)
    } catch (e) {
        console.log(e)
    }
    if (!user) {
        return res.status(400).send("Cannot find user")
    }
    try {
        if(await bcrypt.compare(req.body.password, user.password)) {
            const username = {name: user.username}
            const accessToken = generateAccessToken(username)
            const refreshToken = jwt.sign(username, process.env.REFRESH_TOKEN_SECRET)
            insertRefreshToken(refreshToken)
            res.json({ accessToken: accessToken, refreshToken: refreshToken})
        } else {
            res.send("Not allowed.")
        }
    } catch (error){
        res.status(500).send(`error: ${error}`)
    }
})

function generateAccessToken(userName) {
    return jwt.sign(userName, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "60m"}) // gen secret in node: require("crypto").randomBytes(64).toString('hex')
}
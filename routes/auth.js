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
// HOW TO DELETE THE REFRESHTOKEN? post to /auth/token with some additional header or smth? 
const sendRefreshToken = (res, token) => {
    console.log("sendRefreshToken()")
    /* res.cookie("jrt", token, {
        httpOnly: true,
        path: "/auth/token"
    }); */
    res.cookie("jrt", token, {
        path: "/auth/token"
    });
};

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
    let refreshToken = null
    try {
        refreshToken = req.cookies.jrt; // get refresh token from jrt cookie
    } catch (e) {
        console.log("SMTH WRONG GETTING REFRESHTOKENCOOKIE")
        console.log(e)
        refreshToken = null
    }
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
    const decPayload = Buffer.from(req.body.up, "base64").toString("ascii") // TODO maybe should be utf-8?
    username_password = decPayload.split(".") // index 0 username, index 1 password
    let user
    try {
        user = await getUserFromDB(username_password[0])
    } catch (e) { 
        console.log(e)
    }
    if (!user) {
        return res.status(400).send("Cannot find user")
    }
    try {
        if(await bcrypt.compare(username_password[1], user.password)) {
            const accessToken = generateAccessToken(user.username)
            const refreshToken = jwt.sign({name:user.username}, process.env.REFRESH_TOKEN_SECRET)
            insertRefreshToken(refreshToken)
            console.log("/login route, sendRefreshToken ... ")
            sendRefreshToken(res, refreshToken)
            console.log(res.cookies)
            res.json({ accessToken: accessToken})
        } else {
            res.send("Not allowed.")
        }
    } catch (error){
        res.status(500).send(`error: ${error}`) 
    }
})

// TODO BUG sometimes generates the same jwt, and then db throws error because they're supposed to be unique. 
function generateAccessToken(userName) { 
    return jwt.sign({name:userName}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "30m"}) // gen secret in node: require("crypto").randomBytes(64).toString('hex')
}
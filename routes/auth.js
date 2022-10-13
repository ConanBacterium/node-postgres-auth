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


/*  
             THIS WORKS WHEN CLIENT DOES REQUEST LIKE THIS !!!!!!!!!!!!!!!!
            fetch(LOGINSERVERURL, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                "Access-Control-Allow-Credentials": "true",
            },
            credentials: 'include',
            body: JSON.stringify(encPayload)
        }) */
// HOW TO DELETE THE REFRESHTOKEN? post to /auth/token with some additional header or smth? 
// https://expressjs.com/en/api.html#res.clearCookie
// res.clearCookie("jrt") ought to do the job 
// // https://stackoverflow.com/questions/46288437/set-cookies-for-cross-origin-requests
const sendRefreshToken = (res, token) => {
    console.log("sendRefreshToken()")
    console.log(`token: ${token}`)
    res.cookie("jrt", token, {
        httpOnly: true,
        path: "/auth/token", // so only visible to /auth/token 
        secure: true, // NEEDS TO BE SET TO TRUE WHEN sameSite: NONE
        sameSite: 'None', 
    }); 
};

router.get("/", async (req, res) => {
    try {
        const qRes = await getUserFromDB("testuser")
        res.json({msg: qRes})
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})
// get new accesstoken
router.post("/token", async (req,res) => {
    console.log("/token post route")
    console.log(req.cookies.jrt)
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
        console.log("/token sending json accessToken: accessToken")
        const payload = {accessToken: accessToken}
        console.log(payload)
        res.json(payload)
    })
})
// https://stackoverflow.com/questions/46288437/set-cookies-for-cross-origin-requests
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
            /* const accessToken = generateAccessToken(user.username) */
            const refreshToken = jwt.sign({name:user.username}, process.env.REFRESH_TOKEN_SECRET)
            insertRefreshToken(refreshToken)
            console.log("/login route, sendRefreshToken ... ")
            sendRefreshToken(res, refreshToken)
            console.log(`req.headers.origin: ${req.headers.origin}`)
            res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
            res.header('Access-Control-Allow-Credentials', true);
            res.send("Cookie is set ?")
            /* res.json({ accessToken: accessToken}) */
        } else {
            res.status(403).send("Not allowed.")
        }
    } catch (error){
        console.log("error at auth/login")
        res.status(500).send(`error: ${error}`) 
    }
})

// TODO BUG sometimes generates the same jwt, and then db throws error because they're supposed to be unique. 
function generateAccessToken(userName) { 
    return jwt.sign({name:userName}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "30m"}) // gen secret in node: require("crypto").randomBytes(64).toString('hex')
}
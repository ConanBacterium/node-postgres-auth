const auth = require("./auth")


module.exports = app => {
    app.use("/auth", auth)
    // put all routes here like this... 
  }
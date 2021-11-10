const jwt = require("jsonwebtoken");
const kwartengConfig = require("../config.js");
const db =require("../dbConnectExec.js");
const auth = async (req, res, next) => {
//   console.log("in the middleware", req.header("Authorization"));
//   next();
try {
    //1.decode token 

    let myToken = req.header("Authorization").replace("Bearer ", "");
    // console.log("token", myToken);
    let decoded = jwt.verify(myToken, kwartengConfig.JWT);
    console.log(decoded);

    let guestPK = decoded.pk;
    
    //2.compare token with database

    let query = `SELECT GuestPK, NameFirst, NameLast,Email

    From Guest
    WHERE GuestPK = ${guestPK} and Token = '${myToken}'`;

    let returnedUser = await db.executeQuery(query);
    console.log("returned User",returnedUser);

    //3.save user information in the request
    if(returnedUser[0]){
        req.guest = returnedUser[0];
        next();
    }else{
        return res.status(401).send("Invalid credentials");
    }
}
catch (error) {
    console.log(error);
    return  res.status(401).send("Invalid credentials");
    }
}

module.exports = auth; 

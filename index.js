const db = require("./dbConnectExec.js");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const kwartengConfig = require('./config.js');
const auth = require('./middleware/authenticate');
const cors = require("cors");

const app = express();
app.use(express.json());

//azurewebsites.net, colostate.edu
app.use(cors())

const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{console.log(`app is running on port ${PORT}`)});

app.get("/hi",(req,res)=>{res.send("Hello World")});

app.get("/",(req,res)=>{res.send("API is running")});

app.get("/reviews/me", auth, async(req,res)=> {
    //1. get the GuestPK
    let guest =  req.guest.GuestPK;
    // console.log("here is the guest",guest)
    //2. query the database for user's record
    //3. Send users reviews back to them

    let userQuery = `SELECT ReviewPK, Summary, Rating, HotelFK, HotelName, GuestFK
    FROM Review
    LEFT JOIN Hotel
    ON Hotel.HotelPK = Review.HotelFK
	Where GuestFK = ${guest};`;


   db.executeQuery(userQuery).then((result)=>{
        if(result[0]){
            res.send(result);
        }else{
            res.status(404).send(`bad request`);
        }
    })
    .catch((err)=>{
        console.log("Error in /reviews/:pk", err);
        res.status(500).send();
    });
  
 
    });

    


    app.post("/guests/logout", auth, (req,res)=>{
    let query = `UPDATE Guest
    SET Token = NULL
    WHERE GuestPK = ${req.guest.GuestPK}`;

    db.executeQuery(query)
    .then(()=>{res.status(200).send()})
    .catch((err)=>{
        console.log("error in POST /guests/logout", err)
        res.status(500).send();
    })
})

app.post("/reviews", auth, async (req,res)=>{
    try { 
        let hotelFK = req.body.HotelFK;
        let summary = req.body.Summary;
        let rating = req.body.Rating;

        if(!hotelFK || !summary || !rating || !Number.isInteger(rating)){
            return res.status(400).send("bad request")};
        
      summary = summary.replace("'", "''");  
    //   console.log("summary", summary);   
    // console.log("here is the guest",req.guest.GuestPK);

    let insertQuery = `INSERT INTO Review(Rating, Summary, HotelFK, GuestFK)
    OUTPUT inserted.ReviewPK, inserted.Summary, inserted.Rating, inserted.HotelFK
    VALUES('${rating}','${summary}','${hotelFK}','${req.guest.GuestPK}')`;

    let insertedReview = await db.executeQuery(insertQuery);
    // console.log("inserted Review", insertedReview);
      
      res.status(201).send(insertedReview[0]);
        
    } catch (error) {
        console.log("error in POST /reviews", error)
        res.status(500).send();
    }
})

app.get("/guests/me",auth,(req,res)=>{
    res.send(req.guest)
})

app.post("/guests/login", async (req,res)=>{
  // console.log("/guests/login called", req.body);

  //1. data validation
    let email = req.body.email;
    let password = req.body.password;

    if(!email || !password)
    {
        return res.status(400).send("Bad request");
    }
  //2. check that user exist in DB
    let query = `SELECT * 
    FROM Guest
    WHERE Email = '${email}'`

    let result;
   
    try{
        result = await db.executeQuery(query)
    }catch(myError){
        console.log("Error in /guest/login", myError);
        return res.status(500).send();
    }
    //  console.log("result", result);

     if(!result[0]){return res.status(401).send("Invalid user credential")}


  //3. check password

    let user = result[0];

    //**** */ASK PROFESSOR ABOUT HASH PROBLEM

    if(!bcrypt.compareSync(password, user.Password)){
        console.log("Invalid password");
        return res.status(401).send("Invalid user crendentials");
    }

  //4.generate a token
    let token = jwt.sign({pk:user.GuestPK},kwartengConfig.JWT,{expiresIn: "60 minutes"});
    console.log("token", token);

  //5.save token in DB and generate a response
    let setTokenQuery = `UPDATE Guest
    SET Token = '${token}'
    WHERE GuestPK = ${user.GuestPK}`;

try{
    await db.executeQuery(setTokenQuery);

    res.status(200).send({
        token: token,
        user:{
            NameFirst: user.NameFirst,
            NameLast: user.NameLast,
            Email : user.Email,
            GuestPK: user.GuestPK
        }
    });
}
catch(myError){
    console.log("Error in setting user token", myError);
    res.status(500).send()
}

})

app.get("/rooms", async (req,res)=>{ 
    db.executeQuery(
      //get the data from the database
      `select * 
        FROM Room
        left join Hotel
        on Hotel.HotelPK = Room.HotelFK`
    )
    .then((theResults)=>{res.status(200).send(theResults)
    })
    .catch((myError)=>{
        console.log(myError);
        res.status(500).send()
    });   
});

app.get("/rooms/:pk",(req, res)=>{ 
    let pk = req.params.pk
    // console.log(pk);

    let myQuery = `select * 
    FROM Room

    left join Hotel
    on Hotel.HotelPK = Room.HotelFK

    where RoomPK = ${pk}`;

db.executeQuery(myQuery)
.then((result)=>{
    // console.log("result",result);
    if(result[0]){
        res.send(result[0]);
    }else{
        res.status(404).send(`bad request`);
    }
})
.catch((err)=>{
    console.log("Error in /rooms/:pk",err);
    res.status(500).send();
});
});

app.post("/guests", async (req, res)=>{
    // res.send("/contacts called");
// console.log("request body", req.body);
let NameFirst =  req.body.NameFirst;
let NameLast = req.body.NameLast;
let Email = req.body.Email;
let Phone = req.body.Phone;
let password = req.body.Password;

if(!NameFirst || !NameLast || !Email ||!Phone || !password){return res.status(400).send("Bad request")}

NameFirst = NameFirst.replace("'","''");
NameLast = NameLast.replace("'", "''");

let emailCheckQuery = `select Email
from guest
where Email = '${Email}'`;

let existingUser = await db.executeQuery(emailCheckQuery);
console.log("existing user", existingUser);

if(existingUser[0]){
    return res.status(409).send("Duplicate email")};

let hashedPassword = bcrypt.hashSync(password); 



let insertQuery = 
`INSERT INTO Guest(NameFirst,NameLast, Email, Phone, Password)
VALUES('${NameFirst}','${NameLast}','${Email}','${Phone}','${hashedPassword}')`;

db.executeQuery(insertQuery)
.then(()=>{res.status(201).send()})
.catch((err)=>{
    console.log("Error in Post /Guest", err);
    res.status(500).send();
})

})
// app.put()

const db = require("./dbConnectExec.js");
const express = require("express");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());

app.listen(5000,()=>{console.log(`app is running on port 5000`)});

app.get("/hi",(req,res)=>{res.send("Hello World")});

app.get("/",(req,res)=>{res.send("API is running")});

app.get("/rooms",(req,res)=>{ 
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

const db = require("./dbConnectExec.js");
const express = require("express");

const app = express();

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

// app.post()
// app.put()

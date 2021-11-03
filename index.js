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

// app.post()
// app.put()

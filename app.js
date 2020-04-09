const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const bodyParser=require("body-parser")
const multer = require('multer');
const Grid= require('gridfs-stream');
const methodoverride=require("method-override");
const crypto = require('crypto');
const path = require('path');
const GridFsStorage = require('multer-gridfs-storage'); //this package is to store uploaded files into mongodb

const app=express();
app.use(bodyParser.json());
app.set('view engine','ejs');
app.use(methodoverride('_method'));//we  need to make a query string when we make delete from our forms
//mongo URI
const mongoURI= "mongodb://localhost:27017/upload";
//Create mo ngo connection
const conn=mongoose.createConnection(mongoURI);
//Init gridfs
let gfs;
conn.once('open',function(){
  //Init stream
gfs = Grid(conn.db, mongoose.mongo);
gfs.collection("uploads");
});
//create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

//loads forms

app.get("/",function(req,res){
  gfs.files.find().toArray(function (err, files) {
    if (!files || files.length === 0) {
      res.render("index",{files:false});
    }else {
      files.map(file=>{
        if(file.contentType==='image/jpeg' || file.contentType==="image/png")
      {
        file.isImage=true;

      }
      else{
        file.isImage=false;
      }
      });
      res.render("index",{files:files});
    }
  } );

});
// POST  /uploads
//uploads files to DATABASE
app.post("/upload",upload.single('file'),function (req,res) {
  // res.json(req.file);
  res.redirect("/");
  });
  // get all files by get request
  //display all files in json
  app.get("/files",function(req,res){
    gfs.files.find().toArray(function(err,files){
      if(err||files.length===0){
      res.status(404).json({
        err:"NO FILE EXIST"
      })
      }
      else{
        res.json(files);
      }
    }
    )
  })
//@route get /files/:filename

app.get("/files/:filename", function (req, res) {
  gfs.files.findOne({filename:req.params.filename},function (err, files) {
    if (err || files.length === 0) {
      res.status(404).json({
        err: "NO FILE EXIST"
      })
    }
    else {
      res.json(files);
    }
  }
  );
});
//@route get/file/image/filename
//@desc display images

app.get("/images/:filename", function (req, res) {
  gfs.files.findOne({ filename: req.params.filename }, function (err, files) {
    if (err || files.length === 0)
    {
      res.status(404).json(
        {
        err: "NO FILE EXIST"
        }
        );
    }

      //check if image
      if(files.contentType==="image/jpeg" ||files.contentType==="img/png")
      {
        //read the output .create read stream
        var readstream = gfs.createReadStream(files.filename);
        readstream.pipe(res);

      }
      else
        {
        res.status(404).json({ err: "No image file exist or it is not a image file"});
        }

      }
  );
});



app.listen(3000,function(){
  console.log("server started on port 3000");
});

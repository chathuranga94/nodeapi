var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

var mongoose = require('mongoose');
//mongoose.connect('mongodb://localhost:27018/final');
mongoose.connect('mongodb://104.236.206.83:27018/data');
//mongoose.connect('mongodb://admin:aqua@ds051738.mongolab.com:51738/aqua');
    

mongoose.set('debug', true);


var schema = mongoose.Schema({
      NIC : { type: Number, index: true },
      FirstName : String,
      LastName : String,
      Balance : Number,
      DueDate : Date,
      Area : String,
      Group : { type: String , index: true },
      Trans : Array
})

var user = mongoose.model('user',schema);

////////////////////////////////////////////////////////////////////////////////////

app.post('/adduser', function (req, res) {
  
  var add = new user({
      NIC : parseInt(req.body.id),
      FirstName : req.body.first,
      LastName : req.body.last,
      Balance : parseInt(req.body.amount) ,
      DueDate : new Date(req.body.date),
      Area : req.body.area,
      Group : req.body.gid,
  });

  add.save(function (err) {
    if (err) // ...
    console.log('done')
    res.end('Done')
  });
});
  
 
////////////////////////////////////////////////////////////////////////////////////

app.post('/transaction', function (req, res) {
  
     var bal ;
  
    console.log(user.Balance);
    
    user.findOne({ 'NIC': req.body.id }, 'DueDate Balance', function (err, user) {
      bal = user.Balance;
      bal = bal - req.body.amount;
      update();
    });
  
  
  function update(){
    
    user.update({ 'NIC' : req.body.id },{
      $set : {
          DueDate : new Date(req.body.due),
          Balance : bal,
      },
      $push: {
          'Trans': {
                amount: req.body.amount,
                date: new Date( req.body.date ),
                officer : req.body.code  
                   }
            }
    },function(err, store) {});
    
    console.log("f");
    res.json("Done");
     
  } 
    
    
     
      
});

////////////////////////////////////////////////////////////////////////////////////

app.get('/find/:id', function(req, res){
   
  user.findOne({ 'NIC': req.params.id }, 'NIC FirstName LastName Area  Group DueDate', function (err, user) {

    if (err) return handleError(err);
  
    res.json({
        First : user.FirstName,
        Last : user.LastName,
        Area : user.Area,
        Group : user.Group,
        DueDate : user.DueDate      
    });
  })
});

///////////////////////////////////////////////////////////////////////////////////


app.get('/delete/:id', function(req, res){
    user.findOne({ 'NIC': req.params.id }).remove().exec();
    res.end('Deleted');
});


////////////////////////////////////////////////////////////////////////////////////


app.get('/deletegroup/:gid', function(req, res){
    user.find({ 'Group': req.params.gid }).remove().exec();
    res.end('Deleted');
});

//////////////////////////////////////////////////////////////////////////////////////


///////////////////UPDATE / edit

/////////////////////////////////////////////////////////////////////////////////////

app.get('/groupinfo/:id', function(req, res){
  
    user.find({'Group' : req.params.id  }, 'NIC Name Area DueDate Balance -_id', function (err, users) {
       res.json(users);
  })
  
});

///////////////////////////////////////////////////////////////////////////////////



app.get('/users', function(req, res){
   
  user.find({}, 'NIC Name Area DueDate Balance -_id', function (err, users) {     
   res.json(users);
   
  })
});

/////////////////////////////////////////////////////////////////////////////////


app.get('/findtrans/:id', function (req, res) {

    user.findOne({ 'NIC': req.params.id }, function (err, user) {

    if (err) return handleError(err);
    
        //var lasttwo = user.Trans.slice(-2);
        //console.log(user.Trans);
        //res.json(lasttwo);
        res.json(user.Trans);
    })      
    
});

////////////////////////////////////////////////////////////////////////////////

app.get('/group.summary', function(req, res){
  user.aggregate(
        { $group: {
            _id: "$Group",
            number : { $sum : 1},
            balance: { $sum: "$Balance"  }
        }}
    , function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        console.log(result);
        res.json(result);
    }); 
});



/////////////////////////////////////////////////////////////////////////////


app.get('/recent', function (req, res) {
      
      var now = new Date();
      var cutoff = new Date();
      cutoff.setDate(now.getDate()+7);
     
      user.find({DueDate : {"$gte": now , "$lt": cutoff }}, function (err, user) {
          if (err) return handleError(err);
              res.json(user);
      })   
});

////////////////////////////////////////////////////////////////////////////

var schema2 = mongoose.Schema({
      ID : { type: Number, index: true },
      FirstName : String,
      LastName : String,
      Description : String,
      Email : String,
      Password : String,
})

var officer = mongoose.model('officer',schema2);


app.post('/addofficer', function (req, res) {
  
  var add = new officer({
      ID : parseInt(req.body.id),
      FirstName : req.body.first,
      LastName : req.body.last,
      Description : req.body.dis,
      Email : req.body.email,
      Password : req.body.pass,
  });

  add.save(function (err) {
    if (err) // ...
    console.log('done')
    res.end('Done')
  });
});






















var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
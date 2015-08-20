var express = require('express');
var app = express();
var bcrypt = require('bcrypt-nodejs');

var bodyParser = require('body-parser');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

var mongoose = require('mongoose');
//mongoose.connect('mongodb://localhost:27018/final');
mongoose.connect('mongodb://104.236.206.83:27018/present');
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
      Address : String,
      Telephone : String,
      ProductID : String,
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
      Address : req.body.address ,
      ProductID : req.body.product , 
      Telephone : req.body.tel
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
    
    user.findOne({ 'NIC': req.body.id }, 'DueDate Balance', function (err, user) {
      if(!user){ res.json({ end : 0 }); }
      else{
      bal = user.Balance;
      bal = bal - req.body.amount;
      update();
      res.json({ end : 1 });}
    });  
  
  function update(){
    user.update({ 'NIC' : req.body.id },{
      $set : {
          DueDate : new Date(req.body.due),
          Balance : bal ,
      },
      $push: {
          'Trans': {
                amount: req.body.amount,
                date: new Date( req.body.date ),
                officer : req.body.code  
                   }
             }
    },function(err, store) {});
       
  }     
      
});

////////////////////////////////////////////////////////////////////////////////////

app.get('/find/:id', function(req, res){
   
  user.findOne({ 'NIC': req.params.id }, 'NIC FirstName LastName Area  Group DueDate Balance Trans Address Telephone ProductID', function (err, user) {

    if (err) return handleError(err);
  
    res.json(user);
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

app.post('/update/:id', function (req, res) {
 
     user.update({ 'NIC' : req.params.id },{
              $set : {
                  FirstName : req.body.first,
                  LastName : req.body.last,
                  Balance : parseInt(req.body.amount) ,
                  DueDate : new Date(req.body.date),
                  Area : req.body.area,
                  Group : req.body.gid,
                  Address : req.body.address ,
                  ProductID : req.body.product , 
                  Telephone : req.body.tel
               }        
     },function(err, store) {});
  
});


/////////////////////////////////////////////////////////////////////////////////////

app.get('/groupinfo/:id', function(req, res){
  
    user.find({'Group' : req.params.id  }, 'NIC FirstName LastName ProductID Area DueDate Balance -_id', function (err, users) {
       res.json(users);
  })
  
});

///////////////////////////////////////////////////////////////////////////////////



app.get('/users', function(req, res){
   
  user.find({}, 'NIC FirstName LastName Area DueDate Balance -_id', function (err, users) {     
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
            productID: { $first: "$ProductID"  },
            area : { $first : "$Area"  },
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

var officerscheme = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  executive : Boolean ,
  description : String,
  telephone : Number,
  firstname : String , 
  lastname : String,
  
  resetPasswordToken: String,
  resetPasswordExpires: Date
})


var officer = mongoose.model('officer',officerscheme);

app.post('/signup', function (req, res) {
  
  var x;
  
  bcrypt.genSalt(5, function(err, salt) {
    bcrypt.hash(req.body.pass, salt, null, function(err, hash) { 
      console.log(hash);
      x = hash;
      update();
    });
   });
  
  
 function update(){
      var add = new officer({
      username : req.body.user,
      email : req.body.mail,
      password : x,
      executive : req.body.status,
      description : req.body.desc,
      telephone : req.body.tel,
      firstname : req.body.first,
      lastname : req.body.last
      });

    add.save(function (err) {
      if (err) // ...
      console.log('done')
      res.end('Done')
    });
 } 
 
});

////////////////////////////////////////////////////////////////////


app.post('/login', function (req, res) {
    var y;
    var candidatePassword = req.body.pass;
    var user2 = req.body.user;
    
  
    officer.findOne({'username' : user2  }, 'password -_id', function (err, user1) {
 
     console.log(candidatePassword);
     console.log(user1.password);  
     y = user1.password;  
     update();
     //res.json(user1);
     });
     
    
     function update(){
          console.log(y);
      
          bcrypt.compare(candidatePassword, y , function(err, isMatch) {
                if (err) {  throw (err); }
                console.log(isMatch);
                
                if(isMatch == true){
                      officer.findOne({'username' : user2  }, 'firstname lastname executive -_id', function (err, user3){
                          res.json({
                              LogIn : 1,
                              First : officer.firstname,
                              Last : officer.lastname,
                              Executive : officer.executive  
                          });
                        
                      
                        }); 
                } else {   res.json({ LogIn : 0 }); }
      
           });
    }   
});


///////////////////////////////////////////////////////////////////////////////////////////////////////



var notifi= new mongoose.Schema({
  Time: Date,
  Info : String
})

var notification = mongoose.model('notifi',notifi);

app.post('/createNotifi', function (req, res) {
  
    var current = new Date();
    current.setHours(current.getHours() + 6);
    
     
    var add = new notification({
      //num : {type: Number, unique: true},
      Time : current,
      Info : req.body.info 
    });
  
    add.save(function (err) {
      if (err) // ...
      console.log('done')
      res.end('Done')
    });
});



app.get('/getNotifi', function(req, res){
  
  notification.find({}, 'Time Info -_id', function (err, notifi) {     
   res.json(notifi);})

});





app.get('/sample', function(req, res){
    var v = 0;
    var x = 1;
    
    if(v==0){
            if(x==1){   res.end("sfa") ; }
            else {console.log("fasaf");}  
    }

});




var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
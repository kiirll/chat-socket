var express = require('express'),
    http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
const port = 88;
server.listen(port,'localhost',function(){
	console.log(`Server running at post ${port}!`);

});

app.get('/', (req,res)=>{
	res.sendFile(__dirname+'/index.html');
});

app.get('/room/:id', (req,res)=>{
  
	res.sendFile(__dirname+'/index1.html');
});

io.on('connection', function(socket){
  //socket.join('room name');
  try{

  socket.on('join', function(channel, ack) {   
    socket.join(channel);
    console.log("join/ channel: "+ channel);
  });
    socket.on('broadcast',  function(data, channel){
    console.log(data);
    console.log(data.nick); 
    
      var {msg,nick,channel} = data;
      
      console.log(msg+" "+channel+" "+nick);
     socket.in(channel).emit('broadcast', msg);
     //io.sockets.emit('chat message', msg);
    });
  }
  catch (error){
    console.log(error);
  }
  });
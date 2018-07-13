var express = require('express')
const app = express();

var io = require('socket.io')(express);

const staticAsset = require('static-asset');
const path = require('path');
const hostname = 'localhost';

const port = 3000;

app.use(staticAsset(path.join(__dirname,'public')));
// console.log(path.join(__dirname,'public'));
app.use(express.static(__dirname + "/public/") );

app.get('/', (req,res)=>{
	res.sendFile(__dirname+'/index.html');
});

// app.set('view engine', 'html');

users = [];
io.on('connection', function(socket) {
    console.log('A user connected');
    socket.on('setUsername', function(data) {
        console.log(data);

        if(users.indexOf(data) > -1) {
            socket.emit('userExists', data + ' username is taken! Try some other username.');
        } else {
            users.push(data);
            socket.emit('userSet', {username: data});
        }
    });

    socket.on('msg', function(data) {
        //Send message to everyone
        io.sockets.emit('newmsg', data);
    })
});

	  
app.listen(port,hostname,function(){
	console.log(`Server running at post ${port}!`);
});


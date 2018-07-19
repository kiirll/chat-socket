var express = require("express");
var http = require("http");
const models = require("./models/index");
const mongoose = require("mongoose");
require("dotenv").config();
var app = express();
var server = http.createServer(app);
var io = require("socket.io").listen(server);
const conStringMongo = process.env.MONGO_URL;

const port = process.env.PORT;
server.listen(port, function() {
  console.log(`Server running at post ${port}!`);
});
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/templates/index.html");
});

app.get("/room/:id", (req, res) => {
  res.sendFile(__dirname + "/templates/room.html");
});

mongoose.connection
  .on("error", error => console.log(error))
  .on("close", () => console.log("Database connection closed."))
  .once("open", () => {
    const info = mongoose.connections[0];
    console.log(`Connected to ${info.host}:${info.port}/${info.name}`);
    // require('./mocks')();
  });
mongoose.connect(
  conStringMongo,
  { useNewUrlParser: true }
);

var clients = [];

io.on("connection", function(socket) {
  //socket.join('room name');
  try {
    var currentRoomId;
    socket.on("join", async function(joindata, ack) {
      socket.join(joindata.channel);
      console.log(
        "join/ channel: " + `${joindata.channel}| nick: ${joindata.id}`
      );
      clients.push(socket.id);
      socket.name = joindata.id;
      currentRoomId = joindata.channel;
      // console.log(io.sockets);

      const Chat = await models.Chat.findOne({
        name: joindata.channel
      });

      if (Chat) {
        //allMessage нужно сделатьвытягивание всех сообщений из бд
        const allMessage = await models.Message.find({
          chat: Chat.id
        })
          .limit(100)
          .sort({ createdAt: -1 });
        const count = await models.Message.countDocuments({
          chat: Chat.id
        });
        var data = {
          count,
          allMessage
        };
        // console.log(allMessage);
        socket.emit("oldMessage", data);
      }
    });

    // Loading more messages to the chat
    socket.on("moreMsg", async data => {
      var { chat, skip } = data;
      console.log(skip);
      const Chat = await models.Chat.findOne({
        name: chat
      });
      const moreCount = await models.Message.countDocuments({
        chat: Chat.id
      })
        .sort({ createdAt: -1 })
        .skip(skip * 100);
      const moreMsg = await models.Message.find({
        chat: Chat.id
      })
        .sort({ createdAt: -1 })
        .skip(skip * 100)
        .limit(100);

      var res = {
        last: moreCount,
        moreMsg
      };
      socket.emit("moreMsgFr", res);
    });

    socket.on("getListChats", async () => {
      const listChats = await models.Chat.find().sort({ createdAt: -1 });
      socket.emit("listChats", listChats);
    });

    socket.on("broadcast", async function(data, channel) {
      // console.log(data);
      // console.log(data.nick);

      var { msg, nick, channel } = data;

      // console.log(msg+" "+channel+" "+nick);

      if (data.msg == "пошел нах") {
        data.msg = "сам иди туда";
        data.nick = "system";
        socket.emit("broadcast", data);
        return false;
      }
      try {
        const chatName = await models.Chat.findOne({
          name: channel
        });
        // console.log(`chatName ${chatName}`);
        if (chatName) {
          const mess = await models.Message.create({
            text: msg,
            author: nick,
            chat: chatName.id
          });
          // console.log(mess);
        } else {
          const newChat = await models.Chat.create({
            name: channel
          });
          const mess = await models.Message.create({
            text: msg,
            author: nick,
            chat: newChat.id
          });

          // console.log(mess);
        }
      } catch (error) {
        console.log(error);
      }

      io.sockets.in(data.channel).emit("broadcast", data);
    });

    socket.on("getClients", () => {
      io.emit("listClients", getClients());
    });

    socket.on("disconnect", function() {
      // console.log(io.sockets.adapter.rooms);
      console.log("Got disconnect!");
      console.log(socket.id);
      var data = {};

      var disconName;
      for (var s in io.sockets.sockets) {
        if (io.sockets.sockets[s] == socket.id);
        disconName = io.sockets.sockets[s].name;
      }
      console.log("disconName " + disconName);
      data.name = disconName;
      console.log(`currentRoomId: ${currentRoomId}`);
      io.sockets.in(currentRoomId).emit("unjoin", data);

      //clients.splice(clients[''].indexOf(socket.id), 1);
      // io.sockets.in(data.channel).emit("listClients",getClients());
    });
  } catch (error) {
    console.log(error);
  }
});

function getClients() {
  let list = [];
  // console.log( io.sockets.sockets);
  for (var s in io.sockets.sockets) {
    // console.log("SOKEEEEET!!!");
    // console.log(io.sockets.sockets[s].name);
    list.push(io.sockets.sockets[s].name);
  }
  return list;
}

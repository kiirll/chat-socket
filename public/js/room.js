$(function() {
  var id;
  if (Cookies.get("idNick")) {
    id = Cookies.get("idNick");
  } else {
    id = Math.floor(Math.random() * 1000000) + 1000;
    Cookies.set("idNick", id);
  }
  var moreMessage = 1;
  var divMessages = $("#messages");

  $("#m").emojiPicker({
    height: "300px",
    width: "200px",
    onShow: function(picker, settings, isActive) {
      picker.css("top", "");
    }
  });
  // $('#m').css('width',"");
  $("#changeNick").on("click", () => {
    $("#changeNickWindow").show(200);
  });
  $(".btnSaveNewNick").on("click", () => {
    $("#changeNickWindow").hide(200);
    if (
      $('input[name="newNick"]')
        .val()
        .trim() != ""
    ) {
      var newNick = $('input[name="newNick"]').val();
      $('input[name="newNick"]').val("");
      Cookies.set("idNick", newNick);
      $("#idNick").html(newNick);
      id = newNick;
    }
  });

  $("#idNick").html(id);
  var socket = io();
  var url = document.URL;
  var tmp = url.indexOf("room");
  var roomid = url.substring(tmp + 5);
  var channel = roomid;
  $("#title-chat").text(`Chat #${roomid}`);

  //Join in room

  var joindata = {
    channel,
    id
  };
  socket.emit("join", joindata, function() {
    console.log("joined: " + channel);
  });
  socket.emit("getClients");

  socket.on("listClients", data => {
    console.log(data);
    $("#listRoom").empty();
    for (var item in data) {
      $("#listRoom").append(
        $('<div class="badge badge-pill badge-success">').html(`${data[item]}`)
      );
    }
  });

  $("#messages").delegate(".moreMsg", "click", function() {
    $(this).remove();
    var data = {
      chat: channel,
      skip: moreMessage
    };
    socket.emit("moreMsg", data);
  });

  socket.on("moreMsgFr", data => {
    console.log(data);
    var { last, moreMsg } = data;
    data = moreMsg;
    for (var item in data) {
      var selfmes, selfnick;
      if (data[item].author == Cookies.get("idNick")) {
        selfmes = 'class="selfmess"';
        selfnick = "";
      } else {
        selfmes = "";
        selfnick = `<span class="chatNick"> ${data[item].author}</span>, `;
      }
      var time = new Date(data[item].createdAt);
      var date = time.toLocaleDateString() + " " + time.toLocaleTimeString();

      $("#messages").prepend(
        $(`<div ${selfmes}>`).html(
          `<div class="timemess">${selfnick}${date}</div><div class="div-mess"> <span class="mes">${
            data[item].text
          }</span><div>`
        )
      );
      divMessages.scrollTop(divMessages.prop("0"));
    }
    moreMessage++;
    if (last > 100) {
      $("#messages").prepend(
        $(`<div class="btn btn-light moreMsg">`).html("Load more")
      );
    }
  });
  socket.on("oldMessage", data => {
    var count = data.count;
    data = data.allMessage;
    for (var item in data) {
      var selfmes, selfnick;
      if (data[item].author == Cookies.get("idNick")) {
        selfmes = 'class="selfmess"';
        selfnick = "";
      } else {
        selfmes = "";
        selfnick = `<span class="chatNick"> ${data[item].author}</span>, `;
      }
      var time = new Date(data[item].createdAt);
      var date = time.toLocaleDateString() + " " + time.toLocaleTimeString();

      $("#messages").prepend(
        $(`<div ${selfmes}>`).html(
          `<div class="timemess">${selfnick}${date}</div><div class="div-mess"> <span class="mes">${
            data[item].text
          }</span><div>`
        )
      );
      divMessages.scrollTop(divMessages.prop("scrollHeight"));
    }
    if (count > 100) {
      $("#messages").prepend(
        $(`<div class="btn btn-light moreMsg">`).html("Load more")
      );
    }
  });
  var expande = false;
  $("#title-chat").on("click", () => {
    var listRoom = $("#listRoom");
    if (expande) {
      listRoom.css("z-index", "0");
      expande = false;
    } else {
      listRoom.css("z-index", "10000");
      expande = true;
    }
  });

  $("#send").on("click", function() {
    if (
      $("#m")
        .val()
        .trim()
    ) {
      // console.log(roomid);

      var msg = $("#m").val();

      for (let i = 0; i < 1; i++) {
        var data = {
          msg,
          nick: id,
          channel: roomid
        };
        data.msg += i;
        socket.emit("broadcast", data);
      }
      $("#m").val("");
    }
    return false;
  });
  socket.on("disconnect", function() {});
  socket.on("unjoin", function(data) {
    console.log(`client '${data.name}' disconected`);
    socket.emit("getClients");
  });

  socket.on("broadcast", function(data) {
    // console.log('broadcast');
    // console.log(data);
    var selfmes, selfnick;
    if (data.nick == Cookies.get("idNick")) {
      selfmes = 'class="selfmess"';
      selfnick = "";
    } else {
      selfmes = "";
      selfnick = `<span class="chatNick"> ${data.nick}</span>, `;
    }
    var currentdate = new Date();
    var date =
      currentdate.toLocaleDateString() + " " + currentdate.toLocaleTimeString();

    $("#messages").append(
      $(`<div ${selfmes}>`).html(
        `<div class="timemess">${selfnick}${date}</div><div class="div-mess"> <span class="mes">${
          data.msg
        }</span><div>`
      )
    );
    divMessages.scrollTop(divMessages.prop("scrollHeight"));
  });
});

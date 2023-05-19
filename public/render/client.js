let socket = null;

// 使用者上傳照片
function upload(obj) {
  // console.log("obj:", obj);
  const files = obj.files;
  const [file] = files;
  // console.log("files:", files);
  socket.emit("upload", file, (status) => {
    console.log("status:", status);
  });
}

$("#btnConnect").click(function (e) {
  e.preventDefault();
  if (socket !== null) {
    alert("Already connected");
    return;
  }
  // 建立一個 io 物件(?)，並連上 SocketIO server
  socket = io();

  // 連線建立後
  socket.on("connect", () => console.log("open connection to server"));

  // 取得連線的人是誰
  const name = $("#name").val();

  socket.emit("online", name);

  // 對所有人顯示的訊息
  socket.on("allMessage", (msg) => {
    console.log(msg);
    $("ul").append(`<li>${msg.name}: ${msg.message}</li>`);
  });

  // 對特定人顯示的訊息
  socket.on("message", (msg) => {
    console.log(msg);
    $("ul").append(`<li>${msg.name}: ${msg.message}</li>`);
  });

  // server 回報想傳的對象不在線上
  socket.on("notExist", (msg) => console.log(msg));

  // 監聽上傳照片的動作
  let imgChunks = [];
  socket.on("file", async (chunk) => {
    // 把照片的 base64 編碼拼湊回來
    imgChunks.push(chunk);
  });

  // FIXME: Receive picture (改從 S3 拿圖片網址(presign url ???))
  socket.on("wholeFile", (msg) => {
    console.log(msg);
    const $img = $("<img>");
    $img
      .attr("src", "data:image/jpeg;base64," + window.btoa(imgChunks))
      .height(100);

    $("ul").append(`<li>${msg.name}:</li>`).append($img);
    imgChunks = [];
  });

  socket.on("disconnect", () => console.log("close connection to server"));
});

$("#btnText").click(function (e) {
  e.preventDefault();

  if (socket === null) {
    alert("Please connect first");
    return;
  }

  // 這個訊息是要送給誰
  const receiver = $("#receiver").val();
  const message = $("#message").val();
  const messages = { receiver, content: message };

  socket.emit("message", JSON.stringify(messages));
});

// FIXME: test whole picture display
// $("#test").click(function (e) {
//   e.preventDefault();

//   if (socket === null) {
//     alert("Please connect first");
//     return;
//   }

//   socket.emit("test", "test123");
// });

// 上傳圖片
const $picture = $("#picture");

$("#btnFile").click(function (e) {
  e.preventDefault();

  if (socket === null) {
    alert("Please connect first");
    return;
  }

  upload($picture[0]);
});

// ----------------------- Function 區塊 --------------------------

// Function1: 取得 API 資料
const getApi = async (url, option) => {
  let response = await fetch(url, option);
  response = await response.json();

  return response.data;
};

// TODO: Function2: [WebSocket] 使用者上傳照片
const upload = (receiver, obj) => {
  // console.log("obj:", obj);
  const files = obj.files;
  const [file] = files;
  // console.log("files:", files);

  const msg = { receiver, file };

  socket.emit("upload", msg, (status) => {
    console.log("status:", status);
  });
};

// Function3: 動態製造 DOM 物件 (create option for user) 整合
const createUserOption = async (users, elementName) => {
  // 選擇要當模板的 element tag
  const $userTemplete = $(`.${elementName}`);

  // 選取要被插入 child 的 parant element
  const $parent = $(`#${elementName}s`);

  // 依據 group array 的長度，產生多少個選項
  for (const id in users) {
    // 複製出一個下拉式選單的 option element tag
    const $newDom = $userTemplete.clone();

    // 把新的 option 的 value 和 text 改掉
    $newDom.attr("value", id).text(users[id]).css("display", "inline");

    // 把新的 option 加入 parant element
    $newDom.appendTo($parent);
  }
};

// Function4: 動態製造 DOM 物件 (create option for candidate)
const createCandidateOption = async (users, group, elementName) => {
  // 選擇要當模板的 element tag
  const $userTemplete = $(`.${elementName}`);

  // 選取要被插入 child 的 parant element
  const $parent = $(`#${elementName}s`);

  // 依據 group array 的長度，產生多少個選項
  group.forEach((id) => {
    // 複製出一個下拉式選單的 option element tag
    const $newDom = $userTemplete.clone();

    // 把新的 option 的 value 和 text 改掉
    $newDom.attr("value", id).text(users[id]).css("display", "inline");

    // 把新的 option 加入 parant element
    $newDom.appendTo($parent);
  });
};

// ------------------------------ 前端渲染區塊 --------------------------------

// 取得所有使用者 id 和 nickname
const allUsersUrl = `/api/1.0/user/userslist`;
const userIdNicknamePair = {}; // {id: nickname}

(async () => {
  // FIXME: 取得所有使用者 (只有在這個立即執行函式會需要 allUsers 嗎?)
  const idNameList = await getApi(allUsersUrl);
  idNameList.forEach((userObj) => {
    userIdNicknamePair[userObj.id] = userObj.nick_name;
  });

  // 動態產生下拉式選單的選項
  await createUserOption(userIdNicknamePair, "user");
})();

// --------------------------- WebSocket 區塊 --------------------------------

let socket = null;

$("#btnConnect").click(function (e) {
  e.preventDefault();

  if (socket !== null) {
    alert("Already connected");
    return;
  }
  // 建立一個 io 物件(?)，並連上 SocketIO server
  socket = io();

  // 取得連線的人是誰
  const id = +$("#users").val();
  const name = $("#users option:selected").text();

  // 傳送連線者資訊給 server
  const user = { id, name };
  socket.emit("online", user);

  // 連線建立後
  socket.on("userConnect", async (id) => {
    console.log("open connection to server");

    // 取得所有連線者的候選人名單
    const candidatesUrl = `/api/1.0/user/matchcandidate`;
    const userCandidateList = await getApi(candidatesUrl);
    const userIdCandidateIdPair = {}; // {id: candidateList}
    userCandidateList.forEach((userObj) => {
      userIdCandidateIdPair[userObj.id] = userObj.candidateIdList;
    });
    // console.log("userIdCandidateIdPair", userIdCandidateIdPair);

    // 動態產生下拉式選單的選項
    (async () => {
      // 取得該連線者的候選人名單
      const certainCandidateList = userIdCandidateIdPair[id];

      // 產生傳送文字訊息的下拉選單
      await createCandidateOption(
        userIdNicknamePair,
        certainCandidateList,
        "msgreceiver"
      );

      // 產生傳送檔案的下拉選單
      await createCandidateOption(
        userIdNicknamePair,
        certainCandidateList,
        "filereceiver"
      );
    })();
  });

  // TODO: 對所有人顯示的訊息 (儲存聊天紀錄到 ES ???)
  socket.on("allMessage", (msg) => {
    console.log(msg);
    if (msg.system) {
      $("ul").append(`<li>${msg.system}: ${msg.message}</li>`);
    } else {
      $("ul").append(
        `<li>${msg.name}: ${msg.message} ----- ${msg.timestamp}</li>`
      );
    }
  });

  // 對特定人顯示的訊息 (儲存聊天紀錄到 ES)
  socket.on("message", async (msg) => {
    console.log(msg);

    $("ul").append(
      `<li>${msg.name}: ${msg.message} ----- ${msg.timestamp}</li>`
    );

    // 打 chatRecord route
    let chatRecordApi = "/api/1.0/chat/chatrecord";

    let fetchOption = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    };

    let data = {};
    data.userId = msg.id;
    data.userName = msg.name;
    data.message = msg.message;
    data.timestamp = msg.timestamp;
    data.time = msg.msOfTime;

    fetchOption.body = JSON.stringify(data);

    const chatRecord = await getApi(chatRecordApi, fetchOption);
    console.log("chatRecord", chatRecord);
  });

  // server 回報想傳的對象不在線上
  socket.on("notExist", (msg) => console.log(msg));

  // 監聽上傳照片的動作
  let imgChunks = [];
  socket.on("file", async (chunk) => {
    // 把照片的 base64 編碼拼湊回來
    imgChunks.push(chunk);
  });

  // TODO: Receive picture (改從 S3 拿圖片網址(presign url ???)) (儲存聊天紀錄到 ES)
  socket.on("wholeFile", (msg) => {
    console.log(msg);
    const $img = $("<img>");
    $img
      .attr("src", "data:image/jpeg;base64," + window.btoa(imgChunks))
      .height(200);

    $("ul")
      .append(`<li>${msg.name}</li>`)
      .append($img)
      .append(`<span>----- ${msg.timestamp}</span>`);
    imgChunks = [];
  });

  socket.on("disconnect", () => console.log("close connection to server"));
});

// 傳送文字
$("#btnText").click(function (e) {
  e.preventDefault();

  if (socket === null) {
    alert("Please connect first");
    return;
  }

  // 這個訊息是要送給誰
  const receiver = $("#msgreceivers").val();
  const message = $("#message").val();
  const messages = { receiver, content: message };

  socket.emit("message", messages);
});

// 上傳圖片
const $picture = $("#picture");

$("#btnFile").click(function (e) {
  e.preventDefault();

  if (socket === null) {
    alert("Please connect first");
    return;
  }

  // 這個圖片是要送給誰
  const receiver = $("#filereceivers").val();
  upload(receiver, $picture[0]);
});

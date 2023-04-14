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
const createUserOption = (users, elementName) => {
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
const createCandidateOption = (users, group, elementName) => {
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

// Function5: 動態製造 DOM 物件 (create div for partner)
const createPartnerDiv = (roomId, name) => {
  // 選取要被插入 child 的 parant element
  const $parent = $("#match");

  // 新建 div element
  const $div = $("<div>");
  $div.addClass("partner");
  const $a = $("<a>").attr("href", `/chatroom.html?room=${roomId}`).text(name);

  $a.appendTo($div);

  // 把新的 option 加入 parant element
  $div.appendTo($parent);
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
  socket.on("user-connect", async (id) => {
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

      // 產生想跟誰建立聊天室的下拉選單
      await createCandidateOption(
        userIdNicknamePair,
        certainCandidateList,
        "condidate"
      );

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

  // FIXME: 告訴使用者已經創建該聊天室 (需要這樣避免跳轉頁面嗎?)
  socket.on("create-room-message", (roomId) => {
    // 取得當前網址
    const currentUrl = window.location.href;

    // 新增 query parameters
    const newUrl = currentUrl + `?room=${roomId}`;

    // 修改網址而不跳轉頁面
    window.history.pushState({}, "", newUrl);
    console.log(`You've create ${roomId} room`);
  });

  // 告訴使用者已經加入聊天室
  socket.on("join-room-message", (roomId) => {
    console.log(`You've join ${roomId} room`);
  });

  // 房間的廣播
  socket.on("room-broadcast", (msg) => {
    console.log(msg);
    if (msg.system) {
      $("ul.message").append(`<li>${msg.system}: ${msg.message}</li>`);
    } else {
      $("ul.message").append(
        `<li>${msg.userName}: ${msg.message} ----- ${msg.timestamp}</li>`
      );
    }
  });
});

// 和誰建立一個獨立聊天室
$("#btnBuild").click(function (e) {
  e.preventDefault();

  if (socket === null) {
    alert("Please connect first");
    return;
  }

  // 取得網址的 params
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room");

  // TODO: 檢查網址上是否有帶 roomId (如何抓和不同的使用者的 room id)
  if (roomId) {
    // 可以直接傳送加入聊天室訊息
    socket.emit("join-room", roomId);

    const userName = $("#condidates option:selected").text();
    createPartnerDiv(roomId, userName);
  } else {
    // 告訴 server 我想要建立聊天室
    socket.emit("create-room");
  }
});

// 傳送文字
$("#btnText").click(function (e) {
  e.preventDefault();

  if (socket === null) {
    alert("Please connect first");
    return;
  }

  // 取得網址的 params
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room");

  if (!roomId) {
    alert("You have to get a chatroom id");
    return;
  }

  const userName = $("#users option:selected").text();
  const message = $("#message").val();
  const messages = { roomId, userName, message };

  socket.emit("message", messages);
});

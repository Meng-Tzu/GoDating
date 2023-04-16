// ----------------------- Function 區塊 --------------------------

// Function1: 取得 API 資料
const getApi = async (url, option) => {
  let response = await fetch(url, option);
  response = await response.json();

  return response.data;
};

// FIXME: Function2: 動態製造 DOM 物件 (create option for user) (整合)
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

// Function3: 動態製造 DOM 物件 (create options for candidate)
const createCandidateOption = (candidates, elementName) => {
  // 選擇要當模板的 element tag
  const $userTemplete = $(`.templete-${elementName}`);

  // 選取要被插入 child 的 parant element
  const $parent = $(`#${elementName}s`);

  // 依據 candidates array 的長度，產生多少個選項
  for (const candidateId in candidates) {
    // 複製出一個下拉式選單的 option element tag
    const $newDom = $userTemplete.clone();

    // 把新的 option 的 value 和 text 改掉
    $newDom
      .addClass(`${elementName}`)
      .attr("value", candidateId)
      .text(candidates[candidateId])
      .css("display", "inline");

    // 把新的 option 加入 parant element
    $newDom.appendTo($parent);
  }
};

// Function4: 動態製造 DOM 物件 (create option for suitor)
const createSuitorOption = (suitorId, suitorName) => {
  // 選取要被插入 child 的 parant element
  const $parent = $("#suitors");

  // 新建 option element
  const $option = $("<option>");

  // 把新的 option 的 value 和 text 改掉
  $option
    .addClass("suitor")
    .attr("value", suitorId)
    .text(suitorName)
    .css("display", "inline");

  // 把新的 button 加入 parant element
  $option.appendTo($parent);
};

// Function5: 動態刪除 DOM 物件 (delete option for candidate)
const deleteCandidateOption = (candidateId) => {
  $(`.condidate[value="${candidateId}"]`).remove();
};

// Function6: 動態製造 DOM 物件 (create div for partner)
const createPartnerDiv = (roomId, candidateId, candidateName) => {
  // 選取要被插入 child 的 parant element
  const $parent = $("#match");

  // 新建 button element
  const $button = $("<button>");
  $button
    .addClass(`partner ${candidateId}`)
    .attr("id", roomId)
    .attr("onClick", `openChatroom($(this))`)
    .text(candidateName);

  // 把新的 button 加入 parant element
  $button.appendTo($parent);
};

// FIXME: Function7: 動態製造 DOM 物件 (create div for all partners) (chatIndexId 沒有用??)
const createAllPartnerDiv = (partners, userIdNicknamePair) => {
  // 選取要被插入 child 的 parant element
  const $parent = $("#match");

  for (const partnerId in partners) {
    const chatroomInfo = partners[partnerId];

    const roomId = chatroomInfo[0];
    const chatIndexId = chatroomInfo[1];
    const partnerName = userIdNicknamePair[partnerId];

    // 新建 button element
    const $button = $("<button>");

    $button
      .addClass(`partner ${partnerId} ${chatIndexId}`)
      .attr("id", roomId)
      .attr("onClick", `openChatroom($(this))`)
      .text(partnerName);

    // 把新的 button 加入 parant element
    $button.appendTo($parent);
  }
};

// TODO: Function8: 點擊特定 partner 開啟聊天室
const openChatroom = async function ($this) {
  const roomId = $this.attr("id");
  const partnerName = $this.text();
  const classNames = $this.attr("class");
  // console.log("classNames", classNames, typeof classNames);
  const partnerId = classNames.split(" ")[1];
  // console.log("partnerId", partnerId, typeof partnerId);

  // FIXME: 取得目前網址 (每次都要先清空對話框內容???)
  const currentUrl = window.location.href;
  let indexUrl;
  let newUrl;
  if (currentUrl.includes("?room=")) {
    // 如果原本在別的聊天室，就要替換掉 room id
    indexUrl = currentUrl.split("?room=")[0];
    newUrl = indexUrl + `?room=${roomId}`;
    $("ul.message").children().remove();
  } else {
    // 如果在首頁，直接加 room id
    newUrl = currentUrl + `?room=${roomId}`;
    $("ul.message").children().remove();
  }

  // 不跳轉網址
  window.history.pushState({}, "", newUrl);

  // 顯示出聊天室窗
  // $("#connection").css("display", "none");
  $("#short-list").css("display", "none");
  $(".other-side")
    .text(partnerName)
    .css("display", "block")
    .attr("id", partnerId);
  $("#dialogue").css("display", "block");
  $("#text-msg").css("display", "block");
  $("#picture-msg").css("display", "block");
  $("#current h3").text("目前聊天者資訊");

  // FIXME: 取得先前的對話紀錄 (改用 socketIO 取得??)
  const chatIndexId = classNames.split(" ")[2];

  const partnersUrl = `/api/1.0/chat/allrecord`;
  let fetchOption = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "",
  };
  fetchOption.body = JSON.stringify({ indexId: chatIndexId });

  const chatRecord = await getApi(partnersUrl, fetchOption);

  if (chatRecord) {
    chatRecord.forEach((record) => {
      const { userName, message, timestamp } = record;
      $("ul.message").append(
        `<li>${userName}: ${message} ----- ${timestamp}</li>`
      );
    });
  }
};

// Function9: [WebSocket] 使用者上傳照片
const upload = (roomId, partnerId, obj) => {
  // console.log("obj:", obj);
  const files = obj.files;
  const [file] = files;
  // console.log("files:", files);

  const msg = { roomId, partnerId, file };

  socket.emit("upload", msg, (status) => {
    console.log("status:", status);
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
  createUserOption(userIdNicknamePair, "user");
})();

// 點擊 logo 渲染出首頁的配對
$(".logo").click(function (e) {
  e.preventDefault();

  // 取得目前網址
  const currentUrl = window.location.href;
  let indexUrl;
  if (currentUrl.includes("?room=")) {
    // 如果原本在聊天室，就要刪掉 room id
    indexUrl = currentUrl.split("?room=")[0];
  } else {
    indexUrl = currentUrl;
  }
  // 不跳轉網址
  window.history.pushState({}, "", indexUrl);

  // 顯示出聊天室窗
  // $("#connection").css("display", "none");
  $("#short-list").css("display", "block");
  $(".other-side").css("display", "none");
  $("#dialogue").css("display", "none");
  $("#text-msg").css("display", "none");
  $("#picture-msg").css("display", "none");
  $("#current h3").text("猜你會喜歡...");
});

// --------------------------- WebSocket 區塊 --------------------------------

let socket = null;

$("#btn-connect").click(function (e) {
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

    // 取得特定使用者的候選人名單
    const candidatesUrl = `/api/1.0/user/candidate`;
    const suitorsUrl = `/api/1.0/user/suitor`;
    const partnersUrl = `/api/1.0/user/partner`;
    let fetchOption = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    };
    fetchOption.body = JSON.stringify({ userid: id });

    const userCandidateList = await getApi(candidatesUrl, fetchOption);
    const userSuitorList = await getApi(suitorsUrl, fetchOption);
    const userPartnerList = await getApi(partnersUrl, fetchOption);

    // FIXME: 動態產生下拉式選單的選項 (改用 socketIO 取得資料)
    (() => {
      // 取得該連線者的候選人名單
      const certainCandidateList = userCandidateList[0][id];
      const certainSuitorList = userSuitorList[0][id];
      const certainPartnerList = userPartnerList[0];

      // 產生想跟誰配對的下拉選單
      createCandidateOption(certainCandidateList, "condidate");

      // 產生有人喜歡你的下拉選單
      createCandidateOption(certainSuitorList, "suitor");

      // 產生已配對成功的 partner 有誰
      createAllPartnerDiv(certainPartnerList, userIdNicknamePair);
    })();
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

  // 接收圖片
  let imgChunks = [];
  socket.on("file", async (chunk) => {
    // 把照片的 base64 編碼拼湊回來
    imgChunks.push(chunk);
  });

  // 呈現圖片
  socket.on("wholeFile", (msg) => {
    console.log(msg);

    if (msg.error) {
      $("ul.message").append(`<li>${msg.userName}: ${msg.error}</li>`);
    } else {
      const $img = $("<img>");
      $img
        .attr("src", "data:image/jpeg;base64," + window.btoa(imgChunks))
        .height(200);

      $("ul.message")
        .append(`<li>${msg.userName}:</li>`)
        .append($img)
        .append(`<span>----- ${msg.timestamp}</span>`);

      imgChunks = [];
    }
  });

  // 主動配對成功
  socket.on("success-match", async (msg) => {
    const { userId, partnerId, partnerName, roomId } = msg;
    createPartnerDiv(roomId, partnerId, partnerName);

    // 重新產生有人喜歡你的下拉選單
    const suitorsUrl = `/api/1.0/user/suitor`;
    let fetchOption = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    };
    fetchOption.body = JSON.stringify({ userid: userId });

    const userSuitorList = await getApi(suitorsUrl, fetchOption);
    const certainSuitorList = userSuitorList[0][id];
    if (!certainSuitorList) {
      // 如果使用者目前沒有追求者，清空下拉選單
      $(".suitor").remove();
    } else {
      // 如果使用者目前還有追求者，更新下拉選單
      $(".suitor").remove();
      createCandidateOption(certainSuitorList, "suitor");
    }
  });

  // 被動配對成功
  socket.on("success-be-matched", (msg) => {
    const { userId, partnerId, partnerName, roomId } = msg;
    createPartnerDiv(roomId, partnerId, partnerName);
  });

  // 新增誰喜歡我的下拉選單
  socket.on("who-like-me", (msg) => {
    const { userId, suitorId, suitorName } = msg;
    createSuitorOption(suitorId, suitorName);
    deleteCandidateOption(suitorId);
  });

  // 刪除已選擇過的候選人
  socket.on("success-send-like-signal", (msg) => {
    const { userId, condidateId, condidateName } = msg;
    deleteCandidateOption(condidateId);
  });
});

// 把想配對的 candidate 資訊送給 server 儲存
$("#btn-like").click(function (e) {
  e.preventDefault();

  if (socket === null) {
    alert("Please connect first");
    return;
  }

  const userId = $("#users option:selected").val();
  const userName = $("#users option:selected").text();
  const condidateId = $("#condidates option:selected").val();
  const condidateName = $("#condidates option:selected").text();

  const messages = { userId, userName, condidateId, condidateName };

  socket.emit("desired-candidate", messages);
});

// 也喜歡對方
$("#btn-like-too").click(function (e) {
  e.preventDefault();

  if (socket === null) {
    alert("Please connect first");
    return;
  }

  const userId = $("#users option:selected").val();
  const userName = $("#users option:selected").text();
  const suitorId = $("#suitors option:selected").val();
  const suitorName = $("#suitors option:selected").text();

  const messages = { userId, userName, suitorId, suitorName };

  socket.emit("like-suitor", messages);
});

// 傳送文字
$("#btn-text").click(function (e) {
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

  // const userName = $("#users option:selected").text();
  const partnerId = +$(".other-side").attr("id");
  const message = $("#message").val();
  const messages = { partnerId, roomId, message };

  socket.emit("message", messages);
});

// FIXME: 上傳圖片 (改成上傳到 S3)
const $picture = $("#picture");

$("#btn-file").click(function (e) {
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

  const partnerId = +$(".other-side").attr("id");

  upload(roomId, partnerId, $picture[0]);
});

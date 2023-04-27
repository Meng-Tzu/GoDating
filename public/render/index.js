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

// Function4: 動態製造 DOM 物件 (create option for pursuer)
const createPursuerOption = (pursuerId, pursuerName) => {
  // 選取要被插入 child 的 parant element
  const $parent = $("#pursuers");

  // 新建 option element
  const $option = $("<option>");

  // 把新的 option 的 value 和 text 改掉
  $option
    .addClass("pursuer")
    .attr("value", pursuerId)
    .text(pursuerName)
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
  const $div = $("<div>");
  $div
    .addClass(`partner ${candidateId} text-xl text-center shadow-md`)
    .attr("id", roomId)
    .attr("onClick", `openChatroom($(this))`)
    .text(candidateName);

  // 把新的 div 加入 parant element
  $div.appendTo($parent);
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
    const $div = $("<div>");

    $div
      .addClass(
        `partner ${partnerId} ${chatIndexId} text-xl text-center shadow-md`
      )
      .attr("id", roomId)
      .attr("onClick", `openChatroom($(this))`)
      .text(partnerName);

    // 把新的 div 加入 parant element
    $div.appendTo($parent);
  }
};

// Function8: 動態製造 DOM 物件 (create div for next-recommend)
const createNextRecommendDiv = (candidateInfoList) => {
  // 選取要被插入 child 的 parant element
  const $parent = $("#current");

  const $templete = $(".templete-next-recommend");
  candidateInfoList.forEach((candidateInfo, index) => {
    // 創新的 element
    const $div = $("<div>");
    const $img = $("<img>");
    const $h2 = $("<h2>");

    $div.addClass("next-recommend text-xl");
    $img.addClass("next-picture").attr("src", candidateInfo.main_image);
    $h2.addClass(".next-name text-center").text(candidateInfo.nick_name);

    $img.appendTo($div);
    $h2.appendTo($div);

    // 把複製出來的 div 加入 parant element
    $div.appendTo($parent);
  });
};

// Function9: 動態製造 DOM 物件 (create div for next-recommend)
const createMessageDiv = (msg, imgChunks) => {
  // 選取要被插入 child 的 parant element
  const $parent = $("#dialogue");

  // 新建 div
  const $div = $("<div>");
  const $outerDiv = $div.clone();
  $outerDiv.attr("class", `message-in-dialogue ${msg.userId}`);
  const $inner1stDiv = $div.clone();
  const $inner2ndDiv = $div.clone();
  $inner2ndDiv.attr("class", "timestamp").text(msg.timestamp);

  if (msg.message.includes(".jpg")) {
    // 如果是拿 ES 裡的照片檔名
    $inner1stDiv.attr("class", "single-message").text(`${msg.userName}:`);
    const $img = $("<img>");
    $img.attr("src", `/${msg.message}`).height(200);

    $inner1stDiv.appendTo($outerDiv);
    $img.appendTo($outerDiv);
    $inner2ndDiv.appendTo($outerDiv);
    $outerDiv.appendTo($parent);
  } else if (!imgChunks) {
    $inner1stDiv
      .attr("class", "single-message")
      .text(`${msg.userName}: ${msg.message}`);

    // // 把複製出來的 div 加入 parent element
    $inner1stDiv.appendTo($outerDiv);
    $inner2ndDiv.appendTo($outerDiv);
    $outerDiv.appendTo($parent);
  } else {
    $inner1stDiv.attr("class", "single-message").text(`${msg.userName}:`);
    const $img = $("<img>");
    $img
      .attr("src", "data:image/jpeg;base64," + window.btoa(imgChunks))
      .height(200);

    $inner1stDiv.appendTo($outerDiv);
    $img.appendTo($outerDiv);
    $inner2ndDiv.appendTo($outerDiv);
    $outerDiv.appendTo($parent);
  }
};

// Function10: 動態製造 DOM 物件 (create div for search result)
const createSearchResultDiv = (result) => {
  // 選取要被插入 child 的 parant element
  const $parent = $("#current");
  const $ul = $("<ul>");
  $ul.addClass("search-message");

  // 更換標題
  $("#current #more-info h3").text("搜尋結果");

  // 顯示取消圖示
  $("#cross").css("display", "inline");
  $("#partner-info").css("display", "none");

  if (!result.length) {
    const $li = $("<li>");
    $li.text("沒有搜尋結果");
    $li.appendTo($ul);
  } else {
    result.forEach((message) => {
      // 新建 li element
      const $li = $("<li>");
      $li.text(
        `${message.userName}: ${message.message} ----- ${message.timestamp}`
      );

      $li.appendTo($ul);
    });
  }

  $ul.appendTo($parent);
};
// Function11: 點擊特定 partner 開啟聊天室
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
    $("#dialogue").children().remove();
  } else {
    // 如果在首頁，直接加 room id
    newUrl = currentUrl + `?room=${roomId}`;
    $("#dialogue").children().remove();
  }

  // 不跳轉網址
  window.history.pushState({}, "", newUrl);

  // TODO: 取得目前聊天者的詳細資訊
  socket.emit("ask-for-partner-info", partnerId);
  socket.on("get-partner-info", (msg) => {
    const { id, nick_name, main_image, sex, age, self_intro } = msg;

    $("#partner-name").text(nick_name);
    $("#partner-cantainer img").attr("src", main_image).attr("alt", nick_name);
    $("#partner-sex").text(sex);
    $("#partner-age").text(age);
    $("#partner-intro").text(self_intro);
  });

  // 顯示出聊天室窗
  $("#connection").css("display", "none");
  $("#short-list").css("display", "none");
  $("#who-like-me").css("display", "none");
  $("#current-recommend").css("display", "none");
  $(".next-recommend").css("display", "none");
  $("#title").css("display", "flex");
  $("#dialogue").css("display", "block");
  $("#partner-info").css("display", "block");
  $(".other-side").text(partnerName).attr("id", partnerId);
  $("#text-msg").css("display", "flex");
  $("#picture-msg").css("display", "flex");
  $("#current").css("display", "block");
  $("#current #more-info h3").text("目前聊天者資訊");

  // 移除搜尋結果
  $(".search-message").remove();

  // 隱藏取消圖示
  $("#cross").css("display", "none");

  // 取得先前的對話紀錄 (改用 socketIO 取得??)
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
      createMessageDiv(record);
    });
  }
};

// Function12: [WebSocket] 使用者上傳照片
const upload = (roomId, partnerId, obj) => {
  console.log("partnerId:", partnerId);
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

// --------------------------- WebSocket 區塊 --------------------------------

let socket = null;

// 從 JWT token 取得使用者 id 去做 socketIO 連線
const token = localStorage.getItem("token");

const userApi = "/api/1.0/user/verify";
let fetchOption = {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
};

// 立即執行函式
(async () => {
  const userData = await getApi(userApi, fetchOption);

  if (!userData) {
    // token 錯誤
    alert("Sorry, you need to sign up / sign in again.");
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  } else {
    const { id, name, email } = userData;
    $(".user-name").text(name).attr("id", id);

    // 建立一個 io 物件(?)，並連上 SocketIO server
    socket = io();

    // 傳送連線者資訊給 server
    const user = { id, name };
    socket.emit("online", user);

    // FIXME: 連線建立後 (加上追求者的詳細資訊) (從 socketIO 拿完整 candidate & pursuer list)
    socket.on("user-connect", async (msg) => {
      console.log("open connection to server");

      const { potentialInfoList, pursuerIdList } = msg;

      // 顯示目前推薦人選
      const currentRecommend = potentialInfoList[0];
      $("#current").css("display", "flex");
      $("#current-recommend").css("display", "flex");
      // $(".next-recommend").css("display", "flex");
      $("#who-like-me").css("display", "block");
      $("#candidate-picture").attr("src", currentRecommend.main_image);
      $(".candidate-name")
        .text(currentRecommend.nick_name)
        .attr("id", currentRecommend.id);
      $("#candidate-sex").text(currentRecommend.sex);
      $("#candidate-age").text(`${currentRecommend.age} 歲`);
      $("#candidate-intro").text(currentRecommend.self_intro);

      if (pursuerIdList.includes(currentRecommend.id)) {
        $("#btn-like").css("cursor", "not-allowed").css("opacity", "0.25");
        $("#btn-like-too").css("cursor", "pointer").css("opacity", "1");
      } else {
        $("#btn-like").css("cursor", "pointer").css("opacity", "1");
        $("#btn-like-too").css("cursor", "not-allowed").css("opacity", "0.25");
      }

      // 更新後續的推薦人選
      const nextRecommend = potentialInfoList.slice(1);
      $(".next-recommend").remove();
      createNextRecommendDiv(nextRecommend);

      // 取得特定使用者的候選人名單
      const candidatesUrl = `/api/1.0/user/candidate`;
      const pursuersUrl = `/api/1.0/user/pursuer`;
      const partnersUrl = `/api/1.0/user/partner`;
      let fetchOption = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "",
      };
      fetchOption.body = JSON.stringify({ userid: msg.id });

      const userCandidateList = await getApi(candidatesUrl, fetchOption);
      const userPursuerList = await getApi(pursuersUrl, fetchOption);
      const userPartnerList = await getApi(partnersUrl, fetchOption);

      // FIXME: 動態產生下拉式選單的選項 (改用 socketIO 取得資料)
      (() => {
        // 取得該連線者的候選人名單
        const certainCandidateList = userCandidateList[0][msg.id];
        const certainPursuerList = userPursuerList[0][msg.id];
        const certainPartnerList = userPartnerList[0];

        // 產生想跟誰配對的下拉選單
        createCandidateOption(certainCandidateList, "condidate");

        // 產生有人喜歡你的下拉選單
        createCandidateOption(certainPursuerList, "pursuer");

        // 產生已配對成功的 partner 有誰
        createAllPartnerDiv(certainPartnerList, userIdNicknamePair);
      })();
    });

    socket.on("response-all-potential", (msg) => {
      const { potentialInfoList } = msg;

      // 顯示目前推薦人選
      const currentRecommend = potentialInfoList[0];
      $("#current").css("display", "flex");
      $("#current-recommend").css("display", "flex");
      // $(".next-recommend").css("display", "flex");
      $("#who-like-me").css("display", "block");
      $("#candidate-picture").attr("src", currentRecommend.main_image);
      $(".candidate-name")
        .text(currentRecommend.nick_name)
        .attr("id", currentRecommend.id);
      $("#candidate-sex").text(currentRecommend.sex);
      $("#candidate-age").text(`${currentRecommend.age} 歲`);
      $("#candidate-intro").text(currentRecommend.self_intro);

      // 更新後續的推薦人選
      const nextRecommend = potentialInfoList.slice(1);
      $(".next-recommend").remove();
      createNextRecommendDiv(nextRecommend);
    });

    // 對話呈現純文字
    socket.on("room-broadcast", (msg) => {
      console.log(msg);
      createMessageDiv(msg);
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
      createMessageDiv(msg, imgChunks);
      imgChunks = [];
    });

    // 主動配對成功
    socket.on("success-match", async (msg) => {
      const {
        userId,
        partnerId,
        partnerName,
        roomId,
        potentialInfoList,
        pursuerIdList,
      } = msg;
      createPartnerDiv(roomId, partnerId, partnerName);

      // 重新產生有人喜歡你的下拉選單
      const pursuersUrl = `/api/1.0/user/pursuer`;
      let fetchOption = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "",
      };
      fetchOption.body = JSON.stringify({ userid: userId });

      const userPursuerList = await getApi(pursuersUrl, fetchOption);
      const certainPursuerList = userPursuerList[0][id];
      if (!certainPursuerList) {
        // 如果使用者目前沒有追求者，清空下拉選單
        $(".pursuer").remove();
      } else {
        // 如果使用者目前還有追求者，更新下拉選單
        $(".pursuer").remove();
        createCandidateOption(certainPursuerList, "pursuer");
      }

      // 更新目前推薦人選
      const currentRecommend = potentialInfoList[0];
      $("#current-recommend").css("display", "block");
      $("#candidate-picture").attr("src", currentRecommend.main_image);
      $(".candidate-name")
        .text(currentRecommend.nick_name)
        .attr("id", currentRecommend.id);
      $("#candidate-sex").text(currentRecommend.sex);
      $("#candidate-age").text(`${currentRecommend.age} 歲`);
      $("#candidate-intro").text(currentRecommend.self_intro);

      if (pursuerIdList.includes(currentRecommend.id)) {
        $("#btn-like").css("cursor", "not-allowed").css("opacity", "0.25");
        $("#btn-like-too").css("cursor", "pointer").css("opacity", "1");
      } else {
        $("#btn-like").css("cursor", "pointer").css("opacity", "1");
        $("#btn-like-too").css("cursor", "not-allowed").css("opacity", "0.25");
      }

      // 更新後續的推薦人選
      const nextRecommend = potentialInfoList.slice(1);
      $(".next-recommend").remove();
      createNextRecommendDiv(nextRecommend);

      alert(`與 ${partnerName} 成功配對！`);
    });

    // 被動配對成功
    socket.on("success-be-matched", (msg) => {
      const { userId, partnerId, partnerName, roomId } = msg;
      createPartnerDiv(roomId, partnerId, partnerName);
    });

    // 新增誰喜歡我的下拉選單
    socket.on("who-like-me", (msg) => {
      const {
        userId,
        pursuerId,
        pursuerName,
        potentialInfoList,
        pursuerIdList,
      } = msg;
      createPursuerOption(pursuerId, pursuerName);
      deleteCandidateOption(pursuerId);

      // 更新目前推薦人選
      const currentRecommend = potentialInfoList[0];
      $("#current-recommend").css("display", "block");
      $("#candidate-picture").attr("src", currentRecommend.main_image);
      $(".candidate-name")
        .text(currentRecommend.nick_name)
        .attr("id", currentRecommend.id);
      $("#candidate-sex").text(currentRecommend.sex);
      $("#candidate-age").text(`${currentRecommend.age} 歲`);
      $("#candidate-intro").text(currentRecommend.self_intro);

      if (pursuerIdList.includes(currentRecommend.id)) {
        $("#btn-like").css("cursor", "not-allowed").css("opacity", "0.25");
        $("#btn-like-too").css("cursor", "pointer").css("opacity", "1");
      } else {
        $("#btn-like").css("cursor", "pointer").css("opacity", "1");
        $("#btn-like-too").css("cursor", "not-allowed").css("opacity", "0.25");
      }

      // 更新後續的推薦人選
      const nextRecommend = potentialInfoList.slice(1);
      $(".next-recommend").remove();
      createNextRecommendDiv(nextRecommend);

      alert(`${pursuerName} 喜歡你！`);
    });

    // 喜歡後，刪除已選擇過的候選人
    socket.on("success-send-like-signal", (msg) => {
      const { userId, candidateId, candidateName } = msg;
      deleteCandidateOption(candidateId);

      // 更新目前推薦人選
      const currentRecommend = msg.candidateInfoList[0];
      $("#current-recommend").css("display", "block");
      $("#candidate-picture").attr("src", currentRecommend.main_image);
      $(".candidate-name")
        .text(currentRecommend.nick_name)
        .attr("id", currentRecommend.id);
      $("#candidate-sex").text(currentRecommend.sex);
      $("#candidate-age").text(`${currentRecommend.age} 歲`);
      $("#candidate-intro").text(currentRecommend.self_intro);
      $("#btn-like-too").css("pointer-events", "none");

      // 更新後續的推薦人選
      const nextRecommend = msg.candidateInfoList.slice(1);
      $(".next-recommend").remove();
      createNextRecommendDiv(nextRecommend);
    });

    // 不喜歡後，刪除已選擇過的推薦者人
    socket.on("send-unlike-signal", (msg) => {
      const {
        userId,
        unlikeId,
        unlikeName,
        isPusrsuerexist,
        potentialInfoList,
      } = msg;

      // 更新目前推薦人選
      const currentRecommend = potentialInfoList[0];
      $("#current-recommend").css("display", "block");
      $("#candidate-picture").attr("src", currentRecommend.main_image);
      $(".candidate-name")
        .text(currentRecommend.nick_name)
        .attr("id", currentRecommend.id);
      $("#candidate-sex").text(currentRecommend.sex);
      $("#candidate-age").text(`${currentRecommend.age} 歲`);
      $("#candidate-intro").text(currentRecommend.self_intro);

      // 如果還有 pursuer
      if (isPusrsuerexist) {
        $("#btn-like").css("cursor", "not-allowed").css("opacity", "0.25");
        $("#btn-like-too").css("cursor", "pointer").css("opacity", "1");
      } else {
        $("#btn-like").css("cursor", "pointer").css("opacity", "1");
        $("#btn-like-too").css("cursor", "not-allowed").css("opacity", "0.25");
      }

      // 更新後續的推薦人選
      const nextRecommend = potentialInfoList.slice(1);
      $(".next-recommend").remove();
      createNextRecommendDiv(nextRecommend);
    });

    // 被不喜歡後，刪掉該推薦者人
    socket.on("send-be-unlike-signal", (msg) => {
      const {
        userId,
        unlikeId,
        unlikeName,
        isPusrsuerexist,
        potentialInfoList,
      } = msg;

      // 更新目前推薦人選
      const currentRecommend = potentialInfoList[0];
      $("#current-recommend").css("display", "block");
      $("#candidate-picture").attr("src", currentRecommend.main_image);
      $(".candidate-name")
        .text(currentRecommend.nick_name)
        .attr("id", currentRecommend.id);
      $("#candidate-sex").text(currentRecommend.sex);
      $("#candidate-age").text(`${currentRecommend.age} 歲`);
      $("#candidate-intro").text(currentRecommend.self_intro);

      // 如果還有 pursuer
      if (isPusrsuerexist) {
        $("#btn-like").css("cursor", "not-allowed").css("opacity", "0.25");
        $("#btn-like-too").css("cursor", "pointer").css("opacity", "1");
      } else {
        $("#btn-like").css("cursor", "pointer").css("opacity", "1");
        $("#btn-like-too").css("cursor", "not-allowed").css("opacity", "0.25");
      }

      // 更新後續的推薦人選
      const nextRecommend = potentialInfoList.slice(1);
      $(".next-recommend").remove();
      createNextRecommendDiv(nextRecommend);
    });

    // 新增新註冊者到右方推薦欄
    socket.on("new-user-added", (msg) => {
      const { userId, newUserId, potentialInfoList } = msg;

      // 更新後續的推薦人選
      const nextRecommend = potentialInfoList.slice(1);
      $(".next-recommend").remove();
      createNextRecommendDiv(nextRecommend);
    });

    // 顯示搜尋對話紀錄的結果
    socket.on("search-result", (result) => {
      console.log("result", result);
      createSearchResultDiv(result);
      $("#more-info").css("display", "flex").css("justify-content", "center");
      $("#cross").css("display", "flex");
    });
  }
})();

// 點擊 logo 渲染出首頁的配對
$(".logo").click(function (e) {
  e.preventDefault();

  if (socket === null) {
    alert("Please connect first");
    return;
  }

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

  // 取得使用者所有的 potential list
  const userId = $(".user-name").attr("id");
  socket.emit("request-all-potential", userId);

  // 隱藏聊天室窗
  $("#connection").css("display", "none");
  $("#short-list").css("display", "block");
  $("#title").css("display", "none");
  $("#dialogue").css("display", "none");
  $("#text-msg").css("display", "none");
  $("#picture-msg").css("display", "none");
  $("#current h3").text("猜你會喜歡...");
  $("#partner-info").css("display", "none");
  $("#cross").css("display", "none");
  $(".search-message").css("display", "none");

  // 移除搜尋結果
  $(".search-message").remove();

  // 隱藏取消圖示
  $("#cross").css("display", "none");
});

// 把想配對的 candidate 資訊送給 server 儲存
$("#btn-like").click(function (e) {
  e.preventDefault();

  if (socket === null) {
    alert("Please connect first");
    return;
  }

  const userId = $(".user-name").attr("id");
  const userName = $(".user-name").text();
  const candidateId = $(".candidate-name").attr("id");
  const candidateName = $(".candidate-name").text();

  const messages = { userId, userName, candidateId, candidateName };

  socket.emit("desired-candidate", messages);
});

// 也喜歡對方
$("#btn-like-too").click(function (e) {
  e.preventDefault();

  if (socket === null) {
    alert("Please connect first");
    return;
  }

  const userId = $(".user-name").attr("id");
  const userName = $(".user-name").text();
  const pursuerId = $(".candidate-name").attr("id");
  const pursuerName = $(".candidate-name").text();

  const messages = { userId, userName, pursuerId, pursuerName };

  socket.emit("like-pursuer", messages);
});

// TODO: 不喜歡對方
$("#unlike").click(function (e) {
  e.preventDefault();

  if (socket === null) {
    alert("Please connect first");
    return;
  }

  const userId = $(".user-name").attr("id");
  const userName = $(".user-name").text();
  const unlikeId = $(".candidate-name").attr("id");
  const unlikeName = $(".candidate-name").text();

  const messages = { userId, userName, unlikeId, unlikeName };

  socket.emit("unlike", messages);
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
  $("#message").val("");
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

// 搜尋對話的關鍵字 (使用 socketIO 直接下 ES 指令??)
$("#btn-search").click(function (e) {
  e.preventDefault();

  if (socket === null) {
    alert("Please connect first");
    return;
  }

  // 移除先前搜尋結果
  $(".search-message").remove();

  const userId = +$(".user-name").attr("id");
  const partnerId = +$(".other-side").attr("id");
  const keyword = $("#keyword").val();
  const messages = { userId, partnerId, keyword };
  console.log("messages", messages);

  socket.emit("search", messages);
});

// 當關閉搜尋結果，會返回目前聊天者資訊
$("#cross").click(function () {
  // 更換標題
  $("#current #more-info h3").text("目前聊天者資訊");
  $("#partner-info").css("display", "block");

  // 移除搜尋結果
  $(".search-message").remove();

  // 隱藏取消圖示
  $("#cross").css("display", "none");
});

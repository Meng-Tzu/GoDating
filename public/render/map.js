// ----------------------- Function 區塊 --------------------------

// Function1: 取得 API 資料
const getApi = async (url) => {
  let response = await fetch(url);
  response = await response.json();

  return response.data;
};

// FIXME: Function2: 動態製造 DOM 物件 (和 match 的方式不一樣)
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
    $newDom.attr("value", id).text(users[id].name).css("display", "inline");

    // 把新的 option 加入 parant element
    $newDom.appendTo($parent);
  }
};

// ------------------------------ 前端渲染區塊 --------------------------------

// 取得所有使用者 id 和 nickname
const allUsersUrl = `/api/1.0/user/userslist`;
const userIdNicknamePair = {}; // {id: nickname}

(async () => {
  // 取得所有使用者
  const idNameList = await getApi(allUsersUrl);
  idNameList.forEach((userObj) => {
    const name = userObj.nick_name;
    const coordinate = userObj.coordinate;
    userIdNicknamePair[userObj.id] = { name, coordinate };
  });

  // 動態產生下拉式選單的選項
  await createUserOption(userIdNicknamePair, "user");
})();

// ----------------------- Dispaly Map ---------------------------
$("#btnSearch").click(function (e) {
  e.preventDefault();

  // 取得是誰上線
  const id = +$("#users").val();
  const name = $("#users option:selected").text();

  // 取得使用者位置
  const userCoordinate = JSON.parse(userIdNicknamePair[id].coordinate);

  // 更換地圖中心點為使用者位置
  const zoom = 14;
  const map = L.map("map").setView(userCoordinate, zoom);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, // 最大可放大的 scale
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // TODO: 客製 school Maker 圖示 (更換照片來源)
  const userIcon = L.icon({
    iconUrl: "/test1.jpg",
    iconSize: [42, 42],
  });

  // add marker of user position
  const userMarker = L.marker(userCoordinate, {
    icon: userIcon,
  }).addTo(map);

  // display range
  const circle = L.circle(userCoordinate, {
    color: "#3f8aff",
    fillColor: "#3f8aff",
    fillOpacity: 0.5,
    radius: 1500,
  }).addTo(map);

  // popup setting user
  userMarker.bindPopup(`<b>${name}</b><br>You are here !!!`).openPopup();

  // mark candidate position
  (async () => {
    // 取得所有連線者的候選人名單
    const candidatesUrl = `/api/1.0/user/matchcandidate`;
    const userCandidateList = await getApi(candidatesUrl);
    const userIdCandidateIdPair = {}; // {id: candidateList}
    userCandidateList.forEach((userObj) => {
      userIdCandidateIdPair[userObj.id] = userObj.candidateIdList;
    });

    // 取得該連線者的候選人名單
    const certainCandidateList = userIdCandidateIdPair[id];
    certainCandidateList.forEach((candidateId) => {
      const candidateName = userIdNicknamePair[candidateId].name;
      // 取得候選人位置
      const candidateCoordinate = JSON.parse(
        userIdNicknamePair[candidateId].coordinate
      );

      // add marker of user position
      const candidateMarker = L.marker(candidateCoordinate).addTo(map);
      // TODO: tooltip setting of candidate (更換照片來源)
      candidateMarker
        .bindTooltip(
          `<b>${candidateName}</b></br><img src="/test1.jpg" style="height: 20px">`,
          {
            direction: "bottom", // default: auto
            sticky: false, // true 跟著滑鼠移動。default: false
            permanent: false, // 是滑鼠移過才出現(false)，還是一直出現(true)
            opacity: 1.0,
          }
        )
        .openTooltip();
    });
  })();

  // 客製 school Maker 圖示
  const school = [25.0384803, 121.5323711]; // AppWorks School
  const schoolIcon = L.icon({
    iconUrl:
      "https://school.appworks.tw/wp-content/uploads/2018/09/cropped-AppWorks-School-Logo-thumb.png",
    iconSize: [42, 42],
  });

  // add marker of school position
  const schoolMarker = L.marker(school, {
    icon: schoolIcon,
  }).addTo(map);
});

// FIXME: 取得所有人的位置
// const allUsersUrl = `/api/1.0/user/userslist`;
// (async () => {
//   // 取得所有使用者的位置
//   const idCoordinateList = await getApi(allUsersUrl);
//   idCoordinateList.forEach((user) => {
//     // mark setting
//     const position = JSON.parse(user.coordinate);
//     const otherMark = L.marker(position).addTo(map);

//     // tooltip setting
//     otherMark
//       .bindTooltip(`<b>${user.nick_name}</b>`, {
//         direction: "bottom", // right、left、top、bottom、center。default: auto
//         sticky: false, // true 跟著滑鼠移動。default: false
//         permanent: false, // 是滑鼠移過才出現，還是一直出現
//         opacity: 1.0,
//       })
//       .openTooltip();
//   });
// })();

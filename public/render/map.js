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

// FIXME: 顯示地圖中心點
const markCenter = (userCoordinate, zoom, name) => {
  // 更換地圖中心點為使用者位置
  const map = L.map("map").setView(userCoordinate, zoom);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, // 最大可放大的 scale
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // TODO: 客製 user Maker 圖示 (更換照片來源)
  const userIcon = L.icon({
    iconUrl: "/test1.jpg",
    iconSize: [42, 42],
  });

  // add marker of user position
  const userMarker = L.marker(userCoordinate, {
    icon: userIcon,
  }).addTo(map);

  // popup setting user
  if (name === "台北車站") {
    userMarker.bindPopup(`<b>台北車站</b>`).openPopup();
  } else {
    userMarker.bindPopup(`<b>${name}</b><br>你在這！`).openPopup();
  }

  // TODO: 客製化 display range
  L.circle(userCoordinate, {
    color: "#3f8aff",
    fillColor: "#3f8aff",
    fillOpacity: 0.5,
    radius: 1500,
  }).addTo(map);
};

// Function3: 顯示地圖中心位置
const showMyLocation = (zoom, name) => {
  if (!navigator.geolocation) {
    Swal.fire({
      icon: "info",
      title: "您的瀏覽器不支援取得當前位置",
      text: "搜尋中心預設為台北車站",
    });

    markCenter([25.0480075, 121.5170613], zoom, "台北車站");
    return;
  }

  function success(position) {
    const userCoordinate = [
      position.coords.latitude,
      position.coords.longitude,
    ];

    markCenter(userCoordinate, zoom, name);
  }

  function error() {
    Swal.fire({
      icon: "info",
      title: "無法取得您的位置",
      text: "搜尋中心預設為台北車站",
    });

    markCenter([25.0480075, 121.5170613], zoom, "台北車站");
  }

  navigator.geolocation.getCurrentPosition(success, error);
};

// ------------------------------ 前端渲染區塊 --------------------------------

// TODO: 取得所有使用者 id 和 nickname (不需要下拉選單)
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

// ----------------------- Display Map ---------------------------
$("#btnSearch").click(function (e) {
  e.preventDefault();

  // 取得是誰上線
  const id = +$("#users").val();
  const name = $("#users option:selected").text();
  const zoom = 14;

  // 取得使用者位置
  showMyLocation(zoom, name);

  // mark candidate position
  // (async () => {
  //   // 取得所有連線者的候選人名單
  //   const candidatesUrl = `/api/1.0/user/matchcandidate`;
  //   const userCandidateList = await getApi(candidatesUrl);
  //   const userIdCandidateIdPair = {}; // {id: candidateList}
  //   userCandidateList.forEach((userObj) => {
  //     userIdCandidateIdPair[userObj.id] = userObj.candidateIdList;
  //   });

  //   // 取得該連線者的候選人名單
  //   const certainCandidateList = userIdCandidateIdPair[id];
  //   certainCandidateList.forEach((candidateId) => {
  //     const candidateName = userIdNicknamePair[candidateId].name;
  //     // 取得候選人位置
  //     const candidateCoordinate = JSON.parse(
  //       userIdNicknamePair[candidateId].coordinate
  //     );

  //     // add marker of user position
  //     const candidateMarker = L.marker(candidateCoordinate).addTo(map);
  //     // TODO: tooltip setting of candidate (更換照片來源)
  //     candidateMarker
  //       .bindTooltip(
  //         `<b>${candidateName}</b></br><img src="/test1.jpg" style="height: 20px">`,
  //         {
  //           direction: "bottom", // default: auto
  //           sticky: false, // true 跟著滑鼠移動。default: false
  //           permanent: false, // 是滑鼠移過才出現(false)，還是一直出現(true)
  //           opacity: 1.0,
  //         }
  //       )
  //       .openTooltip();
  //   });
  // })();
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

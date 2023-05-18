// Function1: 取得 API 資料
const getApi = async (url, option) => {
  let response = await fetch(url, option);
  response = await response.json();

  return response.data;
};

// FIXME: Function1: 取得 API 資料 (驗證有無錯誤的方式很怪)
const getError = async (url, option) => {
  let response = await fetch(url, option);
  response = await response.json();

  if (response.error) {
    return response.error;
  }

  // 如果輸入格式都沒有錯誤
  if (!response.errors) {
    return null;
  }

  // FIXME: 沒有照片 (回覆的方式怪怪的)
  if (response.errors.length) {
    console.log("沒有照片");
    return "尚未填寫完畢喔！";
  }
};

// 從 JWT token 取得使用者 id 去做 socketIO 連線
const token = localStorage.getItem("token");

let userApi = "/api/1.0/user/verify";
let fetchOption = {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: "",
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
    const { id, name } = userData;
    $(".user-name").text(name).attr("id", id);
  }
})();

$("#match-info").click(async function () {
  // 送出表單時再次驗證
  const userData = await getApi(userApi, fetchOption);
  if (!userData) {
    // token 錯誤
    alert("Sorry, you need to sign up / sign in again.");
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  }

  let formData = new FormData();
  formData.append("userId", $(".user-name").attr("id"));
  formData.append("picture", $("#picture")[0].files[0]);
  formData.append("birthday", $("#birthday").val());
  formData.append("sexId", $("input[name='sex']:checked").val());
  formData.append(
    "orientationId",
    $("input[name='sexual-orientation']:checked").val()
  );
  formData.append("seekAgeMin", $("#slider-range").slider("values", 0));
  formData.append("seekAgeMax", $("#slider-range").slider("values", 1));
  formData.append("selfIntro", $("#self-intro").val());

  // FIXME: 把新註冊者詳細資訊存進 DB (驗證照片錯誤提示沒有出現)

  // 確認 formData 內的資料
  // for (const pair of formData.entries()) {
  //   console.log(pair[0], pair[1]);
  // }

  fetchOption.body = formData;
  userApi = "/api/1.0/user/profile";

  const error = await getError(userApi, fetchOption);
  if (error) {
    if (error === "尚未填寫完畢喔！") {
      Swal.fire({
        icon: "error",
        title: "尚未填寫完畢喔！",
      });
      userApi = "/api/1.0/user/verify";
      return;
    } else if (error === "File must be an image") {
      Swal.fire({
        icon: "error",
        title: "個人照格式錯誤",
        text: "僅限上傳 jpg, jpeg, png 格式的照片",
      });
      userApi = "/api/1.0/user/verify";
      return;
    } else if (error === "Image is required") {
      Swal.fire({
        icon: "error",
        title: "您沒有上傳個人照喔喔喔喔！",
      });
      userApi = "/api/1.0/user/verify";
      return;
    }
  }

  // 使者資訊存進資料庫
  const result = await getApi(userApi, fetchOption);
  if (result === "error: Image is required.") {
    Swal.fire({
      icon: "error",
      title: "您沒有上傳個人照喔！",
    });
    userApi = "/api/1.0/user/verify";
    return;
  }

  // 選擇標籤 (與詳細資訊表單合併)
  const tagApi = "/api/1.0/user/tags";
  fetchOption = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: "",
  };

  const tags = {
    userid: $(".user-name").attr("id"),
    tags: $("#tags-selected").val(),
  };
  fetchOption.body = JSON.stringify(tags);
  await getApi(tagApi, fetchOption);

  // 取得新註冊者的 candidate list
  const data = { newuserid: $(".user-name").attr("id") };
  fetchOption = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: "",
  };
  fetchOption.body = JSON.stringify(data);

  const matchApi = "/api/1.0/match/newone";
  const candidateListOfNewUser = await getApi(matchApi, fetchOption);

  // TODO: 配對條件沒有任何人符合，建議更改條件 (沒有被觸發?) (sweet alert)
  if ("error" in candidateListOfNewUser) {
    // alert(candidateListOfNewUser.error);
    Swal.fire({
      icon: "error",
      title: candidateListOfNewUser.error,
      text: "是否要再更改配對條件？",
    });
    return;
  }

  // 新註冊者的資料存到 localstorage (sweet alert)
  const update = {
    newUserId: candidateListOfNewUser.userId,
    otherUserIdsList: candidateListOfNewUser.potentialListOfCertainUser,
  };
  localStorage.setItem("update", JSON.stringify(update));

  // alert(`${response} \n ${saveTagsStatus} \n 感謝您填寫問卷！`);
  Swal.fire("感謝您填寫問卷！", "馬上進行探索吧！", "success").then(() => {
    window.location.href = "/";
  });
});

// 點擊右上個人照人名跳重整 profile page
$("#profile").click(function () {
  window.location.href = "/profile.html";
});

// 登出
$("#logout").click(function () {
  localStorage.removeItem("token");
  window.location.href = "/profile.html";
});

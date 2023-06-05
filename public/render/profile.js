// Function1: 取得 API 資料
const getApi = async (url, option) => {
  let response = await fetch(url, option);
  response = await response.json();

  if (response.error) {
    return response.error;
  }

  if (response.errors) {
    return response.errors[0].msg;
  }

  return response.data;
};

// Function2: 動態增加 tags
const addTags = (detailInfo) => {
  const $dropDownMenu = $("#drop-down-menu");
  $dropDownMenu.empty().css("flex-direction", "row");

  const $div = $("<div>");
  $div.addClass(
    "flex justify-center items-center m-1 font-medium py-1 px-2 bg-white rounded-full text-teal-700 bg-teal-100 border border-teal-300 "
  );

  for (const tag of detailInfo.tagList) {
    const $newDom = $div.clone();
    $newDom.text(tag.title);
    $dropDownMenu.append($newDom);
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
  if (userData === "Wrong token.") {
    // token 錯誤
    Swal.fire({
      icon: "warning",
      title: "您尚未登入喔！",
      text: "請再嘗試登入 / 註冊",
    }).then(() => {
      localStorage.removeItem("token");
      window.location.href = "/login.html";
      return;
    });
  } else {
    const { id, name } = userData;
    $(".user-name").text(name).attr("id", id);
  }

  const profileApi = "/api/1.0/user/profile";
  const isProfileExist = await getApi(profileApi, fetchOption);
  $("#loading").hide();
  $("#content").css("display", "block");

  if (isProfileExist === "Detail user-info already existed.") {
    $("#match-info").hide();
    $(".avatar-edit").hide();
    $("#birthday").prop("disabled", true);
    $("input[type=radio]").attr("disabled", true);
    $("ul li").css("pointer-events", "none");
    $("#self-intro").prop("disabled", true);
    $("#slider-range").hide();
    $("#title").text("我的檔案");
    $("#picture-label").text("個人照");
    $("#tag-label").text("個性化標籤");

    const detailInfoApi = "/api/1.0/user/detailinfo";
    const detailInfo = await getApi(detailInfoApi, fetchOption);
    $("#imagePreview").css("background-image", `url(${detailInfo.main_image})`);
    $("#birthday").val(detailInfo.birthday);
    if (detailInfo.sex_id === 1) {
      $("#male-option").prop("checked", true);
    } else if (detailInfo.sex_id === 2) {
      $("#female-option").prop("checked", true);
    }

    if (detailInfo.orientation_id === 1) {
      $("#hetro-option").prop("checked", true);
    } else if (detailInfo.orientation_id === 2) {
      $("#homo-option").prop("checked", true);
    } else if (detailInfo.orientation_id === 3) {
      $("#bio-option").prop("checked", true);
    } else if (detailInfo.orientation_id === 4) {
      $("#explore-option").prop("checked", true);
    }
    addTags(detailInfo);
    $("#amount").val(
      detailInfo.seek_age_min + "歲 ～ " + detailInfo.seek_age_max + " 歲"
    );
    $("#self-intro").text(detailInfo.self_intro);

    return;
  }
})();

let formData;
$("#match-info").click(async function () {
  // 送出表單時再次驗證
  fetchOption = {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: "",
  };

  const userData = await getApi(userApi, fetchOption);

  if (!userData) {
    // token 錯誤
    alert("Sorry, you need to sign up / sign in again.");
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  }

  formData = new FormData();
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
  userApi = "/api/1.0/user/survey";

  // 使者資訊存進資料庫
  const result = await getApi(userApi, fetchOption);
  if (result === "error: Image is required.") {
    Swal.fire({
      icon: "error",
      title: "您沒有上傳個人照喔！",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (result === "birthday is required.") {
    Swal.fire({
      icon: "error",
      title: "尚未填寫完畢喔！",
      text: "請選擇生日日期",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (result === "sexId is required.") {
    Swal.fire({
      icon: "error",
      title: "尚未填寫完畢喔！",
      text: "請選擇性別",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (result === "orientationId is required.") {
    Swal.fire({
      icon: "error",
      title: "尚未填寫完畢喔！",
      text: "請選擇性傾向",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (result === "seeking min-age is required.") {
    Swal.fire({
      icon: "error",
      title: "尚未填寫完畢喔！",
      text: "請選擇尋找的年齡範圍",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (result === "seeking max-age is required.") {
    Swal.fire({
      icon: "error",
      title: "尚未填寫完畢喔！",
      text: "請選擇尋找的年齡範圍",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (result === "selfIntro is required.") {
    Swal.fire({
      icon: "error",
      title: "尚未填寫完畢喔！",
      text: "請填寫自我介紹",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (result === "File must be an image") {
    Swal.fire({
      icon: "error",
      title: "個人照格式錯誤",
      text: "僅限上傳 jpg, jpeg, png 格式的照片",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (result === "Image is required") {
    Swal.fire({
      icon: "error",
      title: "您沒有上傳個人照喔喔喔喔！",
    });
    userApi = "/api/1.0/user/verify";
    return;
  }

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

  // 配對條件沒有任何人符合，建議更改條件 (刪除使用者詳細資訊)
  if ("error" in candidateListOfNewUser) {
    Swal.fire({
      icon: "error",
      title: candidateListOfNewUser.error,
      text: "請確認生日日期是否小於 18 歲，或是放寬篩選條件唷！",
    });

    userApi = "/api/1.0/user/verify";
    return;
  }

  // FIXME: 選擇標籤 (等可使用標籤去排權重，再規劃重新排序候選人名單)
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

  // 新註冊者的資料存到 localstorage
  const update = {
    newUserId: candidateListOfNewUser.userId,
    otherUserIdsList: candidateListOfNewUser.potentialListOfCertainUser,
  };
  localStorage.setItem("update", JSON.stringify(update));

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

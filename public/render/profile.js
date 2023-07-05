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

let isProfileExist = "";

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
    const { id, name, image } = userData;
    if (image) {
      $("#profile-img").attr("src", `images/${image}`).css("border", "none");
    }
    $(".user-name").text(name).attr("id", id);
  }

  const profileApi = "/api/1.0/user/profile";
  isProfileExist = await getApi(profileApi, fetchOption);
  $("#loading").hide();
  $("#content").css("display", "block");

  let detailInfo;
  if (isProfileExist === "Detail user-info already existed.") {
    $(".avatar-edit").hide();
    $("#birthday").prop("disabled", true);
    $(".sex input[type=radio]").attr("disabled", true);
    $(".sex ul li").css("pointer-events", "none");
    $("#self-intro").prop("disabled", true);

    $("#title").text("我的檔案");
    $("#picture-label").text("個人照");

    const detailInfoApi = "/api/1.0/user/detailinfo";
    detailInfo = await getApi(detailInfoApi, fetchOption);
    $("#imagePreview").css("background-image", `url(${detailInfo.main_image})`);
    $("#birthday").val(detailInfo.birthday);
    if (detailInfo.sex_id === 1) {
      $("#male-option").prop("checked", true);
    } else if (detailInfo.sex_id === 2) {
      $("#female-option").prop("checked", true);
    }

    $("#self-intro").text(detailInfo.self_intro);
  }

  const candidateApi = "/api/1.0/user/candidate";
  fetchOption = {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: "",
  };
  const isCandidateExist = await getApi(candidateApi, fetchOption);
  if (isCandidateExist) {
    $("#match-info").hide();
    $(".sexual-orientation input[type=radio]").attr("disabled", true);
    $(".sexual-orientation ul li").css("pointer-events", "none");
    $("#slider-range").hide();
    $("#tag-label").text("個性化標籤");
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

  if (isProfileExist === "Detail user-info already existed.") {
    fetchOption = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: "",
    };

    let matchData = {};
    matchData.userId = $(".user-name").attr("id");
    matchData.orientationId = $(
      "input[name='sexual-orientation']:checked"
    ).val();
    matchData.seekAgeMin = $("#slider-range").slider("values", 0);
    matchData.seekAgeMax = $("#slider-range").slider("values", 1);

    fetchOption.body = JSON.stringify(matchData);

    // 把使用者配對資訊存進 DB
    userApi = "/api/1.0/user/matchinfo";

    // 使用者資訊存進資料庫
    const result = await getApi(userApi, fetchOption);

    if (result === "orientationId is required.") {
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
    }

    // 選擇標籤
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

    // 配對條件沒有任何人符合，建議更改條件，並刪除 tags
    if ("error" in candidateListOfNewUser) {
      const deleteTagsApi = "/api/1.0/user/tags";
      fetchOption.method = "DELETE";
      await getApi(deleteTagsApi, fetchOption);

      Swal.fire({
        icon: "error",
        title: candidateListOfNewUser.error,
        text: "放寬篩選條件可以遇見更多人唷！",
      });

      userApi = "/api/1.0/user/verify";
      return;
    }

    // 新註冊者的資料存到 localstorage
    const update = {
      newUserId: candidateListOfNewUser.userId,
      otherUserIdsList: candidateListOfNewUser.potentialListOfCertainUser,
    };
    localStorage.setItem("update", JSON.stringify(update));

    Swal.fire("感謝您填寫問卷！", "馬上進行探索吧！", "success").then(() => {
      window.location.href = "/main.html";
    });

    return;
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

  // 使用者資訊存進資料庫
  const checkData = await getApi(userApi, fetchOption);

  if (checkData === "error: user's age is smaller than 18.") {
    Swal.fire({
      icon: "error",
      title: "未滿 18 歲無法進行配對唷！",
      text: "請確認生日是否填寫正確",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (checkData === "error: Image is required.") {
    Swal.fire({
      icon: "error",
      title: "您沒有上傳個人照喔！",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (checkData === "birthday is required.") {
    Swal.fire({
      icon: "error",
      title: "尚未填寫完畢喔！",
      text: "請選擇生日日期",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (checkData === "sexId is required.") {
    Swal.fire({
      icon: "error",
      title: "尚未填寫完畢喔！",
      text: "請選擇性別",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (checkData === "orientationId is required.") {
    Swal.fire({
      icon: "error",
      title: "尚未填寫完畢喔！",
      text: "請選擇性傾向",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (checkData === "seeking min-age is required.") {
    Swal.fire({
      icon: "error",
      title: "尚未填寫完畢喔！",
      text: "請選擇尋找的年齡範圍",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (checkData === "seeking max-age is required.") {
    Swal.fire({
      icon: "error",
      title: "尚未填寫完畢喔！",
      text: "請選擇尋找的年齡範圍",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (checkData === "selfIntro is required.") {
    Swal.fire({
      icon: "error",
      title: "尚未填寫完畢喔！",
      text: "請填寫自我介紹",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (checkData === "File must be an image") {
    Swal.fire({
      icon: "error",
      title: "個人照格式錯誤",
      text: "僅限上傳 jpg, jpeg, png 格式的照片",
    });
    userApi = "/api/1.0/user/verify";
    return;
  } else if (checkData === "Image is required") {
    Swal.fire({
      icon: "error",
      title: "您沒有上傳個人照喔喔喔喔！",
    });
    userApi = "/api/1.0/user/verify";
    return;
  }

  // 確認是否送出表單
  Swal.fire({
    title: "確定要提交表單嗎？",
    text: "提交表單後將無法修改資料",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "提交表單",
    cancelButtonText: "取消",
  }).then(async (result) => {
    if (result.isConfirmed) {
      fetchOption = {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: "",
      };

      fetchOption.body = JSON.stringify(checkData);
      await getApi(userApi, fetchOption);

      // 選擇標籤
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

      // 配對條件沒有任何人符合，建議更改條件，並刪除 tags
      if ("error" in candidateListOfNewUser) {
        const deleteTagsApi = "/api/1.0/user/tags";
        fetchOption.method = "DELETE";
        await getApi(deleteTagsApi, fetchOption);

        Swal.fire({
          icon: "error",
          title: candidateListOfNewUser.error,
          text: "放寬篩選條件可以遇見更多人唷！",
        }).then(() => {
          location.reload();
        });

        return;
      }

      // 新註冊者的資料存到 localstorage
      const update = {
        newUserId: candidateListOfNewUser.userId,
        otherUserIdsList: candidateListOfNewUser.potentialListOfCertainUser,
      };
      localStorage.setItem("update", JSON.stringify(update));

      Swal.fire("感謝您填寫問卷！", "馬上進行探索吧！", "success").then(() => {
        window.location.href = "/main.html";
      });
    } else {
      const { pictureName } = checkData;

      fetchOption = {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pictureName }),
      };
      const deleteImageApi = "/api/1.0/user/image";
      await getApi(deleteImageApi, fetchOption);

      userApi = "/api/1.0/user/verify";
      return;
    }
  });
});

// TODO: 點擊聊天室導到聊天室頁面
$(".chatroom").click(function () {
  Swal.fire({
    icon: "info",
    title: "聊天室頁面功能待開發",
    text: "感謝您的耐心等待！",
  });
  // window.location.href = "/chatroom.html";
});

// 點擊右上個人照人名跳重整 profile page
$("#profile").click(function () {
  location.reload();
});

// 登出
$("#logout").click(function () {
  localStorage.removeItem("token");
  Swal.fire("登出成功！", "即將導回首頁", "success").then(() => {
    window.location.href = "/";
  });
});

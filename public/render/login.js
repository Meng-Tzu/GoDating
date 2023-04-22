// ----------------------- Function 區塊 --------------------------

// Function1: 取得 API 資料
const getApi = async (url, option) => {
  let response = await fetch(url, option);
  response = await response.json();

  return response.data;
};

// ------------------------------- 登入/註冊 ------------------------------

let userApi = "/api/1.0/user/";
let fetchOption = {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "",
};
let data = {};

// 當按下 signIn button
$("#signIn").on("submit", function (e) {
  e.preventDefault();

  data.inputEmail = $("#signInEmail").val();
  data.inputPassword = $("#signInPwd").val();

  fetchOption.body = JSON.stringify(data);

  userApi += "signin";

  // 立即執行函式
  (async () => {
    const userData = await getApi(userApi, fetchOption);
    if (!userData) {
      $(".signInErrorMsg")
        .css("display", "inline")
        .text("Sorry, your input is not correct.");

      userApi = "/api/1.0/user/";
    } else {
      $(".signInErrorMsg").css("display", "none");
      localStorage.setItem("token", userData.access_token);

      // 跳轉到配對首頁
      window.location.href = "/";
    }
  })();
});

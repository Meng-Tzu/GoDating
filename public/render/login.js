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

// 從登入表單轉換成註冊表單
$("#join").click(function (e) {
  e.preventDefault();
  $("#title div h3").text("註冊");
  $("#background-image").css("background-image", "url(./images/signup.jpg)");

  $("#nickname").css("display", "");
  $("#nickname").children("input").prop("required", true);

  const $submitBtn = $("#bnt-login").children("button");
  $submitBtn.text("開始一趟新旅程！");

  $(".text-center")
    .contents()
    .filter(function () {
      return this.nodeType == 3;
    })
    .first()
    .replaceWith("已經是會員了嗎？");

  $(this).css("display", "none");
  $("#member").css("display", "inline");
});

// 從註冊表單轉換成登入表單
$("#member").click(function (e) {
  e.preventDefault();
  $("#title div h3").text("登入");
  $("#background-image").css("background-image", "url(./images/signin.jpg)");

  $("#nickname").css("display", "none");
  $("#nickname").children("input").prop("required", false);

  const $submitBtn = $("#bnt-login").children("button");
  $submitBtn.text("出發吧！");

  $(".text-center")
    .contents()
    .filter(function () {
      return this.nodeType == 3;
    })
    .first()
    .replaceWith("還不是會員嗎？");
  // $(".text-center").text("還不是會員嗎？");
  $(this).css("display", "none");
  $("#join").css("display", "inline");
});

// 當按下 login button
$("#login").on("submit", function (e) {
  e.preventDefault();

  data.inputEmail = $("#loginEmail").val();
  data.inputPassword = $("#loginPwd").val();

  fetchOption.body = JSON.stringify(data);

  // 以是否有填暱稱來判斷是登入或註冊
  if (!$("#loginName").val()) {
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
  } else {
    data.inputName = $("#loginName").val();
    fetchOption.body = JSON.stringify(data);

    userApi += "signup";

    // 立即執行函式
    (async () => {
      const userData = await getApi(userApi, fetchOption);
      if (!userData) {
        $(".signUpErrorMsg")
          .css("display", "inline")
          .text("Sorry, your input is not correct.");

        userApi = "/api/1.0/user/";
      } else {
        $(".signUpErrorMsg").css("display", "none");
        localStorage.setItem("token", userData.access_token);

        // 跳轉到個人頁面填寫問卷
        window.location.href = "/profile.html";
      }
    })();
  }
});

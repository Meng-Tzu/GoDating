// ----------------------- Function 區塊 --------------------------

// Function1: 取得 API 資料
const getApi = async (url, option) => {
  let response = await fetch(url, option);
  response = await response.json();

  // FIXME: 帳號已註冊過 (回覆的方式怪怪的)
  if (response.error) {
    return response.error;
  }

  // FIXME: 格式錯誤 (回覆的方式怪怪的)
  if (response.errors) {
    return "輸入格式錯誤";
  }

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
  $("#title").text("註冊");
  $("#background-image").css("background-image", "url(./images/signup.jpg)");

  $("#nickname").css("display", "");
  $("#nickname").children("input").prop("required", true);
  $("#loginEmail").val("");
  $("#loginPwd").val("");

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
  $("#title").text("登入");
  $("#background-image").css("background-image", "url(./images/signin.jpg)");

  $("#nickname").css("display", "none");
  $("#loginName").val("");
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

// 當按下 login button (錯誤訊息顯示)
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
      if (userData === "Sorry, your input is not correct.") {
        Swal.fire({
          icon: "error",
          title: "輸入錯誤",
          text: "請確認帳號密碼輸入是否正確",
        });

        userApi = "/api/1.0/user/";
        return;
      } else if (userData === "輸入格式錯誤") {
        Swal.fire({
          icon: "error",
          title: "格式輸入錯誤",
          text: "請確認帳號密碼輸入格式是否正確",
        });

        userApi = "/api/1.0/user/";
        return;
      }

      localStorage.setItem("token", userData.access_token);

      // 跳轉到配對首頁
      window.location.href = "/main.html";
    })();
  } else {
    data.inputName = $("#loginName").val();
    fetchOption.body = JSON.stringify(data);

    userApi += "signup";

    // 立即執行函式 (顯示錯誤訊息)
    (async () => {
      const userData = await getApi(userApi, fetchOption);

      if (userData === "Email Already Exists.") {
        Swal.fire({
          icon: "error",
          title: "已註冊過的帳號",
          text: "請直接登入，或輸入新帳號重新註冊",
        });

        userApi = "/api/1.0/user/";
        return;
      } else if (userData === "輸入格式錯誤") {
        Swal.fire({
          icon: "error",
          title: "格式輸入錯誤",
          text: "請確認帳號密碼輸入格式是否正確",
        });

        userApi = "/api/1.0/user/";
        return;
      }

      localStorage.setItem("token", userData.access_token);

      // 跳轉到個人頁面填寫問卷
      window.location.href = "/profile.html";
    })();
  }
});

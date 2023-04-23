// Function1: 取得 API 資料
const getApi = async (url, option) => {
  let response = await fetch(url, option);
  response = await response.json();

  return response.data;
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
    const { id, name, email } = userData;
    $(".user-name").text(name).attr("id", id);
  }
})();

$("#match-info").click(async function (e) {
  e.preventDefault();

  let formData = new FormData();
  formData.append("userId", $(".user-name").attr("id"));
  formData.append("picture", $("#picture")[0].files[0]);
  formData.append("birthday", $("#birthday").val());
  formData.append("sexId", $("#sex-id option:selected").val());
  formData.append(
    "orientationId",
    $("#sexual-orientation-id option:selected").val()
  );
  formData.append("seekAgeMin", $("#seek-age-min").val());
  formData.append("seekAgeMax", $("#seek-age-max").val());
  formData.append("selfIntro", $("#self-intro").val());

  fetchOption.body = formData;
  userApi = "/api/1.0/user/profile";

  const response = await getApi(userApi, fetchOption);
  alert(response);

  // 更新配對名單
  fetchOption = {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  };
  const matchApi = "/api/1.0/match/candidate";
  const update = await getApi(matchApi, fetchOption);
  console.log("update", update);

  location.reload();
});

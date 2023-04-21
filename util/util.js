// Function1: 計算的年齡
const getAge = (dateString) => {
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  // 如果今天還沒到自己的生日月份，或還沒到自己生日當天，age 要減一歲
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export { getAge };

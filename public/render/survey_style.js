function readURL(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function (e) {
      $("#imagePreview").css(
        "background-image",
        "url(" + e.target.result + ")"
      );
      $("#imagePreview").hide();
      $("#imagePreview").fadeIn(650);
    };
    reader.readAsDataURL(input.files[0]);
  }
}
$("#picture").change(function () {
  readURL(this);
});

// 生日設定
$("#example2").calendar({
  type: "date",
});

// 個性化標籤設定
function dropdown() {
  return {
    options: [],
    selected: [],
    show: false,
    open() {
      this.show = true;
    },
    close() {
      this.show = false;
    },
    isOpen() {
      return this.show === true;
    },
    select(index, event) {
      if (!this.options[index].selected) {
        this.options[index].selected = true;
        this.options[index].element = event.target;
        this.selected.push(index);
      } else {
        this.selected.splice(this.selected.lastIndexOf(index), 1);
        this.options[index].selected = false;
      }
    },
    remove(index, option) {
      this.options[option].selected = false;
      this.selected.splice(index, 1);
    },
    loadOptions() {
      const options = document.getElementById("tags-select").options;
      for (let i = 0; i < options.length; i++) {
        this.options.push({
          value: options[i].value,
          text: options[i].innerText,
          selected:
            options[i].getAttribute("selected") != null
              ? options[i].getAttribute("selected")
              : false,
        });
      }
    },
    selectedValues() {
      return this.selected.map((option) => {
        return this.options[option].value;
      });
    },
  };
}

// 尋找年齡範圍
$(function () {
  $("#slider-range").slider({
    range: true,
    min: 18,
    max: 60,
    values: [20, 30],
    slide: function (event, ui) {
      $("#amount").val(ui.values[0] + " 歲 ～ " + ui.values[1] + " 歲");
    },
  });

  $("#amount").val(
    $("#slider-range").slider("values", 0) +
      "歲 ～ " +
      $("#slider-range").slider("values", 1) +
      " 歲"
  );
});

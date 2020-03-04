let E;

const _ = e => document.querySelector(e);

const loader = status =>
  _("#loader").classList[status ? "remove" : "add"]("hide");

(E = _("#download")) &&
  E.addEventListener("click", () => {
    html2canvas(_("#badge"), {
      backgroundColor: null
    }).then(canvas => {
      const a = _("#download-link");
      a.href = canvas.toDataURL("image/png");
      a.click();
    });
  });

(E = _("#form")) &&
  E.addEventListener("submit", async e => {
    e.preventDefault();
    loader(true);
    const formData = new FormData();
    e.target.querySelectorAll("input").forEach(item => {
      const { value, name, type, files } = item;
      formData.append(name, type === "file" ? files[0] : value);
    });
    try {
      const { data } = await axios({
        method: "POST",
        data: formData,
        url: "/generate",
        responseType: "stream",
        responseEncoding: "base64"
      });
      var file = new File([data], "Riverwoodswitch-badge.png", {
        type: "image/png;charset=base64"
      });
      saveAs(file);
      loader(false);
      // window.location.reload();
    } catch (err) {
      const { response } = err;
      loader(false);
      return alert(response ? response.data : err);
    }
  });

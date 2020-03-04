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
      const a = _("#download-image");
      a.href = `data:image/png;base64,${data}`;
      a.click();
      loader(false);
      window.location.reload();
    } catch (err) {
      return alert(err.response.data);
    }
  });

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
    const res = await fetch("/", { method: "POST", body: formData });
    const resp = await res.json();
    const { status, message } = resp;
    return status.toLowerCase() === "success"
      ? window.open(`/${message}`, "_self")
      : loader(false);
  });

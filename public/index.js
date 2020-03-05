let E;

const _ = e => document.querySelector(e);

const serverStatus = type => ({ loaded, total }) => {
  return loaderText(type, Math.floor((loaded / total) * 100));
};

const loader = status =>
  _("#loader").classList[status ? "remove" : "add"]("hide");

const loaderText = (type, percent) => {
  _("#loader-type").textContent = type;
  _("#loader-percent").textContent = `${percent}%`;
  return;
};

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
        onUploadProgress: serverStatus("Uploading..."),
        onDownloadProgress: serverStatus("Downloading...")
      });
      const byteString = atob(data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i += 1) {
        ia[i] = byteString.charCodeAt(i);
      }
      const newBlob = new Blob([ab], {
        type: "image/png"
      });

      const newFile = new File([newBlob], "Riverwoodswitch-badge.png", {
        type: "image/png",
        lastModified: Date.now()
      });
      saveAs(newFile);
      loader(false);
      window.location.reload();
    } catch (err) {
      const { response } = err;
      loader(false);
      return alert(response ? response.data : err);
    }
  });

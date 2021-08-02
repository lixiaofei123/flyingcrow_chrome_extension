window.onload = function () {
  let saveBtn = document.getElementById("saveBtn");
  let copyLink = document.getElementById("copyLink");
  saveBtn.addEventListener("click", () => {
    testConnection();
  });
  copyLink.addEventListener("click", () => {
    let textarea = document.getElementById("fromurltext");
    navigator.clipboard
      .writeText(textarea.value)
      .then(() => {
        copyinfo("复制成功，现在您可以粘贴了");
        chrome.storage.sync.set({ fromurl: "" });
      })
      .catch(() => {
        copyerror("复制失败，请手动复制");
      });
  });
  chrome.storage.sync.get(["url", "token", "fromurl"], function (result) {
    document.getElementById("server").value = result.url;
    document.getElementById("token").value = result.token;
    testConnection();
    if (result.fromurl !== "") {
      showFromUrl(result.fromurl);
    } else {
      hiddenFromUrl();
    }
  });
  chrome.browserAction.setIcon({ path: "flyingcrow.png" });
};

function testConnection() {
  let url = document.getElementById("server").value;
  let token = document.getElementById("token").value;
  chrome.storage.sync.set({ url: url, token: token }, function () {
    loadUserInfo(
      url,
      token,
      (data) => {
        setUserInfo(data);
      },
      () => {
        error("无法与服务器建立连接");
      }
    );
  });
}

function loadUserInfo(url, token, success, error) {
  success = success || function () {};
  error = error || function () {};
  const xhttp = new XMLHttpRequest();
  xhttp.onload = function () {
    let data = JSON.parse(this.responseText);
    if (data.code === 200) {
      success(data.data);
    }
  };
  xhttp.onerror = function () {
    error();
  };
  xhttp.open("GET", `${url}/api/user/my?token=${token}`, true);
  xhttp.send();
}

function info(text) {
  let saveinfo = document.getElementById("saveinfo");
  saveinfo.style.color = "#409eff";
  saveinfo.innerText = text;
}

function error(text) {
  let saveinfo = document.getElementById("saveinfo");
  saveinfo.style.color = "#f56c6c";
  saveinfo.innerText = text;
}

function copyinfo(text) {
  let copyinfo = document.getElementById("copyinfo");
  copyinfo.style.color = "#409eff";
  copyinfo.innerText = text;
}

function copyerror(text) {
  let copyinfo = document.getElementById("copyinfo");
  copyinfo.style.color = "#f56c6c";
  copyinfo.innerText = text;
}

function showFromUrl(url) {
  let fromurlBox = document.getElementById("fromurlBox");
  let textarea = document.getElementById("fromurltext");
  textarea.value = url;
  fromurlBox.style.display = "block";
}

function hiddenFromUrl() {
  fromurlBox.style.display = "none";
}

function setUserInfo(data) {
  let nickName = data.user.nickName || data.user.name;
  let storageQuota = data.user.storageQuota;
  let trafficQuota = data.user.trafficQuota;
  let usedStorage = data.stat.usedStorage;
  let usedTraffic = data.stat.usedTraffic;
  let fileCount = data.stat.fileCount;

  document.getElementById("name").innerText = nickName;
  document.getElementById("filecount").innerText = fileCount;

  let storageUsedPercent = (usedStorage / 1024 / 1024 / storageQuota).toFixed(
    2
  );
  let trafficUsedPercent = (usedTraffic / 1024 / 1024 / trafficQuota).toFixed(
    2
  );

  document.getElementById("storage_progress").style.width =
    storageUsedPercent + "%";
  document.getElementById("storage_progress_text").innerText =
    wellSize(usedStorage) + "/" + wellSize(storageQuota * 1024* 1024);

  document.getElementById("traffic_progress").style.width =
    trafficUsedPercent + "%";
  document.getElementById("traffic_progress_text").innerText =
    wellSize(usedTraffic) + "/" + wellSize(trafficQuota * 1024* 1024);

  document.getElementById("userfo").style.display = "block";
}

function hideUserInfo(data) {
  document.getElementById("userfo").style.display = "none";
}

function wellSize(size) {
  if (size <= 1024) {
    // byte
    return size + " Byte";
  } else if (size <= 1024 * 1024) {
    return (size / 1024).toFixed(2) + " KB";
  } else if (size <= 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + " MB";
  } else if (size <= 1024 * 1024 * 1024 * 1024) {
    return (size / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  } else {
    return (size / (1024 * 1024 * 1024 * 1024)).toFixed(2) + " TB";
  }
}

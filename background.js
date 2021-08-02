function setUpContextMenus() {
  chrome.contextMenus.create({
    title: "用飞鸦下载",
    type: "normal",
    id: "flying_crow_download",
    contexts: ["link", "image"],
  });
  chrome.contextMenus.create({
    title: "转换为飞鸦链接",
    type: "normal",
    id: "flying_crow_to_link",
    contexts: ["image"],
  });
}

chrome.runtime.onInstalled.addListener(() => {
  setUpContextMenus();
});

function download(url) {
  chrome.storage.sync.get(["url", "token"], function (result) {
    if (result.url === "") {
      notify("飞鸦提醒", `请先设置url和token`);
    } else {
      let serverurl = result.url;
      let token = result.token;
      const xhttp = new XMLHttpRequest();
      xhttp.onload = function () {
        let data = JSON.parse(this.responseText);
        if (data.code === 200) {
          notify(
            "飞鸦提醒",
            "您的下载已经成功提交到服务器上去进行，您可以登录到飞鸦控制台查看相应任务"
          );
        } else {
          notify("飞鸦提醒", `任务提交失败，原因是${data.reason}`);
        }
      };
      xhttp.onerror = function () {
        notify("飞鸦提醒", `任务提交失败`);
      };
      xhttp.open("POST", `${serverurl}/api/download`, true);
      xhttp.setRequestHeader(
        "Content-Type",
        "application/x-www-form-urlencoded"
      );
      xhttp.send(`token=${token}&url=${url}`);
    }
  });
}

function uploadFromUrl(url,referer, successback) {
  chrome.storage.sync.get(["url", "token"], function (result) {
    if (result.url === "") {
      notify("飞鸦提醒", `请先设置url和token`);
    } else {
      let serverurl = result.url;
      let token = result.token;
      successback = successback || function () {};
      const xhttp = new XMLHttpRequest();
      xhttp.onload = function () {
        let data = JSON.parse(this.responseText);
        if (data.code === 200) {
          let filePath = data.data.filePath;
          let fileName = data.data.fileName;
          getFileByPath(`${filePath}/${fileName}`, successback);
        }
      };
      xhttp.open("POST", `${serverurl}/file/fromurl`, true);
      xhttp.setRequestHeader(
        "Content-Type",
        "application/x-www-form-urlencoded"
      );
      xhttp.send(`token=${token}&url=${url}&referer=${referer}`);
    }
  });
}

function getFileByPath(path, successback) {
  chrome.storage.sync.get(["url", "token"], function (result) {
    if (result.url === "") {
      notify("飞鸦提醒", `请先设置url和token`);
    } else {
      let serverurl = result.url;
      let token = result.token;
      successback = successback || function () {};
      const xhttp = new XMLHttpRequest();
      xhttp.onload = function () {
        let data = JSON.parse(this.responseText);
        if (data.code === 200) {
          let urls = data.data.urls;
          if (urls.length > 0) {
            successback(urls[urls.length - 1]);
          }
        }
      };
      xhttp.open(
        "GET",
        `${serverurl}/api/file/file?token=${token}&path=${path}`,
        true
      );
      xhttp.send();
    }
  });
}

function notify(title, message, callback) {
  callback = callback || function () {};
  chrome.notifications.create(
    `flying_crow_download_quit_${new Date().getTime()}`,
    {
      title: title,
      type: "basic",
      iconUrl: "flyingcrow.png",
      message: message,
    },
    callback
  );
}

chrome.downloads.onCreated.addListener(function (item) {
  if (item.bytesReceived === 0) {
    chrome.notifications.create(
      `flying_crow_download_${item.finalUrl}`,
      {
        title: "发现您正在下载",
        type: "basic",
        iconUrl: "flyingcrow.png",
        message: "是否将其加入到Flying Crow的离线下载任务中",
        buttons: [
          {
            title: "立即下载",
          },
          {
            title: "不再提醒",
          },
        ],
      },
      function () {}
    );
  }
});
chrome.contextMenus.onClicked.addListener(function (itemData) {
  if (itemData.menuItemId === "flying_crow_download") {
    let srcUrl = itemData.srcUrl || itemData.linkUrl;
    if (srcUrl) {
      if (srcUrl.indexOf("http://") === 0 || srcUrl.indexOf("https://") === 0) {
        download(srcUrl);
      }
    }
  } else if (itemData.menuItemId === "flying_crow_to_link") {
    let srcUrl = itemData.srcUrl || itemData.linkUrl;
    let pageUrl = itemData.pageUrl
    if (srcUrl) {
      if (srcUrl.indexOf("http://") === 0 || srcUrl.indexOf("https://") === 0) {
        uploadFromUrl(srcUrl,pageUrl, (data) => {
          chrome.storage.sync.set({ fromurl: data }, function () {
            chrome.browserAction.setIcon({ path: "flyingcrow_blue.png" });
          });
        });
      }
    }
  }
});
chrome.notifications.onButtonClicked.addListener(function (
  notificationId,
  buttonIndex
) {
  if (notificationId.indexOf("flying_crow_download_") === 0) {
    if (buttonIndex === 0) {
      let finalUrl = notificationId.substr("flying_crow_download_".length);
      download(finalUrl);
    } else {
      notify(
        "开启免打扰",
        "后面的下载将不会出现此提示，但是您可以从设置中重新打开此功能"
      );
    }
  }
});

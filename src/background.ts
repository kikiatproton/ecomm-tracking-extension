type FetchHistoryType = {
  [key: string]: {
    [key: string]: {
      requestId: string;
      status: "pending" | "success" | "fail";
      statusCode: number | undefined;
      statusLine: string | undefined;
      method: string;
      timeStamp: number;
      url: string;
      referer: string | undefined;
      type: "track" | "recommendation";
      model: string | null;
      payload: { [key: string]: string };
    };
  };
};

let fetchHistory: FetchHistoryType = {};
const baseURL = "https://gluon.proton.ai";

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function createTabHistory({ tabId }: { tabId: any }) {
  fetchHistory = {
    ...fetchHistory,
    [tabId]: {},
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.event === "popup-opened") {
    sendResponse(fetchHistory);
  }
  if (request.event === "clear-history") {
    createTabHistory({ tabId: request.tabId });
    sendResponse(fetchHistory);
  }
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo) {
  if (changeInfo?.status !== "loading") return;
  if (!fetchHistory[tabId]) {
    createTabHistory({ tabId });
  }
});

chrome.tabs.onCreated.addListener(function (tabId) {
  createTabHistory({ tabId });
});

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    (async () => {
      const { origin, pathname, searchParams } = new URL(
        details.url.toString()
      );
      if (origin !== baseURL) return;
      const tab = await getCurrentTab();
      const referer = tab.url;
      const endpoint = pathname.split("/").reverse()[0];
      const { url, requestId, method, timeStamp, tabId } = details;
      const isTrack = endpoint === "track" || endpoint === "login";
      let payload;
      if (details.requestBody) {
        const buffer = details!.requestBody!.raw![0].bytes;
        const enc = new TextDecoder("utf-8");
        const arr = buffer && new Uint8Array(buffer);
        payload = JSON.parse(enc.decode(arr));
      }
      fetchHistory[tabId][requestId] = {
        requestId,
        status: "pending",
        statusCode: undefined,
        statusLine: undefined,
        method,
        timeStamp,
        url,
        referer,
        type: isTrack ? "track" : "recommendation",
        model: isTrack
          ? null
          : endpoint === "recommendations"
          ? "general"
          : endpoint,
        payload: isTrack
          ? payload
          : {
              customer_id: searchParams.get("customer_id"),
              product_id: searchParams.get("product_id"),
              user_id: searchParams.get("user_id"),
              count: searchParams.get("count"),
            },
      };
      chrome.runtime.sendMessage({
        event: "history-updated",
        history: fetchHistory,
      });
    })();
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

chrome.webRequest.onCompleted.addListener(
  function (details) {
    const { origin } = new URL(details.url.toString());
    if (origin !== baseURL) return;
    const { requestId, statusCode, tabId, statusLine } = details;
    const status = statusCode < 300 ? "success" : "fail";
    fetchHistory[tabId][requestId].status = status;
    fetchHistory[tabId][requestId].statusCode = statusCode;
    fetchHistory[tabId][requestId].statusLine = statusLine;
    chrome.runtime.sendMessage({
      event: "history-updated",
      history: fetchHistory,
    });
  },
  { urls: ["<all_urls>"] }
);

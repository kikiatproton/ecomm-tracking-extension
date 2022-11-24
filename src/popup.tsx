import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import ReactJson from "react-json-view";

const Popup = () => {
  const [history, setHistory] = useState<any>(null);
  const [collasped, setCollasped] = useState(false);
  const [currentTabId, setCurrentTabId] = useState<string | null>(null);
  const [currentPageUrl, setCurrentPageUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!currentTabId) return;
    (async () => {
      chrome.runtime.sendMessage({ event: "popup-opened" }, (res) => {
        setHistory(res[currentTabId]);
      });
      chrome.runtime.onMessage.addListener((request) => {
        if (request.event === "history-updated") {
          setHistory(request.history[currentTabId]);
        }
      });
    })();
  }, [currentTabId]);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      setCurrentTabId(tabs[0].id?.toString() || null);
      setCurrentPageUrl(tabs[0].url || null);
    });
  }, []);

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, [history]);

  if (history === null || Object.keys(history).length === 0)
    return (
      <h3
        style={{
          padding: "36px",
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        Nothing here!
      </h3>
    );

  return (
    <div>
      <ul>
        {Object.keys(history).map((requestId: string) => {
          const {
            timeStamp,
            type,
            model,
            payload,
            status,
            statusLine,
            referer,
          } = history[requestId];
          const event = payload?.event;
          const statusColor =
            status === "pending"
              ? "var(--yellow-color)"
              : status === "success"
              ? "var(--green-color)"
              : "var(--red-color)";
          return (
            <li key={requestId}>
              <div
                style={{
                  background: statusColor,
                  color: "white",
                  padding: "3px",
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div>{statusLine || "PENDING"}</div>
                <div>{new Date(timeStamp).toLocaleString()}</div>
              </div>
              <div style={{ padding: "12px", paddingRight: "36px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flex: 1,
                    paddingBottom: "6px",
                    fontWeight: 700,
                    fontSize: ".85rem",
                    textTransform: "uppercase",
                    color:
                      currentPageUrl === referer
                        ? "var(--blue-color)"
                        : "inherit",
                  }}
                >
                  <div>{type}</div>
                  <div style={{ marginLeft: "12px" }}>
                    {model && <span>{model}</span>}
                    {event && <span>{event}</span>}
                  </div>
                </div>
                <ReactJson
                  style={{ height: collasped ? "20px" : "160px" }}
                  src={{ referer, ...payload }}
                  name={null}
                  collapsed={collasped}
                  displayDataTypes={false}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <div
        style={{
          background: "#f5f5f7",
          padding: "12px",
          display: "flex",
          justifyContent: "center",
          alignContent: "center",
        }}
      >
        <button
          onClick={() => {
            if (!currentTabId) return;
            chrome.runtime.sendMessage(
              { event: "clear-history", tabId: currentTabId },
              (res) => {
                setHistory(res[currentTabId]);
              }
            );
          }}
        >
          Clear history
        </button>
        <div style={{ width: "20px" }}></div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(history));
            alert("History copied");
          }}
        >
          Copy history
        </button>
        <div style={{ width: "20px" }}></div>
        <button
          onClick={() => {
            setCollasped((prev) => !prev);
          }}
        >
          Collaspe
        </button>
      </div>
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);

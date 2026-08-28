import { useEffect, useState } from "react";
import "./App.css";
import AutomationFlowBuilder from "./AutomationFlowBuilder";
import RCSBroadcast from "./RCSBroadcast";
import RCSReport from "./rcsReport.jsx";
import TeamInbox from "./TeamInbox";
import UserManagement from "./UserManagement";
import AddressBook from "./AddressBook";
import Commerce from "./Commerce";
import * as XLSX from "xlsx";


function RcsTemplateEditor({ templateType, initialContent = null, onSave, onCancel }) {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [cards, setCards] = useState([
    { title: "", description: "", mediaUrl: "", buttonText: "", buttonUrl: "" },
    { title: "", description: "", mediaUrl: "", buttonText: "", buttonUrl: "" },
  ]);

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    background: "#fff",
  };

  const labelStyle = {
    display: "block",
    fontWeight: "600",
    marginBottom: "8px",
  };

  useEffect(() => {
    const content = initialContent || {};

    setText(content.text || "");
    setUrl(content.url || "");
    setTitle(content.title || "");
    setDescription(content.description || "");
    setMediaUrl(content.mediaUrl || "");
    setButtonText(content.buttonText || "");
    setButtonUrl(content.buttonUrl || "");

    if (Array.isArray(content.cards) && content.cards.length >= 2) {
      setCards(
        content.cards.map((card) => ({
          title: card.title || "",
          description: card.description || "",
          mediaUrl: card.mediaUrl || "",
          buttonText: card.buttonText || "",
          buttonUrl: card.buttonUrl || "",
        }))
      );
    } else {
      setCards([
        { title: "", description: "", mediaUrl: "", buttonText: "", buttonUrl: "" },
        { title: "", description: "", mediaUrl: "", buttonText: "", buttonUrl: "" },
      ]);
    }
  }, [templateType, initialContent]);

  const updateCard = (index, field, value) => {
    setCards((previous) =>
      previous.map((card, cardIndex) =>
        cardIndex === index ? { ...card, [field]: value } : card
      )
    );
  };

  const save = () => {
    if (templateType === "SHORT_TEXT" && !text.trim()) {
      alert("Please enter Message Text.");
      return;
    }

    if (
      templateType === "RICH_MESSAGE" &&
      !title.trim() &&
      !description.trim()
    ) {
      alert("Please enter a Rich Message title or description.");
      return;
    }

    if (templateType === "TEXT_TEMPLATE" && !text.trim()) {
      alert("Please enter Text Template message text.");
      return;
    }

    if (
      templateType === "STANDALONE_TEMPLATE" &&
      !title.trim() &&
      !description.trim()
    ) {
      alert("Please enter Standalone Template title or description.");
      return;
    }

    if (templateType === "CAROUSEL_TEMPLATE") {
      const hasEmptyCard = cards.some(
        (card) => !card.title.trim() && !card.description.trim()
      );

      if (hasEmptyCard) {
        alert("Please enter a title or description for every carousel card.");
        return;
      }
    }

    let content = {};

    if (templateType === "SHORT_TEXT") {
      content = { text, url };
    }

    if (templateType === "RICH_MESSAGE") {
      content = {
        title,
        description,
        mediaUrl,
        buttonText,
        buttonUrl,
      };
    }

    if (templateType === "TEXT_TEMPLATE") {
      content = {
        text,
        buttonText,
        buttonUrl,
      };
    }

    if (templateType === "STANDALONE_TEMPLATE") {
      content = {
        title,
        description,
        mediaUrl,
        buttonText,
        buttonUrl,
      };
    }

    if (templateType === "CAROUSEL_TEMPLATE") {
      content = { cards };
    }

    onSave(content);
  };

  return (
    <div
      style={{
        marginBottom: "22px",
        padding: "20px",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        background: "#fff",
      }}
    >
      {templateType === "SHORT_TEXT" && (
        <div>
          <label style={labelStyle}>Message Text</label>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, 160))}
            rows={5}
            placeholder="Enter your RCS message..."
            style={{ ...inputStyle, resize: "vertical", lineHeight: "1.5" }}
          />
          <div style={{ textAlign: "right", marginTop: "6px", color: "#64748b", fontSize: "12px" }}>
            Chars: {text.length}/160
          </div>

          <label style={{ ...labelStyle, marginTop: "18px" }}>
            URL Preview (Optional)
          </label>
          <input
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            style={inputStyle}
          />
        </div>
      )}

      {templateType === "RICH_MESSAGE" && (
        <div>
          <label style={labelStyle}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value.slice(0, 100))}
            placeholder="Enter rich message title"
            style={inputStyle}
          />

          <label style={{ ...labelStyle, marginTop: "18px" }}>
            Description / Message Text
          </label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value.slice(0, 1000))}
            placeholder="Enter your rich message..."
            rows={5}
            style={{ ...inputStyle, resize: "vertical", lineHeight: "1.5" }}
          />
          <div style={{ textAlign: "right", marginTop: "6px", color: "#64748b", fontSize: "12px" }}>
            Chars: {description.length}/1000
          </div>

          <label style={{ ...labelStyle, marginTop: "18px" }}>Media URL (Optional)</label>
          <input
            type="url"
            value={mediaUrl}
            onChange={(event) => setMediaUrl(event.target.value)}
            placeholder="https://example.com/image.jpg"
            style={inputStyle}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "18px" }}>
            <div>
              <label style={labelStyle}>Button Text (Optional)</label>
              <input
                type="text"
                value={buttonText}
                onChange={(event) => setButtonText(event.target.value.slice(0, 50))}
                placeholder="View More"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Button URL (Optional)</label>
              <input
                type="url"
                value={buttonUrl}
                onChange={(event) => setButtonUrl(event.target.value)}
                placeholder="https://example.com"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      )}

      {templateType === "TEXT_TEMPLATE" && (
        <div>
          <label style={labelStyle}>Template Message</label>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, 1600))}
            rows={7}
            placeholder="Enter text template message..."
            style={{ ...inputStyle, resize: "vertical", lineHeight: "1.5" }}
          />
          <div style={{ textAlign: "right", marginTop: "6px", color: "#64748b", fontSize: "12px" }}>
            Chars: {text.length}/1600
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "18px" }}>
            <div>
              <label style={labelStyle}>Button Text (Optional)</label>
              <input
                type="text"
                value={buttonText}
                onChange={(event) => setButtonText(event.target.value.slice(0, 50))}
                placeholder="Open"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Button URL (Optional)</label>
              <input
                type="url"
                value={buttonUrl}
                onChange={(event) => setButtonUrl(event.target.value)}
                placeholder="https://example.com"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      )}

      {templateType === "STANDALONE_TEMPLATE" && (
        <div>
          <label style={labelStyle}>Card Title</label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value.slice(0, 100))}
            placeholder="Enter card title"
            style={inputStyle}
          />

          <label style={{ ...labelStyle, marginTop: "18px" }}>Card Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value.slice(0, 1000))}
            placeholder="Enter card description..."
            rows={5}
            style={{ ...inputStyle, resize: "vertical", lineHeight: "1.5" }}
          />

          <label style={{ ...labelStyle, marginTop: "18px" }}>Media URL (Optional)</label>
          <input
            type="url"
            value={mediaUrl}
            onChange={(event) => setMediaUrl(event.target.value)}
            placeholder="https://example.com/image.jpg"
            style={inputStyle}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "18px" }}>
            <div>
              <label style={labelStyle}>Button Text (Optional)</label>
              <input
                type="text"
                value={buttonText}
                onChange={(event) => setButtonText(event.target.value.slice(0, 50))}
                placeholder="Learn More"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Button URL (Optional)</label>
              <input
                type="url"
                value={buttonUrl}
                onChange={(event) => setButtonUrl(event.target.value)}
                placeholder="https://example.com"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      )}

      {templateType === "CAROUSEL_TEMPLATE" && (
        <div>
          <div style={{ marginBottom: "14px", color: "#475569", fontWeight: "600" }}>
            Carousel Cards ({cards.length}/5)
          </div>

          {cards.map((card, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "14px",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <strong>Card {index + 1}</strong>
                {cards.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setCards((previous) => previous.filter((_, cardIndex) => cardIndex !== index))}
                    style={{ border: "1px solid #fecaca", background: "#fff", color: "#dc2626", borderRadius: "6px", padding: "6px 10px", cursor: "pointer" }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <label style={labelStyle}>Card Title</label>
              <input
                type="text"
                value={card.title}
                onChange={(event) => updateCard(index, "title", event.target.value.slice(0, 100))}
                placeholder="Enter card title"
                style={inputStyle}
              />

              <label style={{ ...labelStyle, marginTop: "14px" }}>Card Description</label>
              <textarea
                value={card.description}
                onChange={(event) => updateCard(index, "description", event.target.value.slice(0, 500))}
                placeholder="Enter card description..."
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />

              <label style={{ ...labelStyle, marginTop: "14px" }}>Media URL (Optional)</label>
              <input
                type="url"
                value={card.mediaUrl}
                onChange={(event) => updateCard(index, "mediaUrl", event.target.value)}
                placeholder="https://example.com/image.jpg"
                style={inputStyle}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "14px" }}>
                <div>
                  <label style={labelStyle}>Button Text (Optional)</label>
                  <input
                    type="text"
                    value={card.buttonText}
                    onChange={(event) => updateCard(index, "buttonText", event.target.value.slice(0, 50))}
                    placeholder="View"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Button URL (Optional)</label>
                  <input
                    type="url"
                    value={card.buttonUrl}
                    onChange={(event) => updateCard(index, "buttonUrl", event.target.value)}
                    placeholder="https://example.com"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          ))}

          {cards.length < 5 && (
            <button
              type="button"
              onClick={() => setCards((previous) => [
                ...previous,
                { title: "", description: "", mediaUrl: "", buttonText: "", buttonUrl: "" },
              ])}
              style={{ padding: "10px 16px", border: "1px solid #cbd5e1", borderRadius: "7px", background: "#fff", cursor: "pointer", fontWeight: "600" }}
            >
              + Add Card
            </button>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", marginTop: "22px" }}>
        <button
          type="button"
          className="view-button"
          onClick={save}
        >
          Save Template
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "10px 18px",
            border: "1px solid #cbd5e1",
            borderRadius: "7px",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// =====================================================
// DEVELOPER - API DOCUMENTATION
// =====================================================

function ApiDocumentationPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [copied, setCopied] = useState("");

  const copyCode = async (code, id) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(id);

      setTimeout(() => {
        setCopied("");
      }, 1500);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const documentation = {
    introduction: {
      title: "API Hub",
      description:
        "Welcome to Unique Digital Outreach Pvt Ltd API Hub, the go-to resource for developers, businesses, and partners.",
    },

    quickstart: {
      title: "Quickstart",
      description:
        "Get started with the API and make your first API request.",
    },

    authentication: {
      title: "Authentication",
      description:
        "Learn how to authenticate requests using your API key.",
    },

    errors: {
      title: "Errors",
      description:
        "Understand API status codes and error responses.",
    },

    webhooks: {
      title: "Webhooks",
      description:
        "Configure and consume webhooks for messaging events.",
    },

    sms: {
      title: "SMS",
      description:
        "Programmable SMS APIs for individual, bulk and specialized SMS.",
    },

    otp: {
      title: "Generate and Verify OTP",
      description:
        "Generate and verify one-time passwords for secure authentication.",
    },

    whatsapp: {
      title: "WhatsApp",
      description:
        "Use WhatsApp APIs for messaging and communication.",
    },

    rcs: {
      title: "RCS",
      description:
        "Use RCS APIs for rich business messaging.",
    },

    clevertap: {
      title: "CleverTap SMS",
      description:
        "Integration documentation for CleverTap SMS.",
    },

    moengage: {
      title: "MoEngage RCS",
      description:
        "Integration documentation for MoEngage RCS.",
    },
  };

  const navigate = (section) => {
    setActiveSection(section);

    setTimeout(() => {
      const element = document.getElementById(
        `api-doc-${section}`
      );

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 50);
  };

  const codeExamples = {
    quickstart: `curl -X POST http://localhost:5000/api/sms/send \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "sender": "senderName",
    "to": "91XXXXXXXXXX",
    "text": "Hello, World!",
    "type": "TRANS"
  }'`,

    authentication: `fetch("http://localhost:5000/api/...", {
  headers: {
    "x-api-key": "YOUR_API_KEY"
  }
});`,

    sms: `{
  "sender": "senderName",
  "to": "91XXXXXXXXXX",
  "text": "Hello World!",
  "type": "TRANS"
}`,

    errors: `{
  "error": true,
  "message": "Api Key not found"
}`,
  };

  return (
    <div className="api-docs-page">

      {/* DOCUMENTATION SIDEBAR */}

      <aside className="api-docs-sidebar">

        <div className="api-docs-brand">
          <strong>Unique Digital Outreach</strong>
          <span>API Hub</span>
        </div>

        <div className="api-docs-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Find something..."
          />
        </div>

        <div className="api-docs-nav">

          <div className="api-docs-nav-title">
            Guides
          </div>

          <button
            className={
              activeSection === "introduction"
                ? "api-doc-nav-active"
                : ""
            }
            onClick={() => navigate("introduction")}
          >
            Introduction
          </button>

          <button
            className={
              activeSection === "quickstart"
                ? "api-doc-nav-active"
                : ""
            }
            onClick={() => navigate("quickstart")}
          >
            Quickstart
          </button>

          <button
            className={
              activeSection === "authentication"
                ? "api-doc-nav-active"
                : ""
            }
            onClick={() => navigate("authentication")}
          >
            Authentication
          </button>

          <button
            className={
              activeSection === "errors"
                ? "api-doc-nav-active"
                : ""
            }
            onClick={() => navigate("errors")}
          >
            Errors
          </button>

          <button
            className={
              activeSection === "webhooks"
                ? "api-doc-nav-active"
                : ""
            }
            onClick={() => navigate("webhooks")}
          >
            Webhooks
          </button>


          <div className="api-docs-nav-title">
            Channel
          </div>

          <button
            className={
              activeSection === "sms"
                ? "api-doc-nav-active"
                : ""
            }
            onClick={() => navigate("sms")}
          >
            SMS
          </button>

          <button
            className={
              activeSection === "otp"
                ? "api-doc-nav-active"
                : ""
            }
            onClick={() => navigate("otp")}
          >
            Generate and Verify OTP
          </button>

          <button
            className={
              activeSection === "whatsapp"
                ? "api-doc-nav-active"
                : ""
            }
            onClick={() => navigate("whatsapp")}
          >
            WhatsApp
            <span>›</span>
          </button>

          <button
            className={
              activeSection === "rcs"
                ? "api-doc-nav-active"
                : ""
            }
            onClick={() => navigate("rcs")}
          >
            RCS
          </button>


          <div className="api-docs-nav-title">
            Integration
          </div>

          <button
            className={
              activeSection === "clevertap"
                ? "api-doc-nav-active"
                : ""
            }
            onClick={() => navigate("clevertap")}
          >
            CleverTap SMS
          </button>

          <button
            className={
              activeSection === "moengage"
                ? "api-doc-nav-active"
                : ""
            }
            onClick={() => navigate("moengage")}
          >
            MoEngage RCS
          </button>

        </div>
      </aside>


      {/* DOCUMENTATION CONTENT */}

      <main className="api-docs-content">

        <div className="api-docs-topbar">
          <div>
            <span>API</span>
            <span>Documentation</span>
            <span>Support</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveSection("introduction")}
          >
            API Hub
          </button>
        </div>


        {/* INTRODUCTION */}

        <section
          id="api-doc-introduction"
          className="api-doc-section"
        >
          <div className="api-doc-eyebrow">
            Unique Digital Outreach Pvt Ltd
          </div>

          <h1>API Hub</h1>

          <p className="api-doc-lead">
            Welcome to Unique Digital Outreach Pvt Ltd API Hub,
            the go-to resource for developers, businesses, and
            partners.
          </p>

          <p>
            Our robust set of APIs enables seamless integration
            across web and mobile platforms, ensuring a consistent
            and engaging user experience.
          </p>

          <p>
            This documentation provides clear insights into
            leveraging our APIs to create innovative,
            interconnected experiences for your customers.
          </p>

          <button
            className="api-doc-primary-button"
            onClick={() => navigate("quickstart")}
          >
            Quickstart →
          </button>


          <h2>Getting started</h2>

          <p>
            To get started, generate an API key from the
            Developer → API Key section of your dashboard.
          </p>

          <div className="api-doc-info-box">
            <strong>Before making API requests</strong>
            <p>
              Generate an active API key and use it when
              authenticating your requests.
            </p>
          </div>


          <h2>Guides</h2>

          <div className="api-doc-guide-grid">

            <button onClick={() => navigate("sms")}>
              <strong>SMS</strong>
              <span>
                Understand how to work with the SMS API.
              </span>
            </button>

            <button onClick={() => navigate("whatsapp")}>
              <strong>WhatsApp</strong>
              <span>
                Understand how to work with WhatsApp API.
              </span>
            </button>

            <button onClick={() => navigate("errors")}>
              <strong>Errors</strong>
              <span>
                Learn about API errors and status codes.
              </span>
            </button>

            <button onClick={() => navigate("webhooks")}>
              <strong>Webhooks</strong>
              <span>
                Learn how to configure application webhooks.
              </span>
            </button>

          </div>
        </section>


        {/* QUICKSTART */}

        <section
          id="api-doc-quickstart"
          className="api-doc-section"
        >
          <div className="api-doc-eyebrow">
            Guides
          </div>

          <h1>Quickstart</h1>

          <p className="api-doc-lead">
            Get started with the API and make your first
            API request.
          </p>

          <h2>Before you begin</h2>

          <p>
            Generate your API key from the Developer →
            API Key section of the dashboard.
          </p>

          <h2>Making your first API request</h2>

          <p>
            The following example demonstrates the structure
            of an authenticated SMS request.
          </p>

          <div className="api-doc-code-wrapper">
            <div className="api-doc-code-header">
              <span>cURL</span>

              <button
                onClick={() =>
                  copyCode(
                    codeExamples.quickstart,
                    "quickstart"
                  )
                }
              >
                {copied === "quickstart"
                  ? "Copied!"
                  : "Copy"}
              </button>
            </div>

            <pre>
              <code>{codeExamples.quickstart}</code>
            </pre>
          </div>
        </section>


        {/* AUTHENTICATION */}

        <section
          id="api-doc-authentication"
          className="api-doc-section"
        >
          <div className="api-doc-eyebrow">
            Guides
          </div>

          <h1>Authentication</h1>

          <p className="api-doc-lead">
            Every API request must contain a valid API key.
          </p>

          <div className="api-doc-warning">
            Keep your API key private. Do not expose it in
            public repositories or client-side production code.
          </div>

          <h2>API Key authentication</h2>

          <p>
            Send your active API key using the
            <code> x-api-key </code>
            request header.
          </p>

          <div className="api-doc-code-wrapper">
            <div className="api-doc-code-header">
              <span>Request Header</span>

              <button
                onClick={() =>
                  copyCode(
                    "x-api-key: YOUR_API_KEY",
                    "auth"
                  )
                }
              >
                {copied === "auth"
                  ? "Copied!"
                  : "Copy"}
              </button>
            </div>

            <pre>
              <code>
                x-api-key: YOUR_API_KEY
              </code>
            </pre>
          </div>

          <h2>Example request</h2>

          <div className="api-doc-code-wrapper">
            <div className="api-doc-code-header">
              <span>JavaScript</span>

              <button
                onClick={() =>
                  copyCode(
                    codeExamples.authentication,
                    "authentication"
                  )
                }
              >
                {copied === "authentication"
                  ? "Copied!"
                  : "Copy"}
              </button>
            </div>

            <pre>
              <code>
                {codeExamples.authentication}
              </code>
            </pre>
          </div>
        </section>


        {/* ERRORS */}

        <section
          id="api-doc-errors"
          className="api-doc-section"
        >
          <div className="api-doc-eyebrow">
            Guides
          </div>

          <h1>Errors</h1>

          <p className="api-doc-lead">
            Understand the status codes and error responses
            returned by the API.
          </p>

          <div className="api-doc-table">
            <div className="api-doc-table-row api-doc-table-head">
              <strong>Status Code</strong>
              <strong>Description</strong>
            </div>

            <div className="api-doc-table-row">
              <span>200</span>
              <span>Successful response</span>
            </div>

            <div className="api-doc-table-row">
              <span>400</span>
              <span>Client error</span>
            </div>

            <div className="api-doc-table-row">
              <span>500</span>
              <span>Server error</span>
            </div>
          </div>

          <h2>Error response</h2>

          <div className="api-doc-code-wrapper">
            <div className="api-doc-code-header">
              <span>JSON</span>

              <button
                onClick={() =>
                  copyCode(
                    codeExamples.errors,
                    "errors"
                  )
                }
              >
                {copied === "errors"
                  ? "Copied!"
                  : "Copy"}
              </button>
            </div>

            <pre>
              <code>{codeExamples.errors}</code>
            </pre>
          </div>
        </section>


        {/* WEBHOOKS */}

        <section
          id="api-doc-webhooks"
          className="api-doc-section"
        >
          <div className="api-doc-eyebrow">
            Guides
          </div>

          <h1>Webhooks</h1>

          <p className="api-doc-lead">
            Webhooks allow your application to receive
            asynchronous messaging events.
          </p>

          <h2>Supported events</h2>

          <ul className="api-doc-list">
            <li>Messages received</li>
            <li>Messages sent</li>
            <li>Message delivery status</li>
            <li>Message read status</li>
          </ul>

          <div className="api-doc-info-box">
            Configure your callback URL and subscribe to the
            events required by your application.
          </div>
        </section>


        {/* SMS */}

        <section
          id="api-doc-sms"
          className="api-doc-section"
        >
          <div className="api-doc-eyebrow">
            Channel
          </div>

          <h1>SMS</h1>

          <p className="api-doc-lead">
            Programmable SMS APIs for sending individual,
            bulk and specialized SMS messages.
          </p>

          <h2>Features</h2>

          <ul className="api-doc-list">
            <li>Bulk SMS</li>
            <li>OTP SMS</li>
            <li>Flash SMS</li>
            <li>SMS with Unicode</li>
            <li>Template SMS</li>
            <li>SMS with short URLs</li>
          </ul>

          <h2>Send single message</h2>

          <div className="api-doc-endpoint">
            <span>POST</span>
            <strong>/v1/sms</strong>
          </div>

          <div className="api-doc-code-wrapper">
            <div className="api-doc-code-header">
              <span>JSON</span>

              <button
                onClick={() =>
                  copyCode(
                    codeExamples.sms,
                    "sms"
                  )
                }
              >
                {copied === "sms"
                  ? "Copied!"
                  : "Copy"}
              </button>
            </div>

            <pre>
              <code>{codeExamples.sms}</code>
            </pre>
          </div>

          <h2>Required attributes</h2>

          <div className="api-doc-attributes">

            <div>
              <strong>sender</strong>
              <span>string</span>
              <p>Originator or alphanumeric sender ID.</p>
            </div>

            <div>
              <strong>to</strong>
              <span>string</span>
              <p>Recipient MSISDN.</p>
            </div>

            <div>
              <strong>text</strong>
              <span>string</span>
              <p>Message text.</p>
            </div>

            <div>
              <strong>type</strong>
              <span>string</span>
              <p>TRANS, PROMO or OTP.</p>
            </div>

          </div>
        </section>


        {/* OTP */}

        <section
          id="api-doc-otp"
          className="api-doc-section"
        >
          <div className="api-doc-eyebrow">
            Channel
          </div>

          <h1>Generate and Verify OTP</h1>

          <p className="api-doc-lead">
            Generate and verify one-time passwords for
            authentication and transaction security.
          </p>

          <div className="api-doc-info-box">
            OTP APIs can be integrated into login,
            authentication, password reset and transaction
            verification workflows.
          </div>
        </section>


        {/* WHATSAPP */}

        <section
          id="api-doc-whatsapp"
          className="api-doc-section"
        >
          <div className="api-doc-eyebrow">
            Channel
          </div>

          <h1>WhatsApp</h1>

          <p className="api-doc-lead">
            WhatsApp API documentation for business
            messaging and communication workflows.
          </p>

          <h2>API authentication</h2>

          <p>
            Use your active API key in the request header.
          </p>

          <div className="api-doc-endpoint">
            <span>POST</span>
            <strong>/api/whatsapp/...</strong>
          </div>
        </section>


        {/* RCS */}

        <section
          id="api-doc-rcs"
          className="api-doc-section"
        >
          <div className="api-doc-eyebrow">
            Channel
          </div>

          <h1>RCS</h1>

          <p className="api-doc-lead">
            Rich Communication Services APIs for rich,
            interactive business messaging.
          </p>

          <h2>RCS capabilities</h2>

          <ul className="api-doc-list">
            <li>Rich text messaging</li>
            <li>Media messages</li>
            <li>Rich cards</li>
            <li>Suggested actions</li>
            <li>Delivery status</li>
            <li>Inbound messages</li>
          </ul>
        </section>


        {/* INTEGRATIONS */}

        <section
          id="api-doc-clevertap"
          className="api-doc-section"
        >
          <div className="api-doc-eyebrow">
            Integration
          </div>

          <h1>CleverTap SMS</h1>

          <p className="api-doc-lead">
            Integration documentation for connecting
            CleverTap with SMS messaging.
          </p>
        </section>


        <section
          id="api-doc-moengage"
          className="api-doc-section"
        >
          <div className="api-doc-eyebrow">
            Integration
          </div>

          <h1>MoEngage RCS</h1>

          <p className="api-doc-lead">
            Integration documentation for connecting
            MoEngage with RCS messaging.
          </p>
        </section>


        <footer className="api-docs-footer">
          <div>
            <button
              onClick={() => navigate("introduction")}
            >
              ← Previous
            </button>

            <button
              onClick={() => navigate("quickstart")}
            >
              Next →
            </button>
          </div>

          <span>
            © Unique Digital Outreach Pvt Ltd
          </span>
        </footer>

      </main>
    </div>
  );
}


// =====================================================
// DEVELOPER - API KEY PAGE
// =====================================================

function ApiKeyPage({ onNavigate }) {
  const [apiKeys, setApiKeys] = useState([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);

  const [editingKey, setEditingKey] = useState(null);
  const [form, setForm] = useState({
    key_name: "",
    allowed_ips: "",
    status: "ACTIVE",
  });

  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const API_URL = "http://localhost:5000/api/developer/api-keys";

  const loadApiKeys = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}?user_id=1`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load API keys.");
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.apiKeys)
          ? data.apiKeys
          : [];

      setApiKeys(list);
    } catch (err) {
      console.error("API key load error:", err);
      setError(err.message || "Unable to load API keys.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const openAddModal = () => {
    setEditingKey(null);
    setForm({
      key_name: "",
      allowed_ips: "",
      status: "ACTIVE",
    });
    setShowAddModal(true);
  };

  const openEditModal = (item) => {
    setEditingKey(item);
    setForm({
      key_name: item.key_name || "",
      allowed_ips: item.allowed_ips || "",
      status: String(item.status || "ACTIVE").toUpperCase(),
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingKey(null);
    setForm({
      key_name: "",
      allowed_ips: "",
      status: "ACTIVE",
    });
  };

  const saveApiKey = async (event) => {
    event.preventDefault();

    const keyName = form.key_name.trim();

    if (!keyName) {
      alert("Please enter a key name.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const isEdit = Boolean(editingKey);

      const response = await fetch(
        isEdit ? `${API_URL}/${editingKey.id}` : API_URL,
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: 1,
            key_name: keyName,
            allowed_ips: form.allowed_ips.trim(),
            status: form.status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save API key.");
      }

      closeModal();
      await loadApiKeys();
    } catch (err) {
      console.error("API key save error:", err);
      setError(err.message || "Unable to save API key.");
    } finally {
      setSaving(false);
    }
  };

  const deleteApiKey = async (item) => {
    const confirmed = window.confirm(
      `Delete API key "${item.key_name || "Unnamed"}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${item.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete API key.");
      }

      await loadApiKeys();
    } catch (err) {
      console.error("API key delete error:", err);
      setError(err.message || "Unable to delete API key.");
    }
  };

  const copyApiKey = async (item) => {
    if (!item.api_key) return;

    try {
      await navigator.clipboard.writeText(item.api_key);
      setCopiedId(item.id);

      window.setTimeout(() => {
        setCopiedId(null);
      }, 1500);
    } catch (err) {
      console.error("Copy API key error:", err);
      alert("Unable to copy API key.");
    }
  };

  const maskApiKey = (apiKey) => {
    const value = String(apiKey || "");

    if (!value) return "-";
    if (value.length <= 8) return "••••••••";

    return `${value.slice(0, 4)}${"•".repeat(24)}`;
  };

  const filteredKeys = apiKeys.filter((item) => {
    const value = search.trim().toLowerCase();

    if (!value) return true;

    return [
      item.user_name,
      item.key_name,
      item.api_key,
      item.allowed_ips,
      item.status,
    ].some((field) =>
      String(field || "").toLowerCase().includes(value)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredKeys.length / pageSize)
  );

  const safePage = Math.min(page, totalPages);

  const visibleKeys = filteredKeys.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const changeSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const changePageSize = (value) => {
    setPageSize(Number(value));
    setPage(1);
  };

  const getStatusClass = (status) => {
    return String(status || "").toUpperCase() === "ACTIVE"
      ? "api-key-status-active"
      : "api-key-status-inactive";
  };

  return (
    <>
      <div className="api-key-page">
        <div className="api-key-breadcrumb">
          <span>Developer</span>
          <span>/</span>
          <strong>Generate API Key</strong>
        </div>

        <div className="api-key-header">
          <div>
            <h1>Generate API Key</h1>
          </div>

          <div className="api-key-header-actions">
            <button
              type="button"
              className="api-key-docs-button"
              onClick={() => onNavigate("api-docs")}
            >
              &lt;/&gt; Read API Docs
            </button>

            <button
              type="button"
              className="api-key-add-button"
              onClick={openAddModal}
            >
              ⇧ Add Api Key
            </button>
          </div>
        </div>

        <section className="api-key-card">
          <div className="api-key-toolbar">
            <select
              className="api-key-page-size"
              value={pageSize}
              onChange={(event) => changePageSize(event.target.value)}
              aria-label="Rows per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <div className="api-key-search-wrap">
              <span>⌕</span>
              <input
                type="text"
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
                placeholder="Search"
              />
            </div>
          </div>

          {error && (
            <div className="api-key-error">
              {error}
            </div>
          )}

          {loading ? (
            <div className="api-key-empty">
              Loading API keys...
            </div>
          ) : (
            <div className="api-key-table-wrapper">
              <table className="api-key-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Key Name</th>
                    <th>Api Key</th>
                    <th>Allowed IPs</th>
                    <th>Created At</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleKeys.length === 0 ? (
                    <tr>
                      <td colSpan="7">
                        <div className="api-key-empty">
                          No API keys found.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleKeys.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="api-key-user">
                            {item.user_name || `User ${item.user_id || 1}`}
                          </div>
                        </td>

                        <td>
                          <div className="api-key-name">
                            {item.key_name || "-"}
                          </div>
                        </td>

                        <td>
                          <div className="api-key-value">
                            <button
                              type="button"
                              className="api-key-copy"
                              title="Copy API key"
                              onClick={() => copyApiKey(item)}
                            >
                              ▣
                            </button>

                            <span>
                              {maskApiKey(item.api_key)}
                            </span>

                            {copiedId === item.id && (
                              <small>Copied</small>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className="api-key-ip">
                            {item.allowed_ips || "-"}
                          </span>
                        </td>

                        <td>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "2-digit",
                                  year: "numeric",
                                }
                              )
                            : "-"}
                        </td>

                        <td>
                          <span
                            className={`api-key-status ${getStatusClass(
                              item.status
                            )}`}
                          >
                            {String(item.status || "ACTIVE")}
                          </span>
                        </td>

                        <td>
                          <div className="api-key-actions">
                            <button
                              type="button"
                              className="api-key-edit"
                              title="Edit"
                              onClick={() => openEditModal(item)}
                            >
                              ✎
                            </button>

                            <button
                              type="button"
                              className="api-key-delete"
                              title="Delete"
                              onClick={() => deleteApiKey(item)}
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="api-key-pagination">
            <span>
              Showing{" "}
              {filteredKeys.length === 0
                ? 0
                : (safePage - 1) * pageSize + 1}
              {" - "}
              {Math.min(safePage * pageSize, filteredKeys.length)}
              {" of "}
              {filteredKeys.length}
            </span>

            <div>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                «
              </button>

              <button type="button" className="api-key-page-current">
                {safePage}
              </button>

              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
              >
                »
              </button>
            </div>
          </div>
        </section>
      </div>

      {showAddModal && (
        <div
          className="api-key-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <form
            className="api-key-modal"
            onSubmit={saveApiKey}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="api-key-modal-header">
              <div>
                <h2>
                  {editingKey ? "Edit API Key" : "Add API Key"}
                </h2>
                <p>
                  {editingKey
                    ? "Update the API key settings."
                    : "Create a new API key for your developer integration."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="api-key-modal-close"
              >
                ×
              </button>
            </div>

            <div className="api-key-modal-body">
              <label>
                Key Name
                <input
                  type="text"
                  value={form.key_name}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      key_name: event.target.value,
                    }))
                  }
                  placeholder="e.g. WhatsApp"
                  maxLength={100}
                />
              </label>

              <label>
                Allowed IPs
                <input
                  type="text"
                  value={form.allowed_ips}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      allowed_ips: event.target.value,
                    }))
                  }
                  placeholder="e.g. 127.0.0.1, 192.168.1.10"
                  maxLength={500}
                />
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      status: event.target.value,
                    }))
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>

              {editingKey && (
                <div className="api-key-existing-value">
                  <span>Current API Key</span>
                  <strong>
                    {maskApiKey(editingKey.api_key)}
                  </strong>
                  <button
                    type="button"
                    onClick={() => copyApiKey(editingKey)}
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>

            <div className="api-key-modal-footer">
              <button
                type="button"
                className="api-key-cancel"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="api-key-save"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingKey
                    ? "Update API Key"
                    : "Generate API Key"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDocsModal && (
        <div
          className="api-key-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowDocsModal(false);
            }
          }}
        >
          <div
            className="api-key-docs-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="api-key-modal-header">
              <div>
                <h2>API Documentation</h2>
                <p>Basic authentication information for your API integration.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowDocsModal(false)}
                className="api-key-modal-close"
              >
                ×
              </button>
            </div>

            <div className="api-key-docs-body">
              <h3>Authentication</h3>
              <p>
                Send your active API key using the{" "}
                <code>x-api-key</code> request header.
              </p>

              <pre>
  {`x-api-key: ${apiKeys.find(
    (item) => String(item.status || "").toUpperCase() === "ACTIVE"
  )?.api_key || "YOUR_API_KEY"}`}
</pre>

<h3>Example</h3>

<pre>
  {`fetch("http://localhost:5000/api/...", {
  headers: {
    "x-api-key": "${
      apiKeys.find(
        (item) => String(item.status || "").toUpperCase() === "ACTIVE"
      )?.api_key || "YOUR_API_KEY"
    }"
  }
});`}
</pre>

              <p className="api-key-docs-note">
                Keep your API key private. Do not expose it in public
                repositories or client-side production code.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


function App() {

  // =====================================================
  // DASHBOARD STATISTICS
  // =====================================================

  const [stats, setStats] = useState({
    totalInitiated: 0,
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalFailed: 0,
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);


  // =====================================================
  // WHATSAPP MESSAGES
  // =====================================================

  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);

  const [error, setError] = useState("");
  const [messagesError, setMessagesError] = useState("");

  // Live wallet balance for the top-right header.
  const [headerBalance, setHeaderBalance] = useState(0);

  // Live current time for the top header.
  const [currentTime, setCurrentTime] = useState(new Date());

  // Keep the header clock updated every second.
useEffect(() => {
  const intervalId = window.setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);

  return () => {
    window.clearInterval(intervalId);
  };
}, []);

  // Keep the header wallet balance synchronized with Commerce.
  useEffect(() => {
    let cancelled = false;

    const loadHeaderBalance = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/commerce"
        );

        if (!response.ok) return;

        const data = await response.json();

        if (!cancelled && data?.wallet) {
          setHeaderBalance(Number(data.wallet.balance || 0));
        }
      } catch (error) {
        console.error("Header wallet balance error:", error);
      }
    };

    loadHeaderBalance();

    const intervalId = window.setInterval(loadHeaderBalance, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  
  // =====================================================
  // SIDEBAR / PAGE STATE
  // =====================================================

  const [openMenu, setOpenMenu] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [currentPage, setCurrentPageState] = useState("dashboard");

  // Keep a real in-app navigation history so the top-bar Go Back button
  // returns to the immediately previous page without using browser history.
  const [pageHistory, setPageHistory] = useState([]);

  const setCurrentPage = (page) => {
    if (page === currentPage) {
      return;
    }

    setPageHistory((previousHistory) => [
      ...previousHistory,
      currentPage,
    ]);

    setCurrentPageState(page);
  };

  const goBack = () => {
    if (pageHistory.length === 0) {
      return;
    }

    const previousPage =
      pageHistory[pageHistory.length - 1];

    setPageHistory((previousHistory) =>
      previousHistory.slice(0, -1)
    );

    setCurrentPageState(previousPage);
  };

  const navigateToPage = (page) => {
    setCurrentPage(page);
  };

  // =====================================================
  // MESSAGE APP (SMS) - FRONTEND MODULE
  // =====================================================

  const [messagePage, setMessagePage] = useState("create-campaign");
  const [utilityTab, setUtilityTab] = useState("sender-ids");
  const [reportTab, setReportTab] = useState("message-reports");

  const [smsNumbers, setSmsNumbers] = useState("");
  const [smsSenderId, setSmsSenderId] = useState("631304");
  const [smsTemplateId, setSmsTemplateId] = useState("Hindi-Promo");
  const [smsCampaignName, setSmsCampaignName] = useState("");
  const [smsMessage, setSmsMessage] = useState(
    "प्रिय ग्राहक, हम आपके व्यवसाय को बढ़ाने के लिए विश्वसनीय और किफायती SMS, WhatsApp, RCS और वॉयस सॉल्यूशंस प्रदान कर रहे हैं। अधिक जानकारी के लिए कृपया {#var#} पर क्लिक करें। धन्यवाद, टीम यूनिक डिजिटल आउटरीच"
  );
  const [smsSendStatus, setSmsSendStatus] = useState("");
  const [smsScheduledAt, setSmsScheduledAt] = useState("");
  const [showAddSenderForm, setShowAddSenderForm] = useState(false);
  const [newSenderId, setNewSenderId] = useState("");
  const [newSenderType, setNewSenderType] = useState("ALPHABETICAL");
  const [newSenderPurpose, setNewSenderPurpose] = useState("SERVICE");

  const [editingSenderId, setEditingSenderId] = useState(null);
  const [editSenderValue, setEditSenderValue] = useState("");
  const [editSenderType, setEditSenderType] = useState("ALPHABETICAL");
  const [editSenderPurpose, setEditSenderPurpose] = useState("SERVICE");
  const [editSenderStatus, setEditSenderStatus] = useState("ACTIVE"); 

  const [smsClicks, setSmsClicks] = useState([]);
  const [smsClicksLoading, setSmsClicksLoading] = useState(false);
  const [smsClicksError, setSmsClicksError] = useState("");

  const [smsClickCampaignFilter, setSmsClickCampaignFilter] = useState("");
  const [smsClickRecipientFilter, setSmsClickRecipientFilter] = useState("");
  const [smsClickPhoneFilter, setSmsClickPhoneFilter] = useState("");

  const filteredSmsClicks = smsClicks.filter((click) => {
  const campaignMatch =
    !smsClickCampaignFilter ||
    String(click.campaign_id || "").includes(
      smsClickCampaignFilter.trim()
    );

  const recipientMatch =
    !smsClickRecipientFilter ||
    String(click.recipient_id || "").includes(
      smsClickRecipientFilter.trim()
    );

  const phoneMatch =
    !smsClickPhoneFilter ||
    String(click.phone_number || "").includes(
      smsClickPhoneFilter.trim()
    );

  return campaignMatch && recipientMatch && phoneMatch;
});


    // =====================================================
  // LOAD SMS SENDER IDS + TEMPLATES FROM BACKEND
  // =====================================================

  useEffect(() => {

    const loadSmsUtilityData = async () => {

      try {

        const [senderResponse, templateResponse] =
          await Promise.all([
            fetch("http://localhost:5000/api/sms/sender-ids"),
            fetch("http://localhost:5000/api/sms/templates")
          ]);

        if (!senderResponse.ok) {
          throw new Error("Failed to load SMS sender IDs");
        }

        if (!templateResponse.ok) {
          throw new Error("Failed to load SMS templates");
        }

        const senderData = await senderResponse.json();
        const templateData = await templateResponse.json();

        // -----------------------------------------
        // FORMAT SENDER IDS FOR EXISTING UI
        // -----------------------------------------

        const formattedSenders = Array.isArray(senderData)
          ? senderData.map((sender) => ({
              id: sender.id,
              user: sender.user_id === 1 ? "demo" : `User ${sender.user_id}`,
              header: sender.sender_id,
              senderType: sender.sender_type,
              purpose: sender.purpose,
              status: sender.status,
              createdAt: sender.created_at
                ? new Date(sender.created_at).toLocaleString()
                : "-"
            }))
          : [];

        // -----------------------------------------
        // FORMAT TEMPLATES FOR EXISTING UI
        // -----------------------------------------

        const formattedTemplates = Array.isArray(templateData)
          ? templateData.map((template) => {

              const linkedSender =
                formattedSenders.find(
                  (sender) =>
                    Number(sender.id) ===
                    Number(template.sender_id)
                );

              return {
                id: template.id,
                name: template.template_name,
                templateId: template.id,
                senderId: linkedSender
                  ? linkedSender.header
                  : template.sender_id,
                content: template.template_content,
                status: template.status,
                templateType: template.template_type,
                createdAt: template.created_at
                  ? new Date(
                      template.created_at
                    ).toLocaleString()
                  : "-"
              };

            })
          : [];

        setSmsSenderIds(formattedSenders);

        setSmsTemplates(formattedTemplates);

        // -----------------------------------------
        // SET FIRST ACTIVE SENDER
        // -----------------------------------------

        if (formattedSenders.length > 0) {

          const activeSender =
            formattedSenders.find(
              (sender) =>
                String(sender.status).toUpperCase() ===
                "ACTIVE"
            ) || formattedSenders[0];

          setSmsSenderId(activeSender.header);

        }

        // -----------------------------------------
        // SET FIRST APPROVED TEMPLATE
        // -----------------------------------------

        if (formattedTemplates.length > 0) {

          const approvedTemplate =
            formattedTemplates.find(
              (template) =>
                String(template.status).toUpperCase() ===
                "APPROVED"
            ) || formattedTemplates[0];

          setSmsTemplateId(approvedTemplate.name);

          setSmsMessage(
            approvedTemplate.content || ""
          );

        }

        console.log(
          "SMS Sender IDs loaded:",
          formattedSenders
        );

        console.log(
          "SMS Templates loaded:",
          formattedTemplates
        );

      } catch (error) {

        console.error(
          "SMS Utility API error:",
          error
        );

        setSmsSendStatus(
          "Unable to load SMS Sender IDs or Templates"
        );

      }

    };

    loadSmsUtilityData();

  }, []);

  const [smsSenderIds, setSmsSenderIds] = useState([
    {
      id: 1,
      user: "demo",
      header: "631304",
      peId: "1001257135446905185",
      status: "Approved",
      createdAt: "Dec 17, 2025, 11:34:32 AM",
    },
    {
      id: 2,
      user: "demo",
      header: "UDOPVL",
      peId: "1001257135446905185",
      status: "Approved",
      createdAt: "Dec 17, 2025, 11:34:17 AM",
    },
  ]);

  const [smsTemplates, setSmsTemplates] = useState([
    {
      id: 1,
      name: "OTP1",
      templateId: "1007661904386429640",
      senderId: "UDOPVL",
      content: "OTP for your web login is {#var#}. Do not share this code with anyone. Thank you, UDOPVL.",
      status: "Approved",
    },
    {
      id: 2,
      name: "Hindi-Promo",
      templateId: "1007078302541511692",
      senderId: "631304",
      content: "प्रिय ग्राहक, हम आपके व्यवसाय को बढ़ाने के लिए विश्वसनीय और किफायती SMS, WhatsApp, RCS और वॉयस सॉल्यूशंस प्रदान कर रहे हैं।",
      status: "Approved",
    },
    {
      id: 3,
      name: "Promo2",
      templateId: "1007880719327758154",
      senderId: "631304",
      content: "Dear customer, we are offering reliable and affordable SMS, WhatsApp, RCS, and voice solutions.",
      status: "Approved",
    },
    {
      id: 4,
      name: "Login",
      templateId: "12071617223016121949",
      senderId: "A7MARQ",
      content: "OTP for login is {#var#} and is valid for 5 minutes. Generated at {#var#}.",
      status: "Approved",
    },
  ]);


const [showAddTemplateForm, setShowAddTemplateForm] = useState(false);
const [newTemplateName, setNewTemplateName] = useState("");
const [newTemplateType, setNewTemplateType] = useState("TEXT");
const [newTemplateContent, setNewTemplateContent] = useState("");
const [newTemplateStatus, setNewTemplateStatus] = useState("PENDING");
const [newTemplateSenderId, setNewTemplateSenderId] = useState("");
const [smsReports, setSmsReports] = useState([]);
const [smsReportsLoading, setSmsReportsLoading] = useState(false);
const [smsReportsError, setSmsReportsError] = useState("");
const [smsReportCampaignFilter, setSmsReportCampaignFilter] = useState("");
const [smsReportPhoneFilter, setSmsReportPhoneFilter] = useState("");
const [smsReportStatusFilter, setSmsReportStatusFilter] = useState("ALL");
const [smsLogs, setSmsLogs] = useState([]);
const [smsLogsLoading, setSmsLogsLoading] = useState(false);
const [smsLogsError, setSmsLogsError] = useState("");

const [smsLogCampaignFilter, setSmsLogCampaignFilter] = useState("");
const [smsLogRecipientFilter, setSmsLogRecipientFilter] = useState("");
const [smsLogPhoneFilter, setSmsLogPhoneFilter] = useState("");
const [smsLogStatusFilter, setSmsLogStatusFilter] = useState("ALL");

const filteredSmsLogs = smsLogs.filter((log) => {
  const campaignMatch =
    !smsLogCampaignFilter ||
    String(log.campaign_id || "").includes(
      smsLogCampaignFilter.trim()
    );

  const recipientMatch =
    !smsLogRecipientFilter ||
    String(log.recipient_id || "").includes(
      smsLogRecipientFilter.trim()
    );

  const phoneMatch =
    !smsLogPhoneFilter ||
    String(log.phone_number || "").includes(
      smsLogPhoneFilter.trim()
    );

  const statusMatch =
    smsLogStatusFilter === "ALL" ||
    String(log.status || "").toUpperCase() ===
      smsLogStatusFilter;

  return (
    campaignMatch &&
    recipientMatch &&
    phoneMatch &&
    statusMatch
  );
});

const filteredSmsReports = smsReports.filter((report) => {
  const campaignMatch =
    !smsReportCampaignFilter ||
    String(report.campaignName || "")
      .toLowerCase()
      .includes(
        smsReportCampaignFilter.trim().toLowerCase()
      );

  const phoneMatch =
    !smsReportPhoneFilter ||
    String(report.number || "").includes(
      smsReportPhoneFilter.trim()
    );

  const statusMatch =
    smsReportStatusFilter === "ALL" ||
    String(report.response || "").toUpperCase() ===
      smsReportStatusFilter;

  return campaignMatch && phoneMatch && statusMatch;
});

// =====================================================
// RCS SENDER IDs
// =====================================================

const [rcsSenderIds, setRcsSenderIds] = useState([]);
const [rcsSendStatus, setRcsSendStatus] = useState("");
const [rcsLoading, setRcsLoading] = useState(false);

const [rcsUtilityTab, setRcsUtilityTab] = useState("sender-ids");

// =====================================================
// RCS TEMPLATES
// =====================================================

const [rcsTemplates, setRcsTemplates] = useState([]);
const [rcsTemplateSearch, setRcsTemplateSearch] = useState("");
const [rcsTemplatePageSize, setRcsTemplatePageSize] = useState(10);
const [showAddRcsTemplateForm, setShowAddRcsTemplateForm] =
  useState(false);
const [editingRcsTemplateId, setEditingRcsTemplateId] = useState(null);

const [rcsTemplateBotId, setRcsTemplateBotId] = useState("");
const [rcsTemplateMessageType, setRcsTemplateMessageType] =
  useState("TRANSACTIONAL");

const [rcsTemplateName, setRcsTemplateName] = useState("");

const [rcsTemplateType, setRcsTemplateType] =
  useState("SHORT_TEXT");

// RCS template content fields
const [rcsTemplateText, setRcsTemplateText] = useState("");
const [rcsTemplateUrl, setRcsTemplateUrl] = useState("");

const [showAddRcsSenderForm, setShowAddRcsSenderForm] =
  useState(false);

const [newRcsBrandName, setNewRcsBrandName] =
  useState("");

const [newRcsBotId, setNewRcsBotId] =
  useState("");

const [newRcsStatus, setNewRcsStatus] =
  useState("APPROVED");
const [editingRcsSenderId, setEditingRcsSenderId] =
  useState(null);

  // =====================================================
  // LOAD RCS SENDER IDS FROM BACKEND
  // =====================================================

useEffect(() => {

  const loadRcsSenderIds = async () => {

    setRcsLoading(true);
    setRcsSendStatus("");

    try {

      const response = await fetch(
        "http://localhost:5000/api/rcs/sender-ids"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load RCS Sender IDs"
        );
      }

      const data = await response.json();

      const formattedRcsSenders =
        Array.isArray(data)
          ? data.map((sender) => ({
              id: sender.id,
              user:
                sender.user_id === 1
                  ? "demo"
                  : `User ${sender.user_id}`,
              brandName:
                sender.brand_name,
              botId:
                sender.bot_id,
              status:
                sender.status,
              createdAt:
                sender.created_at
                  ? new Date(
                      sender.created_at
                    ).toLocaleString()
                  : "-"
            }))
          : [];

      setRcsSenderIds(formattedRcsSenders);

      console.log(
        "RCS Sender IDs loaded:",
        formattedRcsSenders
      );

    } catch (error) {

      console.error(
        "RCS Sender ID API error:",
        error
      );

      setRcsSendStatus(
        "Unable to load RCS Sender IDs"
      );

    } finally {

      setRcsLoading(false);

    }

  };

  loadRcsSenderIds();

}, []);

  // =====================================================
  // LOAD RCS TEMPLATES FROM BACKEND / MYSQL
  // =====================================================

  const loadRcsTemplates = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/rcs/templates"
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error || "Failed to load RCS templates"
        );
      }

      const data = await response.json();

      const formattedTemplates = Array.isArray(data)
        ? data.map((template) => {
            let content = {};

            // Content is stored as JSON in message_text so every
            // RCS template type, including carousel cards, survives reloads.
            if (template.message_text) {
              try {
                const parsed = JSON.parse(template.message_text);
                if (parsed && typeof parsed === "object") {
                  content = parsed;
                }
              } catch (parseError) {
                // Backward-compatible fallback for older plain-text rows.
                if (template.template_type === "SHORT_TEXT" ||
                    template.template_type === "TEXT_TEMPLATE") {
                  content = {
                    text: template.message_text || "",
                    url: template.url_preview || "",
                  };
                } else {
                  content = {
                    title: template.card_title || "",
                    description: template.card_description || "",
                    mediaUrl: template.media_url || "",
                    buttonText: template.button_text || "",
                    buttonUrl: template.button_url || "",
                  };
                }
              }
            }

            // If JSON was empty/missing, rebuild content from the table columns.
            if (!content || Object.keys(content).length === 0) {
              if (template.template_type === "SHORT_TEXT") {
                content = {
                  text: template.message_text || "",
                  url: template.url_preview || "",
                };
              } else if (template.template_type === "TEXT_TEMPLATE") {
                content = {
                  text: template.message_text || "",
                  buttonText: template.button_text || "",
                  buttonUrl: template.button_url || "",
                };
              } else {
                content = {
                  title: template.card_title || "",
                  description: template.card_description || "",
                  mediaUrl: template.media_url || "",
                  buttonText: template.button_text || "",
                  buttonUrl: template.button_url || "",
                };
              }
            }

            return {
              id: template.id,
              user:
                template.user_id === 1
                  ? "demo"
                  : `User ${template.user_id}`,
              templateName: template.template_name,
              botId: template.bot_id,
              templateType: template.template_type,
              messageType: template.bot_message_type,
              status: template.status || "PENDING",
              createdAt: template.created_at
                ? new Date(template.created_at).toLocaleString()
                : "-",
              content,
              brandName: template.brand_name || "-",
            };
          })
        : [];

      setRcsTemplates(formattedTemplates);
      console.log("RCS Templates loaded:", formattedTemplates);
    } catch (error) {
      console.error("RCS Template API error:", error);
      setRcsSendStatus(
        error.message || "Unable to load RCS Templates"
      );
    }
  };

  useEffect(() => {
    loadRcsTemplates();
  }, []);

  const getSmsNumbers = () =>
    smsNumbers
      .split(/[,\n;]+/)
      .map((number) => number.trim())
      .filter(Boolean)
      .map((number) => number.replace(/[^0-9+]/g, ""))
      .filter((number) => /^\+?[0-9]{10,15}$/.test(number));

  const smsNumberCount = getSmsNumbers().length;
  const smsCharCount = smsMessage.length;
  const smsLimit = /[^\x00-\x7F]/.test(smsMessage) ? 70 : 160;
  const smsCount = smsMessage.length === 0 ? 0 : Math.ceil(smsMessage.length / smsLimit);

  const clearSmsForm = () => {
    setSmsNumbers("");
    setSmsCampaignName("");
    setSmsSendStatus("");
  };

  const handleSmsSend = async () => {
  setSmsSendStatus("");

  const numbers = getSmsNumbers();

  // -----------------------------------------
  // VALIDATION
  // -----------------------------------------

  if (numbers.length === 0) {
    setSmsSendStatus(
      "Please enter at least one valid mobile number."
    );
    return;
  }

  if (!smsMessage.trim()) {
    setSmsSendStatus("Please enter a message.");
    return;
  }

  if (!smsCampaignName.trim()) {
    setSmsSendStatus("Please enter a campaign name.");
    return;
  }

  // -----------------------------------------
  // FIND SELECTED SENDER
  // -----------------------------------------

  const selectedSender = smsSenderIds.find(
    (sender) =>
      String(sender.header) === String(smsSenderId)
  );

  if (!selectedSender) {
    setSmsSendStatus(
      "Please select a valid Sender ID."
    );
    return;
  }

  // -----------------------------------------
  // FIND SELECTED TEMPLATE
  // -----------------------------------------

  const selectedTemplate = smsTemplates.find(
    (template) =>
      String(template.name) ===
      String(smsTemplateId)
  );

  if (!selectedTemplate) {
    setSmsSendStatus(
      "Please select a valid SMS template."
    );
    return;
  }

  try {

    setSmsSendStatus(
      "Creating SMS campaign..."
    );

    // -----------------------------------------
    // CALL BACKEND
    // -----------------------------------------

    const response = await fetch(
      "http://localhost:5000/api/sms/send",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          user_id: 1,

          sender_id: selectedSender.id,

          template_id: selectedTemplate.id,

          campaign_name:
            smsCampaignName.trim(),

          phone_numbers: numbers,

          message:
            smsMessage.trim(),
        }),
      }
    );

    const data = await response.json();

    // -----------------------------------------
    // BACKEND ERROR
    // -----------------------------------------

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Failed to create SMS campaign."
      );
    }

    // -----------------------------------------
    // ADD RESULT TO CURRENT REPORT TABLE
    // -----------------------------------------

    setSmsReports((previous) => [
      {
        id:
          data.campaign_id ||
          Date.now(),

        user: "demo",

        sender:
          selectedSender.header,

        gateway: "DEMO",

        peId: "-",

        templateId:
          selectedTemplate.id,

        messageId:
          `CAMPAIGN-${data.campaign_id}`,

        number:
          numbers[0],

        message:
          smsMessage.trim(),

        credit: "Pending",

        response:
          data.status || "QUEUED",

        createdAt:
          new Date().toLocaleString(),
      },

      ...previous,
    ]);

    // -----------------------------------------
    // SUCCESS MESSAGE
    // -----------------------------------------

    setSmsSendStatus(
      `SMS campaign "${smsCampaignName.trim()}" created successfully for ${numbers.length} number(s). Status: ${data.status || "QUEUED"}.`
    );

  } catch (error) {

    console.error(
      "SMS Send Error:",
      error
    );

    setSmsSendStatus(
      `SMS campaign failed: ${error.message}`
    );

  }
};

const handleSmsSchedule = async () => {
  setSmsSendStatus("");

  const numbers = getSmsNumbers();

  if (numbers.length === 0) {
    setSmsSendStatus(
      "Please enter or upload at least one valid mobile number."
    );
    return;
  }

  if (!smsMessage.trim()) {
    setSmsSendStatus("Please enter a message.");
    return;
  }

  if (!smsCampaignName.trim()) {
    setSmsSendStatus("Please enter a campaign name.");
    return;
  }

  if (!smsScheduledAt) {
    setSmsSendStatus(
      "Please select a date and time first."
    );
    return;
  }

  const selectedSender = smsSenderIds.find(
    (sender) =>
      String(sender.header) === String(smsSenderId)
  );

  if (!selectedSender) {
    setSmsSendStatus(
      "Please select a valid Sender ID."
    );
    return;
  }

  const selectedTemplate = smsTemplates.find(
    (template) =>
      String(template.name) === String(smsTemplateId)
  );

  if (!selectedTemplate) {
    setSmsSendStatus(
      "Please select a valid DLT Template."
    );
    return;
  }

  const selectedDate = new Date(smsScheduledAt);

  if (
    Number.isNaN(selectedDate.getTime()) ||
    selectedDate <= new Date()
  ) {
    setSmsSendStatus(
      "Please select a future date and time."
    );
    return;
  }

  const scheduledAt =
    smsScheduledAt.replace("T", " ") + ":00";

  try {
    setSmsSendStatus(
      "Scheduling SMS campaign..."
    );

    const response = await fetch(
      "http://localhost:5000/api/sms/schedule",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: 1,
          sender_id: selectedSender.id,
          template_id: selectedTemplate.id,
          campaign_name: smsCampaignName.trim(),
          phone_numbers: numbers,
          message: smsMessage.trim(),
          scheduled_at: scheduledAt,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Failed to schedule SMS campaign."
      );
    }

    setSmsSendStatus(
      `SMS campaign "${smsCampaignName.trim()}" scheduled successfully for ${numbers.length} number(s). Status: ${data.status || "SCHEDULED"}.`
    );

    setSmsScheduledAt("");

  } catch (error) {
    console.error(
      "SMS Schedule Error:",
      error
    );

    setSmsSendStatus(
      `SMS scheduling failed: ${error.message}`
    );
  }
};

  // =====================================================
  // WHATSAPP CAMPAIGNS
  // =====================================================

  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState("");

  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignDetailsLoading, setCampaignDetailsLoading] = useState(false);
  const [campaignDetailsError, setCampaignDetailsError] = useState("");

  // =====================================================
  // CREATE WHATSAPP CAMPAIGN
  // =====================================================

  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignTemplateId, setNewCampaignTemplateId] = useState("");
  const [createCampaignLoading, setCreateCampaignLoading] = useState(false);
  const [createCampaignError, setCreateCampaignError] = useState("");
  const [createCampaignSuccess, setCreateCampaignSuccess] = useState("");


  // =====================================================
  // WHATSAPP TEMPLATES
  // =====================================================

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState("");

  // =====================================================
  // ADD WHATSAPP TEMPLATE
  // =====================================================

  const [whatsappNumbers, setWhatsappNumbers] = useState([]);
  const [selectedWhatsAppNumberId, setSelectedWhatsAppNumberId] = useState("");
  const [showAddWhatsAppTemplate, setShowAddWhatsAppTemplate] = useState(false);
  const [newWhatsAppTemplateName, setNewWhatsAppTemplateName] = useState("");
  const [newWhatsAppTemplateCategory, setNewWhatsAppTemplateCategory] = useState("MARKETING");
  const [newWhatsAppTemplateType, setNewWhatsAppTemplateType] = useState("CUSTOM");
  const [newWhatsAppTemplateContent, setNewWhatsAppTemplateContent] = useState("");
  const [newWhatsAppTemplateStatus, setNewWhatsAppTemplateStatus] = useState("PENDING");
  const [addWhatsAppTemplateLoading, setAddWhatsAppTemplateLoading] = useState(false);
  const [addWhatsAppTemplateError, setAddWhatsAppTemplateError] = useState("");
  const [addWhatsAppTemplateSuccess, setAddWhatsAppTemplateSuccess] = useState("");

  // =====================================================
  // WHATSAPP RECIPIENTS
  // =====================================================

  const [recipients, setRecipients] = useState([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipientsError, setRecipientsError] = useState("");


  // =====================================================
// CAMPAIGN RECIPIENT SELECTION
// =====================================================

const [selectedRecipientIds, setSelectedRecipientIds] = useState([]);
const [addingRecipients, setAddingRecipients] = useState(false);
const [addRecipientsError, setAddRecipientsError] = useState("");
const [addRecipientsSuccess, setAddRecipientsSuccess] = useState("");

  // =====================================================
  // ADD NEW RECIPIENT
  // =====================================================

  const [newRecipientName, setNewRecipientName] = useState("");
  const [newRecipientPhone, setNewRecipientPhone] = useState("");
  const [addingNewRecipient, setAddingNewRecipient] = useState(false);
  const [newRecipientError, setNewRecipientError] = useState("");
  const [newRecipientSuccess, setNewRecipientSuccess] = useState("");
  const [sendCampaignLoading, setSendCampaignLoading] = useState(false);
  const [sendCampaignError, setSendCampaignError] = useState("");
  const [sendCampaignSuccess, setSendCampaignSuccess] = useState("");



  // =====================================================
  // FETCH DASHBOARD + MESSAGES + CAMPAIGNS
  // + TEMPLATES + RECIPIENTS
  // =====================================================

  const loadWhatsAppNumbers = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/whatsapp/numbers"
      );

      if (!response.ok) {
        throw new Error("Failed to load WhatsApp numbers");
      }

      const data = await response.json();

      const numbers = Array.isArray(data)
        ? data
        : Array.isArray(data.numbers)
          ? data.numbers
          : [];

      setWhatsappNumbers(numbers);

      if (numbers.length > 0) {
        setSelectedWhatsAppNumberId((current) =>
          current || String(numbers[0].id)
        );
      }
    } catch (error) {
      console.error("WhatsApp numbers loading error:", error);
      setWhatsappNumbers([]);
    }
  };

  const loadWhatsAppTemplates = async () => {
    setTemplatesLoading(true);
    setTemplatesError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/whatsapp/templates"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch WhatsApp templates");
      }

      const data = await response.json();

      const templateList = Array.isArray(data)
        ? data
        : Array.isArray(data.templates)
          ? data.templates
          : [];

      setTemplates(templateList);
    } catch (error) {
      console.error("WhatsApp templates API error:", error);
      setTemplatesError("Unable to load WhatsApp templates");
    } finally {
      setTemplatesLoading(false);
    }
  };

  const resetWhatsAppTemplateForm = (clearSuccess = true) => {
    setNewWhatsAppTemplateName("");
    setNewWhatsAppTemplateCategory("MARKETING");
    setNewWhatsAppTemplateType("CUSTOM");
    setNewWhatsAppTemplateContent("");
    setNewWhatsAppTemplateStatus("PENDING");
    setAddWhatsAppTemplateError("");

    if (clearSuccess) {
      setAddWhatsAppTemplateSuccess("");
    }
  };

  const addWhatsAppTemplate = async () => {
    const templateName = newWhatsAppTemplateName.trim();
    const templateContent = newWhatsAppTemplateContent.trim();

    setAddWhatsAppTemplateError("");
    setAddWhatsAppTemplateSuccess("");

    if (!selectedWhatsAppNumberId) {
      setAddWhatsAppTemplateError("Please select a WhatsApp number.");
      return;
    }

    if (!templateName) {
      setAddWhatsAppTemplateError("Please enter a template name.");
      return;
    }

    if (!templateContent) {
      setAddWhatsAppTemplateError("Please enter template content.");
      return;
    }

    const duplicate = templates.some(
      (template) =>
        String(template.template_name || "").trim().toLowerCase() ===
        templateName.toLowerCase()
    );

    if (duplicate) {
      setAddWhatsAppTemplateError(
        `Template "${templateName}" already exists.`
      );
      return;
    }

    setAddWhatsAppTemplateLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/whatsapp/templates",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: 1,
            whatsapp_number_id: Number(selectedWhatsAppNumberId),
            template_name: templateName,
            category: newWhatsAppTemplateCategory,
            template_type: newWhatsAppTemplateType,
            template_content: templateContent,
            status: newWhatsAppTemplateStatus,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          "Failed to add WhatsApp template."
        );
      }

      // Reload the list after a successful insert.
      await loadWhatsAppTemplates();

      setAddWhatsAppTemplateSuccess(
        `Template "${templateName}" added successfully.`
      );

      resetWhatsAppTemplateForm(false);
      setShowAddWhatsAppTemplate(false);
    } catch (error) {
      console.error("Add WhatsApp template error:", error);

      setAddWhatsAppTemplateError(
        error.message || "Unable to add WhatsApp template."
      );
    } finally {
      setAddWhatsAppTemplateLoading(false);
    }
  };

  useEffect(() => {

    // -------------------------------
    // Dashboard statistics
    // -------------------------------

    loadWhatsAppNumbers();

    fetch("http://localhost:5000/api/whatsapp/dashboard")

      .then((response) => {

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        return response.json();

      })

      .then((data) => {

        console.log("Dashboard API response:", data);

        setStats(data);

        setLoading(false);

      })

      .catch((err) => {

        console.error("Dashboard API error:", err);

        setError("Unable to load dashboard data");

        setLoading(false);

      });


    // -------------------------------
    // WhatsApp messages
    // -------------------------------

    fetch("http://localhost:5000/api/whatsapp/messages")

      .then((response) => {

        if (!response.ok) {
          throw new Error("Failed to fetch WhatsApp messages");
        }

        return response.json();

      })

      .then((data) => {

        console.log("WhatsApp messages API response:", data);

        setMessages(data);

        setMessagesLoading(false);

      })

      .catch((err) => {

        console.error("WhatsApp messages API error:", err);

        setMessagesError("Unable to load WhatsApp messages");

        setMessagesLoading(false);

      });


    // -------------------------------
    // WhatsApp campaigns
    // -------------------------------

    setCampaignsLoading(true);

    fetch("http://localhost:5000/api/whatsapp/campaigns")

      .then((response) => {

        if (!response.ok) {
          throw new Error("Failed to fetch WhatsApp campaigns");
        }

        return response.json();

      })

      .then((data) => {

        console.log("WhatsApp campaigns API response:", data);

        const campaignList = Array.isArray(data)
          ? data
          : Array.isArray(data.campaigns)
            ? data.campaigns
            : [];

        setCampaigns(campaignList);

        setCampaignsLoading(false);

      })

      .catch((err) => {

        console.error("WhatsApp campaigns API error:", err);

        setCampaignsError("Unable to load WhatsApp campaigns");

        setCampaignsLoading(false);

      });


    // -------------------------------
    // WhatsApp templates
    // -------------------------------

    setTemplatesLoading(true);

    fetch("http://localhost:5000/api/whatsapp/templates")

      .then((response) => {

        if (!response.ok) {
          throw new Error("Failed to fetch WhatsApp templates");
        }

        return response.json();

      })

      .then((data) => {

        console.log("WhatsApp templates API response:", data);

        const templateList = Array.isArray(data)
          ? data
          : Array.isArray(data.templates)
            ? data.templates
            : [];

        setTemplates(templateList);

        setTemplatesLoading(false);

      })

      .catch((err) => {

        console.error("WhatsApp templates API error:", err);

        setTemplatesError("Unable to load WhatsApp templates");

        setTemplatesLoading(false);

      });


    // -------------------------------
    // WhatsApp recipients
    // -------------------------------

    setRecipientsLoading(true);

    fetch("http://localhost:5000/api/whatsapp/recipients")

      .then((response) => {

        if (!response.ok) {
          throw new Error("Failed to fetch WhatsApp recipients");
        }

        return response.json();

      })

      .then((data) => {

        console.log("WhatsApp recipients API response:", data);

        const recipientList = Array.isArray(data)
          ? data
          : Array.isArray(data.recipients)
            ? data.recipients
            : [];

        setRecipients(recipientList);

        setRecipientsLoading(false);

      })

      .catch((err) => {

        console.error("WhatsApp recipients API error:", err);

        setRecipientsError("Unable to load WhatsApp recipients");

        setRecipientsLoading(false);

      });

          // -------------------------------
    // SMS message reports
    // -------------------------------
    setSmsReportsLoading(true);
    setSmsReportsError("");

    fetch("http://localhost:5000/api/sms/messages")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch SMS reports");
        }

        return response.json();
      })
      .then((data) => {
        console.log("SMS reports API response:", data);

        const reportList = Array.isArray(data) ? data : [];

        const formattedReports = reportList.map((sms) => ({
          id: sms.id,
          user: sms.user_id === 1 ? "demo" : `User ${sms.user_id}`,
          sender: sms.sender_id || "-",
          gateway: "DEMO",
          peId: "-",
          templateId: "-",
          messageId: `SMS-${sms.id}`,
          number: sms.phone_number || "-",
          message: sms.message || "",
          credit: "Pending",
          response: sms.status || "QUEUED",
          createdAt: sms.created_at
            ? new Date(sms.created_at).toLocaleString()
            : "-",
          campaignName: sms.campaign_name || "-",
        }));

        setSmsReports(formattedReports);
        setSmsReportsLoading(false);
      })
      .catch((err) => {
        console.error("SMS reports API error:", err);
        setSmsReportsError("Unable to load SMS reports");
        setSmsReportsLoading(false);
      });

      // -------------------------------
// SMS delivery logs
// -------------------------------
setSmsLogsLoading(true);
setSmsLogsError("");

fetch("http://localhost:5000/api/sms/delivery-logs")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Failed to fetch SMS delivery logs");
    }

    return response.json();
  })
  .then((data) => {
    console.log("SMS delivery logs API response:", data);

    setSmsLogs(Array.isArray(data) ? data : []);
    setSmsLogsLoading(false);
  })
  .catch((err) => {
    console.error("SMS delivery logs API error:", err);
    setSmsLogsError("Unable to load SMS delivery logs");
    setSmsLogsLoading(false);
  });


  // -------------------------------
// SMS click reports
// -------------------------------
setSmsClicksLoading(true);
setSmsClicksError("");

fetch("http://localhost:5000/api/sms/clicks")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Failed to fetch SMS clicks");
    }

    return response.json();
  })
  .then((data) => {
    console.log("SMS clicks API response:", data);

    setSmsClicks(Array.isArray(data) ? data : []);
    setSmsClicksLoading(false);
  })
  .catch((err) => {
    console.error("SMS clicks API error:", err);
    setSmsClicksError("Unable to load SMS click data");
    setSmsClicksLoading(false);
  });

  }, []);



  // =====================================================
// AUTO-REFRESH WHATSAPP DASHBOARD STATISTICS
// =====================================================

useEffect(() => {
  const refreshDashboardStats = () => {
    fetch("http://localhost:5000/api/whatsapp/dashboard")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to refresh dashboard data");
        }

        return response.json();
      })
      .then((dashboardData) => {
        console.log("Dashboard auto-refresh:", dashboardData);
        setStats(dashboardData);
      })
      .catch((error) => {
        console.error("Dashboard auto-refresh error:", error);
      });
  };

  const intervalId = window.setInterval(
    refreshDashboardStats,
    30000
  );

  return () => {
    window.clearInterval(intervalId);
  };
}, []);



  // =====================================================
  // OPEN CAMPAIGN DETAILS
  // =====================================================

  const openCampaignDetails = (campaignId) => {

    setCampaignDetailsLoading(true);

    setCampaignDetailsError("");

    setSelectedCampaign(null);

    fetch(`http://localhost:5000/api/whatsapp/campaigns/${campaignId}`)

      .then((response) => {

        if (!response.ok) {
          throw new Error("Failed to fetch campaign details");
        }

        return response.json();

      })

      .then((data) => {

        setSelectedCampaign(data);

        setCampaignDetailsLoading(false);

      })

      .catch((err) => {

        console.error("Campaign details API error:", err);

        setCampaignDetailsError("Unable to load campaign details");

        setCampaignDetailsLoading(false);

      });

  };

// =====================================================
// ADD RECIPIENTS TO CAMPAIGN
// =====================================================

const addRecipientsToCampaign = async () => {

  if (!selectedCampaign) {
    return;
  }

  if (selectedRecipientIds.length === 0) {
    setAddRecipientsError("Please select at least one recipient.");
    setAddRecipientsSuccess("");
    return;
  }

  setAddingRecipients(true);
  setAddRecipientsError("");
  setAddRecipientsSuccess("");

  try {

    const selectedRecipients = recipients.filter((recipient) =>
      selectedRecipientIds.includes(recipient.id)
    );

    const response = await fetch(
      `http://localhost:5000/api/whatsapp/campaigns/${selectedCampaign.campaign.id}/recipients`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          recipients: selectedRecipients
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to add recipients"
      );
    }

    setAddRecipientsSuccess(
      `${data.added} recipient(s) added successfully.`
    );

    setSelectedRecipientIds([]);

    // Refresh campaign details
    openCampaignDetails(selectedCampaign.campaign.id);

    // Refresh campaign list
    fetch("http://localhost:5000/api/whatsapp/campaigns")
      .then((response) => response.json())
      .then((data) => {

        const campaignList = Array.isArray(data)
          ? data
          : Array.isArray(data.campaigns)
            ? data.campaigns
            : [];

        setCampaigns(campaignList);

      });

  } catch (error) {

    console.error(
      "Add recipients error:",
      error
    );

    setAddRecipientsError(
      error.message || "Unable to add recipients"
    );

  } finally {

    setAddingRecipients(false);

  }

};
  // =====================================================
  // CREATE WHATSAPP CAMPAIGN
  // =====================================================

  // =====================================================
  // ADD NEW RECIPIENT TO CAMPAIGN
  // =====================================================

  const addNewRecipient = async () => {

    if (!selectedCampaign) {
      return;
    }

    setNewRecipientError("");
    setNewRecipientSuccess("");

    const name = newRecipientName.trim();
    const phone = newRecipientPhone.trim().replace(/\s+/g, "");

    if (!name) {
      setNewRecipientError("Please enter recipient name.");
      return;
    }

    if (!phone) {
      setNewRecipientError("Please enter phone number.");
      return;
    }

    const phoneRegex = /^\+?[0-9]{10,15}$/;

    if (!phoneRegex.test(phone)) {
      setNewRecipientError(
        "Please enter a valid phone number (10 to 15 digits)."
      );
      return;
    }

    if (selectedCampaign.campaign?.status !== "DRAFT") {
      setNewRecipientError(
        "New recipients can only be added to a DRAFT campaign."
      );
      return;
    }

    setAddingNewRecipient(true);

    try {

      const response = await fetch(
        `http://localhost:5000/api/whatsapp/campaigns/${selectedCampaign.campaign.id}/add-recipient`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipient_name: name,
            phone_number: phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to add recipient"
        );
      }

      setNewRecipientName("");
      setNewRecipientPhone("");
      setNewRecipientSuccess("Recipient added successfully.");
      setNewRecipientError("");

      fetch("http://localhost:5000/api/whatsapp/recipients")
        .then((recipientResponse) => {
          if (!recipientResponse.ok) {
            throw new Error("Failed to refresh recipients");
          }
          return recipientResponse.json();
        })
        .then((recipientData) => {
          const recipientList = Array.isArray(recipientData)
            ? recipientData
            : Array.isArray(recipientData.recipients)
              ? recipientData.recipients
              : [];

          setRecipients(recipientList);
        })
        .catch((refreshError) => {
          console.error("Recipient refresh error:", refreshError);
        });

      openCampaignDetails(selectedCampaign.campaign.id);

      fetch("http://localhost:5000/api/whatsapp/campaigns")
        .then((campaignResponse) => {
          if (!campaignResponse.ok) {
            throw new Error("Failed to refresh campaigns");
          }
          return campaignResponse.json();
        })
        .then((campaignData) => {
          const campaignList = Array.isArray(campaignData)
            ? campaignData
            : Array.isArray(campaignData.campaigns)
              ? campaignData.campaigns
              : [];

          setCampaigns(campaignList);
        })
        .catch((refreshError) => {
          console.error("Campaign refresh error:", refreshError);
        });

    } catch (error) {

      console.error("Add new recipient error:", error);

      setNewRecipientError(
        error.message || "Unable to add recipient."
      );
      setNewRecipientSuccess("");

    } finally {

      setAddingNewRecipient(false);

    }

  };
// =====================================================
// SEND WHATSAPP CAMPAIGN
// =====================================================

const sendCampaign = async () => {

  if (!selectedCampaign?.campaign?.id) {
    return;
  }

  if (selectedCampaign.campaign.status !== "DRAFT") {
    setSendCampaignError(
      "Only DRAFT campaigns can be sent."
    );
    return;
  }

  if (
    !selectedCampaign.recipients ||
    selectedCampaign.recipients.length === 0
  ) {
    setSendCampaignError(
      "Please add at least one recipient before sending."
    );
    return;
  }

  const confirmed = window.confirm(
    `Send campaign "${selectedCampaign.campaign.campaign_name}" to ${selectedCampaign.recipients.length} recipient(s)?`
  );

  if (!confirmed) {
    return;
  }

  setSendCampaignLoading(true);
  setSendCampaignError("");
  setSendCampaignSuccess("");

  try {

    const response = await fetch(
      "http://localhost:5000/api/whatsapp/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaign_id: selectedCampaign.campaign.id,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to send campaign"
      );
    }

    setSendCampaignSuccess(
      `Campaign sent successfully. ${data.sent} recipient(s) processed.`
    );

    // Refresh campaign details
    openCampaignDetails(
      selectedCampaign.campaign.id
    );

    // Refresh campaigns list
    fetch(
      "http://localhost:5000/api/whatsapp/campaigns"
    )
      .then((response) => response.json())
      .then((campaignData) => {

        const campaignList = Array.isArray(campaignData)
          ? campaignData
          : Array.isArray(campaignData.campaigns)
            ? campaignData.campaigns
            : [];

        setCampaigns(campaignList);

      })
      .catch((error) => {
        console.error(
          "Campaign refresh error:",
          error
        );
      });

    // Refresh delivery logs / messages
    fetch(
      "http://localhost:5000/api/whatsapp/messages"
    )
      .then((response) => response.json())
      .then((messageData) => {
        setMessages(messageData);
      })
      .catch((error) => {
        console.error(
          "Message refresh error:",
          error
        );
      });

    // Refresh dashboard statistics
    fetch(
      "http://localhost:5000/api/whatsapp/dashboard"
    )
      .then((response) => response.json())
      .then((dashboardData) => {
        setStats(dashboardData);
      })
      .catch((error) => {
        console.error(
          "Dashboard refresh error:",
          error
        );
      });

  } catch (error) {

    console.error(
      "Send campaign error:",
      error
    );

    setSendCampaignError(
      error.message || "Unable to send campaign."
    );

  } finally {

    setSendCampaignLoading(false);

  }
};

  const createCampaign = () => {

    const campaignName = newCampaignName.trim();

    if (!campaignName) {
      setCreateCampaignError("Campaign name is required");
      setCreateCampaignSuccess("");
      return;
    }

    if (!newCampaignTemplateId) {
      setCreateCampaignError("Please select a template");
      setCreateCampaignSuccess("");
      return;
    }

    setCreateCampaignLoading(true);
    setCreateCampaignError("");
    setCreateCampaignSuccess("");

    fetch("http://localhost:5000/api/whatsapp/campaigns", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        campaign_name: campaignName,
        template_id: Number(newCampaignTemplateId),
      }),
    })
      .then(async (response) => {

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to create WhatsApp campaign"
          );
        }

        return data;
      })
      .then((data) => {

        if (data.campaign) {
          setCampaigns((previousCampaigns) => [
            data.campaign,
            ...previousCampaigns,
          ]);
        }

        setNewCampaignName("");
        setNewCampaignTemplateId("");
        setCreateCampaignSuccess(
          "Campaign created successfully as DRAFT."
        );
        setCreateCampaignError("");
      })
      .catch((err) => {

        console.error(
          "Create campaign API error:",
          err
        );

        setCreateCampaignError(
          err.message || "Unable to create campaign"
        );

        setCreateCampaignSuccess("");
      })
      .finally(() => {
        setCreateCampaignLoading(false);
      });
  };


  // =====================================================
  // CHART TOTAL
  // =====================================================

  const total = stats.totalInitiated;


  // =====================================================
  // BAR HEIGHT
  // =====================================================

  const getBarHeight = (value) => {

    if (total === 0) {
      return 0;
    }

    return Math.max((value / total) * 100, 2);

  };


  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (status) => {

    switch (status) {

      case "DELIVERED":
        return "status-delivered";

      case "READ":
        return "status-read";

      case "FAILED":
        return "status-failed";

      case "SENT":
        return "status-sent";

      case "PENDING":
        return "status-pending";

      default:
        return "status-default";

    }

  };


  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {

    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString();

  };


  return (

    <div className="app">


      {/* =================================================
          SIDEBAR
      ================================================= */}

     <aside
  className={`sidebar ${
    sidebarCollapsed ? "sidebar-collapsed" : ""
  }`}
>

        <div className="brand">

          <div className="brand-icon">
            ✦
          </div>

          <span>
            UNIQUE DIGITAL
          </span>

        </div>

        <div className="sidebar-menu">

       <div
  className={`menu-item ${
    currentPage === "user-management"
      ? "menu-item-active"
      : ""
  }`}
  onClick={() => {
    setCurrentPage("user-management");
    setOpenMenu(null);
  }}
  style={{ cursor: "pointer" }}
>
  <span>👤</span>
  <span>User Management</span>
  <span className="arrow">›</span>
</div>


         <div
  className={`menu-item ${
    currentPage === "address-book"
      ? "menu-item-active"
      : ""
  }`}
  onClick={() => {
    setCurrentPage("address-book");
    setOpenMenu(null);
  }}
  style={{ cursor: "pointer" }}
>
  <span>▣</span>

  <span>
    Address Book
  </span>

  <span className="arrow">
    ›
  </span>
</div>


          <div
            className="menu-item"
            onClick={() =>
              setOpenMenu(
                openMenu === "message"
                  ? null
                  : "message"
              )
            }
          >
            <span>✉</span>

            <span>
              Message App
            </span>

            <span className="arrow">
              {openMenu === "message" ? "⌃" : "⌄"}
            </span>
          </div>

          {openMenu === "message" && (
            <div className="submenu">
              <div
                className={`submenu-item ${
                  currentPage === "message-create"
                    ? "submenu-item-active"
                    : ""
                }`}
                onClick={() => {
                  setCurrentPage("message-create");
                  setMessagePage("create-campaign");
                }}
              >
                <span>Create Campaign</span>
                <span className="submenu-arrow">›</span>
              </div>

              <div
                className={`submenu-item ${
                  currentPage === "message-utility"
                    ? "submenu-item-active"
                    : ""
                }`}
                onClick={() => {
                  setCurrentPage("message-utility");
                  setMessagePage("utility");
                }}
              >
                <span>Utility Manager</span>
                <span className="submenu-arrow">›</span>
              </div>

              <div
                className={`submenu-item ${
                  currentPage === "message-reports"
                    ? "submenu-item-active"
                    : ""
                }`}
                onClick={() => {
                  setCurrentPage("message-reports");
                  setMessagePage("reports");
                }}
              >
                <span>Manage Reports</span>
                <span className="submenu-arrow">›</span>
              </div>
            </div>
          )}


          <div
  className={`menu-item ${
    currentPage === "commerce"
      ? "menu-item-active"
      : ""
  }`}
  onClick={() => {
    setCurrentPage("commerce");
    setOpenMenu(null);
  }}
  style={{ cursor: "pointer" }}
>
  <span>💰</span>

  <span>
    Commerce
  </span>

  <span className="arrow">
    ›
  </span>
</div>


          <div
            className="menu-item"
            onClick={() =>
              setOpenMenu(
                openMenu === "whatsapp"
                  ? null
                  : "whatsapp"
              )
            }
          >

            <span>◉</span>

            <span>
              WhatsApp App
            </span>

            <span className="arrow">
              {openMenu === "whatsapp" ? "⌃" : "⌄"}
            </span>

          </div>


          {openMenu === "whatsapp" && (

            <div className="submenu">

              <div
                className={`submenu-item ${
                  currentPage === "dashboard"
                    ? "submenu-item-active"
                    : ""
                }`}
                onClick={() =>
                  setCurrentPage("dashboard")
                }
              >

                <span>
                  Dashboard
                </span>

                <span className="submenu-arrow">
                  ›
                </span>

              </div>


              <div
                className={`submenu-item ${
                  currentPage === "campaigns"
                    ? "submenu-item-active"
                    : ""
                }`}
                onClick={() =>
                  setCurrentPage("campaigns")
                }
              >

                <span>
                  Campaigns
                </span>

                <span className="submenu-arrow">
                  ›
                </span>

              </div>


              <div
                className={`submenu-item ${
                  currentPage === "templates"
                    ? "submenu-item-active"
                    : ""
                }`}
                onClick={() =>
                  setCurrentPage("templates")
                }
              >

                <span>
                  Templates
                </span>

                <span className="submenu-arrow">
                  ›
                </span>

              </div>


              <div
                className={`submenu-item ${
                  currentPage === "recipients"
                    ? "submenu-item-active"
                    : ""
                }`}
                onClick={() =>
                  setCurrentPage("recipients")
                }
              >

                <span>
                  Recipients
                </span>

                <span className="submenu-arrow">
                  ›
                </span>

              </div>


              <div
                className={`submenu-item ${
                  currentPage === "delivery"
                    ? "submenu-item-active"
                    : ""
                }`}
                onClick={() =>
                  setCurrentPage("delivery")
                }
              >

                <span>
                  Delivery Logs
                </span>

                <span className="submenu-arrow">
                  ›
                </span>

              </div>

            </div>

          )}


          <div
            className={`menu-item ${
              currentPage === "team-inbox" || currentPage === "agent-list"
                ? "menu-item-active"
                : ""
            }`}
            onClick={() => {
              setOpenMenu(openMenu === "team-inbox" ? null : "team-inbox");
              setCurrentPage("team-inbox");
            }}
            style={{ cursor: "pointer" }}
          >
            <span>👥</span>
            <span>Team Inbox</span>
            <span className="arrow">
              {openMenu === "team-inbox" ? "⌃" : "⌄"}
            </span>
          </div>

          {openMenu === "team-inbox" && (
            <div className="submenu">
              <div
                className={`submenu-item ${
                  currentPage === "team-inbox" ? "submenu-item-active" : ""
                }`}
                onClick={() => setCurrentPage("team-inbox")}
              >
                <span>Chat Inbox</span>
                <span className="submenu-arrow">›</span>
              </div>
              <div
                className={`submenu-item ${
                  currentPage === "agent-list" ? "submenu-item-active" : ""
                }`}
                onClick={() => setCurrentPage("agent-list")}
              >
                <span>Agent List</span>
                <span className="submenu-arrow">›</span>
              </div>
            </div>
          )}



        <div
  className="menu-item"
  onClick={() =>
    setOpenMenu(
      openMenu === "rcs"
        ? null
        : "rcs"
    )
  }
>

  <span>●</span>

  <span>
    RCS App
  </span>

  <span className="arrow">
    {openMenu === "rcs" ? "⌃" : "⌄"}
  </span>


</div>

{openMenu === "rcs" && (
  <div className="submenu">

    <div
      className="submenu-item"
      onClick={() => {
        setCurrentPage("rcs-broadcast");
      }}
    >
      <span>Broadcast RCS</span>
      <span className="submenu-arrow">›</span>
    </div>

    <div
      className="submenu-item"
      onClick={() => {
        setCurrentPage("rcs-utility");
      }}
    >
      <span>RCS Utility</span>
      <span className="submenu-arrow">›</span>
    </div>

    <div
      className="submenu-item"
      onClick={() => {
        setCurrentPage("rcs-report");
      }}
    >
      <span>RCS Report</span>
      <span className="submenu-arrow">›</span>
    </div>

  </div>
)}

          <div
            className={`menu-item ${
              currentPage === "automation" ? "menu-item-active" : ""
            }`}
            onClick={() => {
              setCurrentPage("automation");
              setOpenMenu(null);
            }}
            style={{ cursor: "pointer" }}
          >
            <span>🤖</span>

            <span>
              Automations
            </span>

            <span className="arrow">
              ›
            </span>
          </div>


          <div
            className="menu-item developer"
            onClick={() =>
              setOpenMenu(
                openMenu === "developer" ? null : "developer"
              )
            }
            style={{ cursor: "pointer" }}
          >

            <span>
              &lt;/&gt;
            </span>

            <span>
              Developer
            </span>

            <span className="arrow">
              {openMenu === "developer" ? "⌃" : "⌄"}
            </span>

          </div>

         {openMenu === "developer" && (
  <div className="submenu">

    <div
      className={`submenu-item ${
        currentPage === "api-key"
          ? "submenu-item-active"
          : ""
      }`}
      onClick={() => {
        setCurrentPage("api-key");
      }}
    >
      <span>Api Key</span>
      <span className="submenu-arrow">›</span>
    </div>

    <div
      className={`submenu-item ${
        currentPage === "api-docs"
          ? "submenu-item-active"
          : ""
      }`}
      onClick={() => {
        setCurrentPage("api-docs");
      }}
    >
      <span>API Documentation</span>
      <span className="submenu-arrow">›</span>
    </div>

  </div>
)}

  </div>
</aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="main-content">


        {/* =================================================
            TOP BAR
        ================================================= */}

        <header className="topbar">

          <div className="top-left">

          <button
  className="menu-button"
  onClick={() => setSidebarCollapsed((previous) => !previous)}
>
  ☰
</button>

           <button
  className="back-button"
  onClick={goBack}
  disabled={pageHistory.length === 0}
>
  ← Go Back
</button>

            <div className="time">
  🕐 Time: {currentTime.toLocaleTimeString()}
</div>

          </div>


          <div className="top-right">

            <div className="country">
              🇮🇳 India
            </div>

            <div className="balance">
              ₹{headerBalance.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="plus-button"
                onClick={() =>
                  setShowQuickCreate((previous) => !previous)
                }
              >
                +
              </button>

              {showQuickCreate && (
                <div
                  style={{
                    position: "absolute",
                    top: "45px",
                    right: "0",
                    width: "210px",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                    padding: "8px 0",
                    zIndex: 1000,
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      fontWeight: "600",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Quick Create
                  </div>

                  <div
                    style={{ padding: "10px 14px", cursor: "pointer" }}
                    onClick={() => {
                      setShowQuickCreate(false);
                      setCurrentPage("message-create");
                      setMessagePage("create-campaign");
                    }}
                  >
                    SMS Campaign
                  </div>

                  <div
                    style={{ padding: "10px 14px", cursor: "pointer" }}
                    onClick={() => {
                      setShowQuickCreate(false);
                      setCurrentPage("campaigns");
                    }}
                  >
                    WhatsApp Campaign
                  </div>

                  <div
                    style={{ padding: "10px 14px", cursor: "pointer" }}
                    onClick={() => {
                      setShowQuickCreate(false);
                      setCurrentPage("rcs-broadcast");
                    }}
                  >
                    RCS Campaign
                  </div>

                  <div
                    style={{ padding: "10px 14px", cursor: "pointer" }}
                    onClick={() => {
                      setShowQuickCreate(false);
                      setCurrentPage("templates");
                    }}
                  >
                    Template
                  </div>
                </div>
              )}
            </div>

           <div
  className="notification"
  onClick={() => setShowNotifications((previous) => !previous)}
  style={{ cursor: "pointer", position: "relative" }}
>
  🔔

  {showNotifications && (
    <div
      style={{
        position: "absolute",
        top: "45px",
        right: "0",
        width: "300px",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
        padding: "16px",
        zIndex: 1000,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        style={{
          fontWeight: "600",
          fontSize: "16px",
          marginBottom: "10px",
        }}
      >
        Notifications
      </div>

      <div
        style={{
          fontSize: "14px",
          color: "#6b7280",
        }}
      >
        No new notifications
      </div>
    </div>
  )}
</div>

            <div
  className="profile"
  onClick={() => setShowProfileMenu((previous) => !previous)}
  style={{
    cursor: "pointer",
    position: "relative",
  }}
>
  ◉
</div>

<div
  onClick={() => setShowProfileMenu((previous) => !previous)}
  style={{
    cursor: "pointer",
    position: "relative",
  }}
>
  demo⌄

  {showProfileMenu && (
    <div
      style={{
        position: "absolute",
        top: "35px",
        right: "0",
        width: "180px",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
        padding: "8px 0",
        zIndex: 1000,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div
  style={{
    padding: "10px 14px",
    cursor: "pointer",
  }}
  onClick={() => {
    setShowProfileMenu(false);
    setShowProfileModal(true);
  }}
>
  Profile
</div>
      <div
  style={{
    padding: "10px 14px",
    cursor: "pointer",
  }}
  onClick={() => {
    setShowProfileMenu(false);
    setShowSettingsModal(true);
  }}
>
  Settings
</div>

      <div
  style={{
    padding: "10px 14px",
    cursor: "pointer",
  }}
  onClick={() => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) {
      return;
    }

    setShowProfileMenu(false);
    window.location.reload();
  }}
>
  Logout
</div>
    </div>
  )}
</div>
          </div>

        </header>


        {showProfileModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    }}
    onClick={() => setShowProfileModal(false)}
  >
    <div
      style={{
        width: "380px",
        background: "#ffffff",
        borderRadius: "14px",
        padding: "24px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <h2>Profile</h2>

      <p>
        <strong>User:</strong> demo
      </p>

      <p>
        <strong>Account Type:</strong> Demo Account
      </p>

      <p>
        <strong>Status:</strong> Active
      </p>

      <button
        type="button"
        onClick={() => setShowProfileModal(false)}
      >
        Close
      </button>
    </div>
  </div>
)}

{showSettingsModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    }}
    onClick={() => setShowSettingsModal(false)}
  >
    <div
      style={{
        width: "420px",
        background: "#ffffff",
        borderRadius: "14px",
        padding: "24px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <h2>Settings</h2>

      <p>
        Dashboard and application settings.
      </p>

      <div
        style={{
          padding: "12px 0",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        Dashboard auto-refresh
        <div
          style={{
            fontSize: "13px",
            color: "#6b7280",
            marginTop: "4px",
          }}
        >
          WhatsApp statistics refresh every 30 seconds.
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowSettingsModal(false)}
        style={{ marginTop: "18px" }}
      >
        Close
      </button>
    </div>
  </div>
)}



        {/* =================================================
            DASHBOARD
        ================================================= */}

        
        {currentPage === "message-create" ||
        currentPage === "message-utility" ||
        currentPage === "message-reports" ? (
          <>
            {/* =====================================================
                MESSAGE APP
            ===================================================== */}

            {currentPage === "message-create" && (
              <>
                <div className="page-header">
                  <div>
                    <h1>SMS Create Campaign</h1>
                    <p>Create and send bulk SMS campaigns.</p>
                  </div>
                </div>

                <section className="data-section" style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(240px, 0.9fr) minmax(420px, 1.8fr) minmax(220px, 0.8fr)",
                      gap: "20px",
                      alignItems: "stretch",
                    }}
                  >
                    {/* LEFT ACTION PANEL */}
                    <div
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "10px",
                        padding: "18px",
                        background: "#fff",
                      }}
                    >
                      <button
  type="button"
  onClick={() => {
    setSmsSendStatus("");

    const editor = document.getElementById(
      "smsMessageEditor"
    );

    if (editor) {
      editor.focus();
      editor.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }}
  style={{
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #dbe3ef",
    borderRadius: "8px",
    background: "#fff",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: "600",
    marginBottom: "12px",
  }}
>
  💬 Customize SMS
</button>
                      <button
  type="button"
  onClick={() =>
    document.getElementById("smsBulkUploadInput").click()
  }
  style={{
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #dbe3ef",
    borderRadius: "8px",
    background: "#fff",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: "600",
  }}
>
  ⬆ Bulk Upload SMS
</button>

<input
  id="smsBulkUploadInput"
  type="file"
  accept=".csv,.xlsx,.xls"
  style={{ display: "none" }}
 onChange={(event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  const fileName = file.name.toLowerCase();
  const isExcel =
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls");

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      let numbers = [];

      if (isExcel) {
        // Read Excel workbook
        const data = new Uint8Array(e.target.result);

        const workbook = XLSX.read(data, {
          type: "array",
        });

        const firstSheet =
          workbook.Sheets[workbook.SheetNames[0]];

        const rows = XLSX.utils.sheet_to_json(
          firstSheet,
          {
            header: 1,
            defval: "",
          }
        );

        rows.forEach((row) => {
          row.forEach((cell) => {
            const value = String(cell).trim();

            if (value) {
              numbers.push(value);
            }
          });
        });

      } else {
        // Read CSV
        const text = String(e.target.result || "");

        const lines = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        if (lines.length === 0) {
          setSmsSendStatus(
            "The CSV file is empty."
          );
          return;
        }

        const firstLine = lines[0].toLowerCase();

        const dataLines =
          firstLine.includes("phone") ||
          firstLine.includes("mobile") ||
          firstLine.includes("number")
            ? lines.slice(1)
            : lines;

        numbers = dataLines.flatMap((line) =>
          line.split(/[;,]/)
        );
      }

      // Clean numbers
      numbers = numbers
        .map((number) =>
          String(number)
            .replace(/["']/g, "")
            .trim()
        )
        .filter(Boolean);

      if (numbers.length === 0) {
        setSmsSendStatus(
          "No phone numbers found in the file."
        );
        return;
      }

      // Remove header-like values
      numbers = numbers.filter((number) => {
        const value = number.toLowerCase();

        return (
          value !== "phone_number" &&
          value !== "phone number" &&
          value !== "mobile_number" &&
          value !== "mobile number" &&
          value !== "phone" &&
          value !== "mobile" &&
          value !== "number"
        );
      });

      // Remove duplicate numbers
      const uniqueNumbers = [
        ...new Set(numbers),
      ];

      setSmsNumbers(
        uniqueNumbers.join("\n")
      );

      setSmsSendStatus(
        `${uniqueNumbers.length} phone number(s) imported successfully from ${file.name}.`
      );

    } catch (error) {
      console.error(
        "SMS bulk file import error:",
        error
      );

      setSmsSendStatus(
        "Unable to read the selected file."
      );
    }
  };

  reader.onerror = () => {
    setSmsSendStatus(
      "Unable to read the selected file."
    );
  };

  if (isExcel) {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }

  // Allow selecting the same file again
  event.target.value = "";
}}
/>

                      <div
                        style={{
                          marginTop: "24px",
                          minHeight: "210px",
                          borderRadius: "10px",
                          background:
                            "linear-gradient(135deg, #eef7ff 0%, #f8fbff 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          padding: "20px",
                          color: "#2563eb",
                          fontWeight: "700",
                        }}
                      >
                        SMS Campaign
                        <br />
                        Bulk Messaging
                      </div>
                    </div>

                    {/* CENTER COMPOSER */}
                    <div
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "10px",
                        padding: "18px",
                        background: "#fff",
                      }}
                    >
                      <label style={{ display: "block", fontWeight: "600", marginBottom: "8px" }}>
                        Mobile Numbers
                      </label>

                      <textarea
                        value={smsNumbers}
                        onChange={(event) => setSmsNumbers(event.target.value)}
                        placeholder="Insert numbers here with or without +91"
                        rows={4}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          resize: "vertical",
                          padding: "12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          outline: "none",
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "8px",
                          color: "#64748b",
                          fontSize: "13px",
                        }}
                      >
                        <span>Use comma, semicolon, or new line between numbers.</span>
                        <strong>Total Numbers: {smsNumberCount}</strong>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "12px",
                          marginTop: "18px",
                        }}
                      >
                        <div>
                          <label style={{ display: "block", fontWeight: "600", marginBottom: "7px" }}>
                            Sender ID
                          </label>
                          <select
                            value={smsSenderId}
                            onChange={(event) => setSmsSenderId(event.target.value)}
                            style={{
                              width: "100%",
                              padding: "11px",
                              border: "1px solid #d1d5db",
                              borderRadius: "7px",
                              background: "#fff",
                            }}
                          >
                            {smsSenderIds.map((sender) => (
                              <option key={sender.id} value={sender.header}>
                                {sender.header}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: "block", fontWeight: "600", marginBottom: "7px" }}>
                            DLT Template
                          </label>
                          <select
                            value={smsTemplateId}
                            onChange={(event) => {
                              const selected = smsTemplates.find(
                                (template) => template.name === event.target.value
                              );
                              setSmsTemplateId(event.target.value);
                              if (selected) {
                                setSmsMessage(selected.content);
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "11px",
                              border: "1px solid #d1d5db",
                              borderRadius: "7px",
                              background: "#fff",
                            }}
                          >
                            {smsTemplates.map((template) => (
                              <option key={template.id} value={template.name}>
                                {template.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ marginTop: "14px" }}>
                        <label style={{ display: "block", fontWeight: "600", marginBottom: "7px" }}>
                          Campaign Name
                        </label>
                        <input
                          type="text"
                          value={smsCampaignName}
                          onChange={(event) => setSmsCampaignName(event.target.value)}
                          placeholder="Input Campaign Name"
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "11px",
                            border: "1px solid #d1d5db",
                            borderRadius: "7px",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          marginTop: "18px",
                          border: "1px solid #dbe3ef",
                          borderRadius: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            background: "#0f6fdc",
                            color: "#fff",
                            padding: "12px 14px",
                            fontWeight: "700",
                            textAlign: "center",
                          }}
                        >
                          ☷ Text Message
                        </div>

                        <textarea
  id="smsMessageEditor"
  value={smsMessage}
  onChange={(event) => setSmsMessage(event.target.value)}
  rows={8}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            resize: "vertical",
                            border: "0",
                            padding: "14px",
                            outline: "none",
                            lineHeight: "1.55",
                          }}
                        />

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "16px",
                            padding: "8px 14px 12px",
                            color: "#64748b",
                            fontSize: "13px",
                          }}
                        >
                          <span>Chars: {smsCharCount}</span>
                          <span>SMS: {smsCount}</span>
                        </div>
                      </div>

                      {smsSendStatus && (
                        <div
                          style={{
                            marginTop: "14px",
                            padding: "12px",
                            borderRadius: "7px",
                            background:
                              smsSendStatus.includes("successfully") ||
                              smsSendStatus.includes("ready")
                                ? "#dcfce7"
                                : "#fff7ed",
                            color:
                              smsSendStatus.includes("successfully") ||
                              smsSendStatus.includes("ready")
                                ? "#166534"
                                : "#9a3412",
                          }}
                        >
                          {smsSendStatus}
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "10px",
                          marginTop: "18px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleSmsSend}
                          style={{
                            border: "0",
                            borderRadius: "7px",
                            padding: "11px 18px",
                            background: "#0f6fdc",
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: "600",
                          }}
                        >
                          ✈ Send Now
                        </button>

                        <button
                          type="button"
                          onClick={handleSmsSchedule}
                          style={{
                            border: "0",
                            borderRadius: "7px",
                            padding: "11px 18px",
                            background: "#64748b",
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: "600",
                          }}
                        >


                          <div
  style={{
    marginTop: "12px",
    marginBottom: "12px",
  }}
>
  <label
    style={{
      display: "block",
      fontWeight: "600",
      marginBottom: "7px",
    }}
  >
    Schedule Date & Time
  </label>

  <input
    type="datetime-local"
    value={smsScheduledAt}
    onChange={(event) =>
      setSmsScheduledAt(event.target.value)
    }
    style={{
      width: "100%",
      boxSizing: "border-box",
      padding: "11px",
      border: "1px solid #d1d5db",
      borderRadius: "7px",
      background: "#fff",
    }}
  />
</div>
                          ◷ Schedule SMS
                        </button>

                        <button
                          type="button"
                          onClick={clearSmsForm}
                          style={{
                            border: "1px solid #cbd5e1",
                            borderRadius: "7px",
                            padding: "11px 18px",
                            background: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* PHONE PREVIEW */}
                    <div
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "10px",
                        padding: "18px",
                        background: "#fff",
                      }}
                    >
                      <div style={{ fontWeight: "700", marginBottom: "12px" }}>
                        Live Preview
                      </div>

                      <div
                        style={{
                          maxWidth: "250px",
                          margin: "0 auto",
                          border: "7px solid #111827",
                          borderRadius: "28px",
                          overflow: "hidden",
                          background: "#f8fafc",
                          minHeight: "430px",
                        }}
                      >
                        <div
                          style={{
                            background: "#075e54",
                            color: "#fff",
                            padding: "15px 12px",
                            fontWeight: "700",
                          }}
                        >
                          ← AD-{smsSenderId}
                        </div>

                        <div style={{ padding: "16px 12px" }}>
                          <div
                            style={{
                              background: "#fff",
                              borderRadius: "8px",
                              padding: "12px",
                              fontSize: "13px",
                              lineHeight: "1.45",
                              boxShadow: "0 1px 3px rgba(0,0,0,.08)",
                            }}
                          >
                            {smsMessage || "Your SMS preview will appear here."}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}

            {currentPage === "message-utility" && (
              <>
                <div className="page-header">
                  <div>
                    <h1>SMS Utility Manager</h1>
                    <p>Manage sender IDs and DLT SMS templates.</p>
                  </div>
                  <button
                    type="button"
                    className="view-button"
                    onClick={() => {
  if (utilityTab === "sender-ids") {
    setShowAddSenderForm(true);
    setNewSenderId("");
    setNewSenderType("ALPHABETICAL");
    setNewSenderPurpose("SERVICE");
    setSmsSendStatus("");
  } else {
    setShowAddTemplateForm(true);
    setNewTemplateName("");
    setNewTemplateType("TEXT");
    setNewTemplateContent("");
    setNewTemplateStatus("PENDING");
    setSmsSendStatus("");
  }
}}
                  
                  >
                    + {utilityTab === "sender-ids" ? "Add Sender ID" : "Add Template"}
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setUtilityTab("sender-ids")}
                    style={{
                      padding: "11px 18px",
                      borderRadius: "7px",
                      border: "1px solid #dbe3ef",
                      background: utilityTab === "sender-ids" ? "#0f6fdc" : "#fff",
                      color: utilityTab === "sender-ids" ? "#fff" : "#334155",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Sender IDs
                  </button>
                  <button
                    type="button"
                    onClick={() => setUtilityTab("templates")}
                    style={{
                      padding: "11px 18px",
                      borderRadius: "7px",
                      border: "1px solid #dbe3ef",
                      background: utilityTab === "templates" ? "#0f6fdc" : "#fff",
                      color: utilityTab === "templates" ? "#fff" : "#334155",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Templates
                  </button>
                </div>

                {smsSendStatus && (
                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "12px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      borderRadius: "7px",
                    }}
                  >
                    {smsSendStatus}
                  </div>
                )}

               {utilityTab === "sender-ids" ? (
  <section className="data-section">

    {showAddSenderForm && (
      <div
        style={{
          marginBottom: "20px",
          padding: "18px",
          border: "1px solid #dbe3ef",
          borderRadius: "8px",
          background: "#f8fafc",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          Add Sender ID
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
            gap: "12px",
            marginBottom: "16px",
          }}
        >

          <div>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "7px",
              }}
            >
              Sender ID
            </label>

            <input
              type="text"
              value={newSenderId}
              onChange={(e) =>
                setNewSenderId(
                  e.target.value.toUpperCase()
                )
              }
              maxLength={20}
              placeholder="Example: MYBRAND"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "7px",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "7px",
              }}
            >
              Sender Type
            </label>

            <select
              value={newSenderType}
              onChange={(e) =>
                setNewSenderType(e.target.value)
              }
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "7px",
                background: "#fff",
              }}
            >
              <option value="ALPHABETICAL">
                ALPHABETICAL
              </option>
              <option value="NUMERIC">
                NUMERIC
              </option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "7px",
              }}
            >
              Purpose
            </label>

            <select
              value={newSenderPurpose}
              onChange={(e) =>
                setNewSenderPurpose(e.target.value)
              }
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "7px",
                background: "#fff",
              }}
            >
              <option value="SERVICE">
                SERVICE
              </option>
              <option value="PROMOTIONAL">
                PROMOTIONAL
              </option>
            </select>
          </div>

        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            type="button"
            className="view-button"
            onClick={async () => {

              const senderValue =
                newSenderId.trim().toUpperCase();

              if (!senderValue) {
                setSmsSendStatus(
                  "Please enter a Sender ID."
                );
                return;
              }

              try {

                const response = await fetch(
                  "http://localhost:5000/api/sms/sender-ids",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type":
                        "application/json",
                    },
                    body: JSON.stringify({
                      user_id: 1,
                      sender_id: senderValue,
                      sender_type: newSenderType,
                      purpose: newSenderPurpose,
                      status: "ACTIVE",
                    }),
                  }
                );

                const data =
                  await response.json();

                if (!response.ok) {
                  throw new Error(
                    data.error ||
                      "Failed to add Sender ID"
                  );
                }

                setShowAddSenderForm(false);
                setNewSenderId("");
                setNewSenderType("ALPHABETICAL");
                setNewSenderPurpose("SERVICE");

                setSmsSendStatus(
                  `Sender ID "${senderValue}" added successfully.`
                );

                // Reload Sender IDs from backend
                const senderResponse =
                  await fetch(
                    "http://localhost:5000/api/sms/sender-ids"
                  );

                if (senderResponse.ok) {
                  const senderData =
                    await senderResponse.json();

                  const formattedSenders =
                    Array.isArray(senderData)
                      ? senderData.map((sender) => ({
                          id: sender.id,
                          user:
                            sender.user_id === 1
                              ? "demo"
                              : `User ${sender.user_id}`,
                          header:
                            sender.sender_id,
                          senderType:
                            sender.sender_type,
                          purpose:
                            sender.purpose,
                          status:
                            sender.status,
                          createdAt:
                            sender.created_at
                              ? new Date(
                                  sender.created_at
                                ).toLocaleString()
                              : "-",
                        }))
                      : [];

                  setSmsSenderIds(
                    formattedSenders
                  );
                }

              } catch (error) {

                console.error(
                  "Add Sender ID error:",
                  error
                );

                setSmsSendStatus(
                  error.message ||
                    "Unable to add Sender ID."
                );
              }
            }}
          >
            Add Sender ID
          </button>

          <button
            type="button"
            className="view-button"
            onClick={() => {
              setShowAddSenderForm(false);
              setNewSenderId("");
              setNewSenderType("ALPHABETICAL");
              setNewSenderPurpose("SERVICE");
              setSmsSendStatus("");
            }}
          >
            Cancel
          </button>
        </div>

      </div>
    )}

    {editingSenderId !== null && (
  <div
    style={{
      marginBottom: "20px",
      padding: "18px",
      border: "1px solid #dbe3ef",
      borderRadius: "8px",
      background: "#f8fafc",
    }}
  >
    <h3 style={{ marginTop: 0 }}>
      Edit Sender ID
    </h3>

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(4, minmax(160px, 1fr))",
        gap: "12px",
        marginBottom: "16px",
      }}
    >
      <div>
        <label
          style={{
            display: "block",
            fontWeight: "600",
            marginBottom: "7px",
          }}
        >
          Sender ID
        </label>

        <input
          type="text"
          value={editSenderValue}
          onChange={(e) =>
            setEditSenderValue(
              e.target.value.toUpperCase()
            )
          }
          maxLength={20}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "7px",
          }}
        />
      </div>

      <div>
        <label
          style={{
            display: "block",
            fontWeight: "600",
            marginBottom: "7px",
          }}
        >
          Sender Type
        </label>

        <select
          value={editSenderType}
          onChange={(e) =>
            setEditSenderType(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "7px",
            background: "#fff",
          }}
        >
          <option value="ALPHABETICAL">
            ALPHABETICAL
          </option>
          <option value="NUMERIC">
            NUMERIC
          </option>
        </select>
      </div>

      <div>
        <label
          style={{
            display: "block",
            fontWeight: "600",
            marginBottom: "7px",
          }}
        >
          Purpose
        </label>

        <select
          value={editSenderPurpose}
          onChange={(e) =>
            setEditSenderPurpose(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "7px",
            background: "#fff",
          }}
        >
          <option value="SERVICE">
            SERVICE
          </option>
          <option value="PROMOTIONAL">
            PROMOTIONAL
          </option>
        </select>
      </div>

      <div>
        <label
          style={{
            display: "block",
            fontWeight: "600",
            marginBottom: "7px",
          }}
        >
          Status
        </label>

        <select
          value={editSenderStatus}
          onChange={(e) =>
            setEditSenderStatus(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "7px",
            background: "#fff",
          }}
        >
          <option value="ACTIVE">
            ACTIVE
          </option>
          <option value="INACTIVE">
            INACTIVE
          </option>
        </select>
      </div>
    </div>

    <div
      style={{
        display: "flex",
        gap: "10px",
      }}
    >
      <button
        type="button"
        className="view-button"
        onClick={async () => {
          const senderValue =
            editSenderValue.trim().toUpperCase();

          if (!senderValue) {
            setSmsSendStatus(
              "Please enter a Sender ID."
            );
            return;
          }

          try {
            const response = await fetch(
              `http://localhost:5000/api/sms/sender-ids/${editingSenderId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  sender_id: senderValue,
                  sender_type: editSenderType,
                  purpose: editSenderPurpose,
                  status: editSenderStatus,
                }),
              }
            );

            const data =
              await response.json();

            if (!response.ok) {
              throw new Error(
                data.error ||
                  "Failed to update Sender ID"
              );
            }

            setSmsSenderIds((items) =>
              items.map((item) =>
                item.id === editingSenderId
                  ? {
                      ...item,
                      header: senderValue,
                      senderType:
                        editSenderType,
                      purpose:
                        editSenderPurpose,
                      status:
                        editSenderStatus,
                    }
                  : item
              )
            );

            if (
              smsSenderId ===
              smsSenderIds.find(
                (item) =>
                  item.id === editingSenderId
              )?.header
            ) {
              setSmsSenderId(senderValue);
            }

            setEditingSenderId(null);
            setEditSenderValue("");
            setEditSenderType("ALPHABETICAL");
            setEditSenderPurpose("SERVICE");
            setEditSenderStatus("ACTIVE");

            setSmsSendStatus(
              `Sender ID "${senderValue}" updated successfully.`
            );
          } catch (error) {
            console.error(
              "Update Sender ID error:",
              error
            );

            setSmsSendStatus(
              error.message ||
                "Unable to update Sender ID."
            );
          }
        }}
      >
        Save Changes
      </button>

      <button
        type="button"
        className="view-button"
        onClick={() => {
          setEditingSenderId(null);
          setEditSenderValue("");
          setEditSenderType("ALPHABETICAL");
          setEditSenderPurpose("SERVICE");
          setEditSenderStatus("ACTIVE");
          setSmsSendStatus("");
        }}
      >
        Cancel
      </button>
    </div>
  </div>
)}

    <div className="data-section-header">
                      <div>
                        <h2>Sender ID List</h2>
                        <p>Approved sender headers assigned to the demo user.</p>
                      </div>
                      <div className="message-count">{smsSenderIds.length} Sender IDs</div>
                    </div>

                    <div className="messages-table-wrapper">
                      <table className="messages-table campaign-table">
                        <thead>
                          <tr>
                            <th>Select</th>
                            <th>User Assign To</th>
                            <th>Header</th>
                            <th>Sender Type</th>
                            <th>Purpose</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {smsSenderIds.map((sender) => (
                            <tr key={sender.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  onChange={() => setSmsSenderId(sender.header)}
                                  checked={smsSenderId === sender.header}
                                />
                              </td>
                              <td>👤 {sender.user}</td>
                              <td><strong>{sender.header}</strong></td>
                              <td>
                              {sender.senderType || "-"}
                              </td>

                              <td>
                                {sender.purpose || "-"}
                              </td>
                              <td>
                                <span className="status-badge status-delivered">
                                  ● {sender.status}
                                </span>
                              </td>
                              <td>{sender.createdAt}</td>
                              <td>
                                <button
  type="button"
  onClick={() => {
    setEditingSenderId(sender.id);
    setEditSenderValue(sender.header);
    setEditSenderType(
      sender.senderType || "ALPHABETICAL"
    );
    setEditSenderPurpose(
      sender.purpose || "SERVICE"
    );
    setEditSenderStatus(
      sender.status || "ACTIVE"
    );
    setSmsSendStatus("");
  }}
  style={{
    marginRight: "6px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    borderRadius: "5px",
    padding: "6px 9px",
    cursor: "pointer",
  }}
>
  ✎
</button>
                                <button
                                  type="button"
                                  onClick={async () => {
  const confirmed = window.confirm(
    `Delete Sender ID "${sender.header}"?`
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/sms/sender-ids/${sender.id}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to delete Sender ID"
      );
    }

    setSmsSenderIds((items) =>
      items.filter((item) => item.id !== sender.id)
    );

    setSmsSendStatus(
      `Sender ID "${sender.header}" deleted successfully.`
    );

  } catch (error) {
    console.error("Delete Sender ID error:", error);

    setSmsSendStatus(
      error.message || "Unable to delete Sender ID."
    );
  }
}}
                                  style={{
                                    border: "1px solid #fecaca",
                                    background: "#fff",
                                    color: "#dc2626",
                                    borderRadius: "5px",
                                    padding: "6px 9px",
                                    cursor: "pointer",
                                  }}
                                >
                                  🗑
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ) : (
                  <section className="data-section">
                    {showAddTemplateForm && (
  <div
    style={{
      marginBottom: "20px",
      padding: "18px",
      border: "1px solid #dbe3ef",
      borderRadius: "8px",
      background: "#f8fafc",
    }}
  >
    <h3 style={{ marginTop: 0 }}>
      Add SMS Template
    </h3>

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(2, minmax(200px, 1fr))",
        gap: "12px",
        marginBottom: "16px",
      }}
    >
      <div>
        <label
          style={{
            display: "block",
            fontWeight: "600",
            marginBottom: "7px",
          }}
        >
          Template Name
        </label>

        <input
          type="text"
          value={newTemplateName}
          onChange={(e) =>
            setNewTemplateName(e.target.value)
          }
          placeholder="Example: Login OTP"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "7px",
          }}
        />
      </div>

      <div>
        <label
          style={{
            display: "block",
            fontWeight: "600",
            marginBottom: "7px",
          }}
        >
          Template Type
        </label>

        <select
          value={newTemplateType}
          onChange={(e) =>
            setNewTemplateType(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "7px",
            background: "#fff",
          }}
        >
          <option value="TEXT">TEXT</option>
          <option value="OTP">OTP</option>
          <option value="PROMOTIONAL">PROMOTIONAL</option>
        </select>
      </div>

       {/* Sender ID */}
      <div>
        <label
          style={{
            display: "block",
            fontWeight: "600",
            marginBottom: "7px",
          }}
        >
          Sender ID
        </label>

        <select
          value={newTemplateSenderId}
          onChange={(e) =>
            setNewTemplateSenderId(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "7px",
            background: "#fff",
          }}
        >
          <option value="">
            Select Sender ID
          </option>

          {smsSenderIds.map((sender) => (
            <option
              key={sender.id}
              value={sender.id}
            >
              {sender.header}
            </option>
          ))}
        </select>
      </div>

    </div>

    <div style={{ marginBottom: "16px" }}>
      <label
        style={{
          display: "block",
          fontWeight: "600",
          marginBottom: "7px",
        }}
      >
        Template Content
      </label>

      <textarea
        value={newTemplateContent}
        onChange={(e) =>
          setNewTemplateContent(e.target.value)
        }
        rows={6}
        placeholder="Enter SMS template content..."
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "11px",
          border: "1px solid #d1d5db",
          borderRadius: "7px",
          resize: "vertical",
          lineHeight: "1.5",
        }}
      />
    </div>

    <div
      style={{
        display: "flex",
        gap: "10px",
      }}
    >
      <button
        type="button"
        className="view-button"
        onClick={async () => {
          const templateName =
            newTemplateName.trim();

          const templateContent =
            newTemplateContent.trim();

          if (!templateName) {
            setSmsSendStatus(
              "Please enter a template name."
            );
            return;
          }

          if (!templateContent) {
            setSmsSendStatus(
              "Please enter template content."
            );
            return;
          }

          if (!newTemplateSenderId) {
  setSmsSendStatus(
    "Please select a Sender ID."
  );
  return;
}

          try {
            const response = await fetch(
              "http://localhost:5000/api/sms/templates",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
  user_id: 1,
  sender_id: Number(newTemplateSenderId),
  template_name: templateName,
  template_type: newTemplateType,
  template_content: templateContent,
  status: newTemplateStatus,
}),
              }
            );

            const data =
              await response.json();

            if (!response.ok) {
              throw new Error(
                data.error ||
                  "Failed to add SMS template"
              );
            }

            setShowAddTemplateForm(false);

            setNewTemplateName("");
            setNewTemplateType("TEXT");
            setNewTemplateContent("");
            setNewTemplateStatus("PENDING");

            setSmsSendStatus(
              `Template "${templateName}" added successfully.`
            );

            // Reload templates from backend
            const templateResponse =
              await fetch(
                "http://localhost:5000/api/sms/templates"
              );

            if (templateResponse.ok) {
              const templateData =
                await templateResponse.json();

              const formattedTemplates =
                Array.isArray(templateData)
                  ? templateData.map(
                      (template) => ({
                        id: template.id,
                        name:
                          template.template_name,
                        templateId:
                          template.id,
                        senderId:
                          template.sender_id || "-",
                        content:
                          template.template_content,
                        status:
                          template.status,
                        templateType:
                          template.template_type,
                        createdAt:
                          template.created_at
                            ? new Date(
                                template.created_at
                              ).toLocaleString()
                            : "-",
                      })
                    )
                  : [];

              setSmsTemplates(
                formattedTemplates
              );
            }
          } catch (error) {
            console.error(
              "Add SMS template error:",
              error
            );

            setSmsSendStatus(
              error.message ||
                "Unable to add SMS template."
            );
          }
        }}
      >
        Add Template
      </button>

      <button
        type="button"
        className="view-button"
        onClick={() => {
          setShowAddTemplateForm(false);
          setNewTemplateName("");
          setNewTemplateType("TEXT");
          setNewTemplateContent("");
          setNewTemplateStatus("PENDING");
          setSmsSendStatus("");
        }}
      >
        Cancel
      </button>
    </div>
  </div>
)}
                    <div className="data-section-header">
                      <div>
                        <h2>DLT Template List</h2>
                        <p>Approved SMS templates available for campaigns.</p>
                      </div>
                      <div className="message-count">{smsTemplates.length} Templates</div>
                    </div>

                    <div className="messages-table-wrapper">
                      <table className="messages-table campaign-table">
                        <thead>
                          <tr>
                            <th>User Name</th>
                            <th>Template Name</th>
                            <th>Template ID</th>
                            <th>Sender ID</th>
                            <th>Content</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {smsTemplates.map((template) => (
                            <tr key={template.id}>
                              <td>👤 demo</td>
                              <td><strong>{template.name}</strong></td>
                              <td>{template.templateId}</td>
                              <td>{template.senderId}</td>
                              <td>
                                <div style={{ maxWidth: "430px", whiteSpace: "normal", lineHeight: "1.45" }}>
                                  {template.content}
                                </div>
                              </td>
                              <td>
                                <span className="status-badge status-delivered">
                                  ● {template.status}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSmsTemplateId(template.name);
                                    setSmsMessage(template.content);
                                    setCurrentPage("message-create");
                                    setMessagePage("create-campaign");
                                  }}
                                  style={{
                                    marginRight: "6px",
                                    border: "1px solid #cbd5e1",
                                    background: "#fff",
                                    borderRadius: "5px",
                                    padding: "6px 9px",
                                    cursor: "pointer",
                                  }}
                                >
                                  ✎
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSmsTemplates((items) =>
                                      items.filter((item) => item.id !== template.id)
                                    )
                                  }
                                  style={{
                                    border: "1px solid #fecaca",
                                    background: "#fff",
                                    color: "#dc2626",
                                    borderRadius: "5px",
                                    padding: "6px 9px",
                                    cursor: "pointer",
                                  }}
                                >
                                  🗑
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </>
            )}

              
            

            {currentPage === "message-reports" && (
              <>
                <div className="page-header">
                  <div>
                    <h1>SMS Manage Reports</h1>
                    <p>Monitor SMS messages, logs, and downloadable reports.</p>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
                    gap: "10px",
                    marginBottom: "18px",
                  }}
                >
                  {[
                    ["message-reports", "▣", "Message Reports"],
                    ["logs", "▤", "Logs"],
                    ["user-report", "⇩", "User Report Download"],
                    ["clicker-report", "▤", "Clicker Report"],
                  ].map(([key, icon, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setReportTab(key)}
                      style={{
                        minHeight: "80px",
                        border: "1px solid #dbe3ef",
                        borderRadius: "9px",
                        background: reportTab === key ? "#eff6ff" : "#fff",
                        cursor: "pointer",
                        fontWeight: "600",
                        color: "#334155",
                      }}
                    >
                      <div style={{ fontSize: "20px", marginBottom: "5px" }}>{icon}</div>
                      {label}
                    </button>
                  ))}
                </div>

                {reportTab === "message-reports" && (
                  <section className="data-section">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
  type="button"
  className="view-button"
  onClick={() => {
    setSmsReportsLoading(true);
    setSmsReportsError("");

    fetch("http://localhost:5000/api/sms/messages")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch SMS reports");
        }

        return response.json();
      })
      .then((data) => {
        const reportList = Array.isArray(data) ? data : [];

        const formattedReports = reportList.map((sms) => ({
          id: sms.id,
          user: sms.user_id === 1 ? "demo" : `User ${sms.user_id}`,
          sender: sms.sender_id || "-",
          gateway: "DEMO",
          peId: "-",
          templateId: "-",
          messageId: `SMS-${sms.id}`,
          number: sms.phone_number || "-",
          message: sms.message || "",
          credit: "Pending",
          response: sms.status || "QUEUED",
          createdAt: sms.created_at
            ? new Date(sms.created_at).toLocaleString()
            : "-",
          campaignName: sms.campaign_name || "-",
        }));

        setSmsReports(formattedReports);
        setSmsReportsLoading(false);
        setSmsSendStatus("Report refreshed.");
      })
      .catch((err) => {
        console.error("SMS reports refresh error:", err);
        setSmsReportsError("Unable to refresh SMS reports");
        setSmsReportsLoading(false);
      });
  }}
>
  ⟳ Refresh
</button>

                      <button
                        type="button"
                        className="view-button"
                        onClick={() => {
                          setSmsReportCampaignFilter("");
                          setSmsReportPhoneFilter("");
                          setSmsReportStatusFilter("ALL");
                        }}
                      >
                        Clear
                      </button>

                      <input
  type="text"
  placeholder="Campaign"
  value={smsReportCampaignFilter}
  onChange={(e) =>
    setSmsReportCampaignFilter(e.target.value)
  }
  style={{
    padding: "9px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    minWidth: "160px",
  }}
/>

<input
  type="text"
  placeholder="Phone Number"
  value={smsReportPhoneFilter}
  onChange={(e) =>
    setSmsReportPhoneFilter(e.target.value)
  }
  style={{
    padding: "9px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    minWidth: "180px",
  }}
/>

<select
  value={smsReportStatusFilter}
  onChange={(e) =>
    setSmsReportStatusFilter(e.target.value)
  }
  style={{
    padding: "9px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
  }}
>
  <option value="ALL">All Status</option>
  <option value="QUEUED">Queued</option>
  <option value="PENDING">Pending</option>
  <option value="SENT">Sent</option>
  <option value="DELIVERED">Delivered</option>
  <option value="FAILED">Failed</option>
</select>

                    </div>

                    <div className="messages-table-wrapper">
                      <table className="messages-table campaign-table">
                        <thead>
                          <tr>
                            <th>From info</th>
                            <th>Entity ID(s)</th>
                            <th>Number</th>
                            <th>Message</th>
                            <th>Campaign</th>
                            <th>Credit</th>
                            <th>Response</th>
                          </tr>
                        </thead>
                        <tbody>
                          {smsReports.map((report) => (
                            <tr key={report.id}>
                              <td>
                                <strong>{report.user}</strong>
                                <br />
                                <small>SENDER {report.sender}</small>
                                <br />
                                <small>GATEWAY {report.gateway}</small>
                                <br />
                                <small>{report.createdAt}</small>
                              </td>
                              <td>
                                <small>PE ID {report.peId}</small>
                                <br />
                                <small>TEMPLATE ID {report.templateId}</small>
                                <br />
                                <small>MESSAGE ID {report.messageId}</small>
                              </td>
                              <td>{report.number}</td>
                              <td>
                                <div style={{ maxWidth: "390px", lineHeight: "1.45" }}>
                                  {report.message}
                                </div>
                              </td>

                              <td>{report.campaignName}</td>

                              <td>{report.credit}</td>
                              <td>
                                <span
  className={`status-badge ${
    report.response === "DELIVERED"
      ? "status-delivered"
      : "status-pending"
  }`}
>
  ● {report.response}
</span>

<br />

<small style={{ color: "#64748b" }}>
  Campaign: {report.campaignName}
</small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {reportTab === "logs" && (
  <section className="data-section">

    <div className="data-section-header">
  <div>
    <h2>Logs</h2>
    <p>
      SMS delivery activity from the backend.
    </p>
  </div>
</div>

<div
  style={{
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "16px",
    alignItems: "center",
  }}
>
  <input
    type="text"
    placeholder="Campaign ID"
    value={smsLogCampaignFilter}
    onChange={(e) =>
      setSmsLogCampaignFilter(e.target.value)
    }
    style={{
      padding: "9px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "7px",
      minWidth: "140px",
    }}
  />

   {/* 👇 ADD RECIPIENT ID HERE */}
  <input
    type="text"
    placeholder="Recipient ID"
    value={smsLogRecipientFilter}
    onChange={(e) =>
      setSmsLogRecipientFilter(e.target.value)
    }
    style={{
      padding: "9px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "7px",
      minWidth: "140px",
    }}
  />

  <input
    type="text"
    placeholder="Phone Number"
    value={smsLogPhoneFilter}
    onChange={(e) =>
      setSmsLogPhoneFilter(e.target.value)
    }
    style={{
      padding: "9px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "7px",
      minWidth: "180px",
    }}
  />

  <select
    value={smsLogStatusFilter}
    onChange={(e) =>
      setSmsLogStatusFilter(e.target.value)
    }
    style={{
      padding: "9px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "7px",
    }}
  >
    <option value="ALL">All Status</option>
    <option value="PENDING">Pending</option>
    <option value="SENT">Sent</option>
    <option value="DELIVERED">Delivered</option>
    <option value="FAILED">Failed</option>
  </select>

  <button
    type="button"
    className="view-button"
    onClick={() => {
      setSmsLogCampaignFilter("");
      setSmsLogRecipientFilter("");
      setSmsLogPhoneFilter("");
      setSmsLogStatusFilter("ALL");
    }}
  >
    Clear
  </button>
</div>

    {smsLogsLoading && (
      <div className="messages-empty">
        Loading SMS logs...
      </div>
    )}

    {smsLogsError && (
      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          background: "#fee2e2",
          color: "#991b1b",
          borderRadius: "7px",
        }}
      >
        {smsLogsError}
      </div>
    )}

    {!smsLogsLoading &&
  !smsLogsError &&
  filteredSmsLogs.length === 0 && (
    <div className="messages-empty">
      {smsLogs.length === 0
        ? "No SMS delivery logs available."
        : "No logs match the selected filters."}
    </div>
  )}

    {!smsLogsLoading &&
      filteredSmsLogs.length > 0 && (
        <div className="messages-table-wrapper">

          <table className="messages-table campaign-table">

            <thead>
              <tr>
                <th>Campaign ID</th>
                <th>Recipient ID</th>
                <th>Phone Number</th>
                <th>Provider Message ID</th>
                <th>Status</th>
                <th>Delivered At</th>
                <th>Failure Reason</th>
                <th>Created At</th>
              </tr>
            </thead>

            <tbody>

              {filteredSmsLogs.map((log) => (

                <tr key={log.id}>

                  <td>
                    {log.campaign_id ?? "-"}
                  </td>

                  <td>
                    {log.recipient_id ?? "-"}
                  </td>

                  <td>
                    {log.phone_number ?? "-"}
                  </td>

                  <td>
                    {log.provider_message_id ?? "-"}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        log.status === "DELIVERED"
                          ? "status-delivered"
                          : "status-pending"
                      }`}
                    >
                      ● {log.status || "PENDING"}
                    </span>
                  </td>

                  <td>
                    {log.delivered_at
                      ? new Date(
                          log.delivered_at
                        ).toLocaleString()
                      : "-"}
                  </td>

                  <td>
                    {log.failure_reason || "-"}
                  </td>

                  <td>
                    {log.created_at
                      ? new Date(
                          log.created_at
                        ).toLocaleString()
                      : "-"}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
      )}

  </section>
)}

                {reportTab === "user-report" && (
                  <section className="data-section">
                    <div className="data-section-header">
                      <div>
                        <h2>User Report Download</h2>
                        <p>Download your SMS messaging report as a CSV file.</p>
                      </div>
                      
                       <button
  type="button"
  className="view-button"
  onClick={() => {
    if (!smsReports || smsReports.length === 0) {
      setSmsSendStatus("No SMS reports available to download.");
      return;
    }

    const headers = [
      "User",
      "Sender ID",
      "Gateway",
      "PE ID",
      "Template ID",
      "Message ID",
      "Phone Number",
      "Message",
      "Campaign",
      "Credit",
      "Status",
      "Created At",
    ];

    const escapeCsv = (value) => {
      const text = value === null || value === undefined
        ? ""
        : String(value);

      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = smsReports.map((report) => [
      report.user,
      report.sender,
      report.gateway,
      report.peId,
      report.templateId,
      report.messageId,
      report.number,
      report.message,
      report.campaignName,
      report.credit,
      report.response,
      report.createdAt,
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) =>
        row.map(escapeCsv).join(",")
      ),
    ].join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `sms-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setSmsSendStatus(
      `SMS report downloaded successfully (${smsReports.length} record(s)).`
    );
  }}
>
  ⇩ Download Report
</button>
                    </div>
                  </section>
                )}

                {reportTab === "clicker-report" && (
  <section className="data-section">

    <div className="data-section-header">
      <div>
        <h2>Clicker Report</h2>
        <p>
          Monitor SMS link clicks and tracking activity.
        </p>
      </div>
    </div>

    <div
  style={{
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "16px",
    alignItems: "center",
  }}
>
  {/* Campaign ID */}
  <input
    type="text"
    placeholder="Campaign ID"
    value={smsClickCampaignFilter}
    onChange={(e) =>
      setSmsClickCampaignFilter(e.target.value)
    }
    style={{
      padding: "9px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "7px",
      minWidth: "140px",
    }}
  />

  {/* Recipient ID */}
  <input
    type="text"
    placeholder="Recipient ID"
    value={smsClickRecipientFilter}
    onChange={(e) =>
      setSmsClickRecipientFilter(e.target.value)
    }
    style={{
      padding: "9px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "7px",
      minWidth: "140px",
    }}
  />

  {/* Phone Number */}
  <input
    type="text"
    placeholder="Phone Number"
    value={smsClickPhoneFilter}
    onChange={(e) =>
      setSmsClickPhoneFilter(e.target.value)
    }
    style={{
      padding: "9px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "7px",
      minWidth: "180px",
    }}
  />

  {/* Clear */}
  <button
    type="button"
    className="view-button"
    onClick={() => {
      setSmsClickCampaignFilter("");
      setSmsClickRecipientFilter("");
      setSmsClickPhoneFilter("");
    }}
  >
    Clear
  </button>
</div>

    {smsClicksLoading && (
      <div className="messages-empty">
        Loading click reports...
      </div>
    )}

    {smsClicksError && (
      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          background: "#fee2e2",
          color: "#991b1b",
          borderRadius: "7px",
        }}
      >
        {smsClicksError}
      </div>
    )}

    {!smsClicksLoading &&
  !smsClicksError &&
  filteredSmsClicks.length === 0 && (
    <div className="messages-empty">
      {smsClicks.length === 0
        ? "No click-tracking data available yet."
        : "No click records match the selected filters."}
    </div>
  )}

    {!smsClicksLoading &&
      filteredSmsClicks.length > 0 && (
        <div className="messages-table-wrapper">

          <table className="messages-table campaign-table">

            <thead>
              <tr>
                <th>Campaign ID</th>
                <th>Recipient ID</th>
                <th>Phone Number</th>
                <th>Original URL</th>
                <th>Tracking URL</th>
                <th>Clicked At</th>
                <th>IP Address</th>
              </tr>
            </thead>

            <tbody>

              {filteredSmsClicks.map((click) => (

                <tr key={click.id}>

                  <td>
                    {click.campaign_id ?? "-"}
                  </td>

                  <td>
                    {click.recipient_id ?? "-"}
                  </td>

                  <td>
                    {click.phone_number ?? "-"}
                  </td>

                  <td>
                    {click.original_url || "-"}
                  </td>

                  <td>
                    {click.tracking_url || "-"}
                  </td>

                  <td>
                    {click.clicked_at
                      ? new Date(
                          click.clicked_at
                        ).toLocaleString()
                      : "-"}
                  </td>

                  <td>
                    {click.ip_address || "-"}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
      )}

  </section>
)}

                {smsSendStatus && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "12px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      borderRadius: "7px",
                    }}
                  >
                    {smsSendStatus}
                  </div>
                )}
              </>
            )}
          </>
        ) : currentPage === "dashboard" ? (


          <>

            <div className="dashboard-header">

              <h1>
                Dashboard
              </h1>

              

            </div>


            {/* =================================================
                ERROR MESSAGE
            ================================================= */}

            {error && (

              <div
                style={{
                  margin: "0 30px 20px",
                  padding: "12px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "6px",
                }}
              >

                {error}

              </div>

            )}


            {/* =================================================
                STAT CARDS
            ================================================= */}

            <div className="stats-grid">


              {/* INITIATED */}

              <div className="stat-card">

                <div>

                  <p>
                    Total Initiated
                  </p>

                  <h2>
                    {loading
                      ? "..."
                      : stats.totalInitiated}
                  </h2>

                </div>

                <div className="stat-icon initiated">
                  ▣
                </div>

              </div>


              {/* SENT */}

              <div className="stat-card">

                <div>

                  <p>
                    Total Sent
                  </p>

                  <h2>
                    {loading
                      ? "..."
                      : stats.totalSent}
                  </h2>

                </div>

                <div className="stat-icon sent">
                  ✓
                </div>

              </div>


              {/* DELIVERED */}

              <div className="stat-card">

                <div>

                  <p>
                    Total Delivered
                  </p>

                  <h2>
                    {loading
                      ? "..."
                      : stats.totalDelivered}
                  </h2>

                </div>

                <div className="stat-icon delivered">
                  ✓✓
                </div>

              </div>


              {/* READ */}

              <div className="stat-card">

                <div>

                  <p>
                    Total Read
                  </p>

                  <h2>
                    {loading
                      ? "..."
                      : stats.totalRead}
                  </h2>

                </div>

                <div className="stat-icon read">
                  ✓✓
                </div>

              </div>


              {/* FAILED */}

              <div className="stat-card">

                <div>

                  <p>
                    Total Failed
                  </p>

                  <h2>
                    {loading
                      ? "..."
                      : stats.totalFailed}
                  </h2>

                </div>

                <div className="stat-icon failed">
                  ×
                </div>

              </div>

            </div>


            {/* =================================================
                CHARTS
            ================================================= */}

            <div className="charts-grid">


              {/* =================================================
                  DONUT CHART
              ================================================= */}

              <div className="chart-card">

                <h3>
                  Pie chart
                </h3>

                <div className="donut-wrapper">

                  <div className="donut">

                    <div className="donut-center">

                      <span>
                        Total
                      </span>

                      <strong>
                        {total}
                      </strong>

                    </div>

                  </div>

                </div>


                <div className="legend">

                  <span>
                    <span className="dot sent-dot"></span>
                    Sent: {stats.totalSent}
                  </span>

                  <span>
                    <span className="dot delivered-dot"></span>
                    Delivered: {stats.totalDelivered}
                  </span>

                  <span>
                    <span className="dot read-dot"></span>
                    Read: {stats.totalRead}
                  </span>

                  <span>
                    <span className="dot failed-dot"></span>
                    Failed: {stats.totalFailed}
                  </span>

                </div>

              </div>


              {/* =================================================
                  BAR CHART
              ================================================= */}

              <div className="chart-card">

                <h3>
                  Mixed Line-Bar chart
                </h3>


                <div className="chart-legend">

                  <span>
                    <span className="legend-box initiated-box"></span>
                    Initiated
                  </span>

                  <span>
                    <span className="legend-box sent-box"></span>
                    Sent
                  </span>

                  <span>
                    <span className="legend-box delivered-box"></span>
                    Delivered
                  </span>

                  <span>
                    <span className="legend-box read-box"></span>
                    Read
                  </span>

                  <span>
                    <span className="legend-box failed-box"></span>
                    Failed
                  </span>

                </div>


                <div className="bar-chart">

                  <div className="y-axis">

                    <span>50</span>
                    <span>40</span>
                    <span>30</span>
                    <span>20</span>
                    <span>10</span>
                    <span>0</span>

                  </div>


                  <div className="bars-area">

                    <div className="bar-group">


                      <div
                        className="bar initiated-bar"
                        style={{
                          height: `${getBarHeight(
                            stats.totalInitiated
                          )}%`,
                        }}
                      ></div>


                      <div
                        className="bar sent-bar"
                        style={{
                          height: `${getBarHeight(
                            stats.totalSent
                          )}%`,
                        }}
                      ></div>


                      <div
                        className="bar delivered-bar"
                        style={{
                          height: `${getBarHeight(
                            stats.totalDelivered
                          )}%`,
                        }}
                      ></div>


                      <div
                        className="bar read-bar"
                        style={{
                          height: `${getBarHeight(
                            stats.totalRead
                          )}%`,
                        }}
                      ></div>


                      <div
                        className="bar failed-bar"
                        style={{
                          height: `${getBarHeight(
                            stats.totalFailed
                          )}%`,
                        }}
                      ></div>


                    </div>

                  </div>


                  <div className="x-axis">

                    <span>
                      WhatsApp
                    </span>

                  </div>

                </div>

              </div>

            </div>


            {/* =================================================
                WHATSAPP MESSAGES TABLE
            ================================================= */}

            <section className="messages-section">

              <div className="messages-header">

                <div>

                  <h2>
                    WhatsApp Messages
                  </h2>

                  <p>
                    Recent WhatsApp delivery activity
                  </p>

                </div>

                <div className="message-count">

                  {messages.length} Messages

                </div>

              </div>


              {messagesError && (

                <div className="messages-error">
                  {messagesError}
                </div>

              )}


              {messagesLoading ? (

                <div className="messages-loading">
                  Loading WhatsApp messages...
                </div>

              ) : messages.length === 0 ? (

                <div className="messages-empty">
                  No WhatsApp messages found.
                </div>

              ) : (

                <div className="messages-table-wrapper">

                  <table className="messages-table">

                    <thead>

                      <tr>

                        <th>
                          Recipient
                        </th>

                        <th>
                          Phone Number
                        </th>

                        <th>
                          Provider Message ID
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Created At
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {messages.map((message) => (

                        <tr
                          key={
                            message.delivery_log_id ||
                            message.recipient_id
                          }
                        >

                          <td>

                            <div className="recipient-cell">

                              <div className="recipient-avatar">

                                {message.recipient_name
                                  ? message.recipient_name
                                      .charAt(0)
                                      .toUpperCase()
                                  : "?"}

                              </div>

                              <span>
                                {message.recipient_name || "-"}
                              </span>

                            </div>

                          </td>


                          <td>
                            {message.phone_number}
                          </td>


                          <td>

                            <span className="provider-id">

                              {message.provider_message_id || "-"}

                            </span>

                          </td>


                          <td>

                            <span
                              className={`status-badge ${getStatusClass(
                                message.status
                              )}`}
                            >

                              {message.status}

                            </span>

                          </td>


                          <td>

                            {formatDate(
                              message.created_at
                            )}

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

          </>


        ) : currentPage === "automation" ? (

          <>
            <div className="page-header">
              <div>
                <h1>Automation Flow Builder</h1>
                <p>Build and save automated communication flows.</p>
              </div>
            </div>

            <AutomationFlowBuilder />
          </>

          ) : currentPage === "rcs-broadcast" ? (

  <>
    <RCSBroadcast />
  </>

        ) : currentPage === "rcs-report" ? (

          <>
            <RCSReport
              onCreateCampaign={() => {
                setCurrentPage("rcs-broadcast");
              }}
            />
          </>

        ) : currentPage === "api-docs" ? (
  <ApiDocumentationPage />
) : currentPage === "api-key" ? (
  <ApiKeyPage onNavigate={setCurrentPage} />

) : currentPage === "user-management" ? (
  <UserManagement />
) : currentPage === "address-book" ? (
  <AddressBook />
) : currentPage === "commerce" ? (
  <Commerce />  

) : currentPage === "team-inbox" ? (

          <TeamInbox page="chat-inbox" />

        ) : currentPage === "agent-list" ? (

          <TeamInbox page="agent-list" />

        ) : currentPage === "campaigns" ? (

          <>

            <div className="page-header">

              <div>

                <h1>
                  WhatsApp Campaigns
                </h1>

                <p>
                  Manage and monitor your WhatsApp campaigns.
                </p>

              </div>

              <button
                className="view-button"
                onClick={() => {
                  setShowCreateCampaign(!showCreateCampaign);
                  setCreateCampaignError("");
                  setCreateCampaignSuccess("");
                }}
                style={{
                  padding: "10px 18px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {showCreateCampaign
                  ? "Cancel"
                  : "+ Create Campaign"}
              </button>

            </div>

            {showCreateCampaign && (

              <section
                className="data-section"
                style={{ marginBottom: "20px" }}
              >

                <div className="data-section-header">

                  <div>
                    <h2>
                      Create WhatsApp Campaign
                    </h2>

                    <p>
                      Create a new campaign in DRAFT status.
                    </p>
                  </div>

                </div>

                {createCampaignError && (
                  <div className="messages-error">
                    {createCampaignError}
                  </div>
                )}

                {createCampaignSuccess && (
                  <div
                    style={{
                      margin: "0 0 15px",
                      padding: "12px",
                      background: "#dcfce7",
                      color: "#166534",
                      borderRadius: "6px",
                    }}
                  >
                    {createCampaignSuccess}
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(220px, 1fr) minmax(220px, 1fr) auto",
                    gap: "15px",
                    alignItems: "end",
                  }}
                >

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "7px",
                        fontWeight: "600",
                      }}
                    >
                      Campaign Name
                    </label>

                    <input
                      type="text"
                      value={newCampaignName}
                      onChange={(event) =>
                        setNewCampaignName(event.target.value)
                      }
                      placeholder="Example: August Promotion"
                      style={{
                        width: "100%",
                        padding: "11px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "7px",
                        fontWeight: "600",
                      }}
                    >
                      WhatsApp Template
                    </label>

                    <select
                      value={newCampaignTemplateId}
                      onChange={(event) =>
                        setNewCampaignTemplateId(
                          event.target.value
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "11px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        background: "#fff",
                        boxSizing: "border-box",
                      }}
                    >

                      <option value="">
                        Select Template
                      </option>

                      {templates.map((template) => (
                        <option
                          key={template.id}
                          value={template.id}
                        >
                          {template.template_name} (ID: {template.id})
                        </option>
                      ))}

                    </select>
                  </div>

                  <button
                    className="view-button"
                    onClick={createCampaign}
                    disabled={createCampaignLoading}
                    style={{
                      padding: "11px 18px",
                      cursor: createCampaignLoading
                        ? "not-allowed"
                        : "pointer",
                      opacity: createCampaignLoading ? 0.7 : 1,
                    }}
                  >
                    {createCampaignLoading
                      ? "Creating..."
                      : "Create Campaign"}
                  </button>

                </div>

              </section>

            )}


            <section className="data-section">

              <div className="data-section-header">

                <div>

                  <h2>
                    Campaign List
                  </h2>

                  <p>
                    Campaigns stored in your WhatsApp campaign database.
                  </p>

                </div>

                <div className="message-count">
                  {campaigns.length} Campaigns
                </div>

              </div>


              {campaignsError && (

                <div className="messages-error">
                  {campaignsError}
                </div>

              )}


              {campaignsLoading ? (

                <div className="messages-loading">
                  Loading WhatsApp campaigns...
                </div>

              ) : campaigns.length === 0 ? (

                <div className="messages-empty">
                  No WhatsApp campaigns found.
                </div>

              ) : (

                <div className="messages-table-wrapper">

                  <table className="messages-table campaign-table">

                    <thead>

                      <tr>

                        <th>
                          ID
                        </th>

                        <th>
                          Campaign Name
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Total Recipients
                        </th>

                        <th>
                          Template ID
                        </th>

                        <th>
                          Created At
                        </th>

                        <th>
                          Action
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {campaigns.map((campaign) => (

                        <tr key={campaign.id}>

                          <td>
                            {campaign.id}
                          </td>

                          <td>
                            <strong>
                              {campaign.campaign_name || "-"}
                            </strong>
                          </td>

                          <td>

                            <span
                              className={`status-badge ${getStatusClass(
                                campaign.status
                              )}`}
                            >
                              {campaign.status || "-"}
                            </span>

                          </td>

                          <td>
                            {campaign.total_recipients ?? 0}
                          </td>

                          <td>
                            {campaign.template_id ?? "-"}
                          </td>

                          <td>
                            {formatDate(
                              campaign.created_at
                            )}
                          </td>

                          <td>

                            <button
                              className="view-button"
                              onClick={() =>
                                openCampaignDetails(
                                  campaign.id
                                )
                              }
                            >
                              View
                            </button>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </section>


            {campaignDetailsLoading && (

              <section className="data-section campaign-details-section">

                <div className="messages-loading">
                  Loading campaign details...
                </div>

              </section>

            )}


            {campaignDetailsError && (

              <section className="data-section campaign-details-section">

                <div className="messages-error">
                  {campaignDetailsError}
                </div>

              </section>

            )}


            {selectedCampaign && (

              <section className="data-section campaign-details-section">

                <div className="data-section-header">

                  <div>

                    <h2>
                      {selectedCampaign.campaign?.campaign_name ||
                        "Campaign Details"}
                    </h2>

                    <p>
                      Campaign information and recipients.
                    </p>

                  </div>

                  <span
                    className={`status-badge ${getStatusClass(
                      selectedCampaign.campaign?.status
                    )}`}
                  >
                    {selectedCampaign.campaign?.status || "-"}
                  </span>

                </div>


                <div className="campaign-info-grid">

                  <div className="info-card">

                    <span>
                      Campaign ID
                    </span>

                    <strong>
                      {selectedCampaign.campaign?.id ?? "-"}
                    </strong>

                  </div>


                  <div className="info-card">

                    <span>
                      Total Recipients
                    </span>

                    <strong>
                      {selectedCampaign.total_recipients ?? 0}
                    </strong>

                  </div>


                  <div className="info-card">

                    <span>
                      Template ID
                    </span>

                    <strong>
                      {selectedCampaign.campaign?.template_id ?? "-"}
                    </strong>

                  </div>


                  <div className="info-card">

                    <span>
                      Created At
                    </span>

                    <strong>
                      {formatDate(
                        selectedCampaign.campaign?.created_at
                      )}
                    </strong>

                  </div>

                </div>

                {/* =====================================================
    SEND CAMPAIGN
===================================================== */}

{selectedCampaign.campaign?.status === "DRAFT" && (
  <div
    style={{
      marginTop: "20px",
      padding: "20px",
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      background: "#f8fafc",
    }}
  >

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
      }}
    >

      <div>

        <h2 style={{ margin: "0 0 6px" }}>
          Send Campaign
        </h2>

        <p
          style={{
            margin: 0,
            color: "#64748b",
          }}
        >
          Send this campaign to the added recipients.
        </p>

      </div>

      <button
        className="view-button"
        onClick={sendCampaign}
        disabled={
          sendCampaignLoading ||
          !selectedCampaign.recipients ||
          selectedCampaign.recipients.length === 0
        }
        style={{
          padding: "12px 22px",
          cursor:
            sendCampaignLoading ||
            !selectedCampaign.recipients ||
            selectedCampaign.recipients.length === 0
              ? "not-allowed"
              : "pointer",
          opacity:
            sendCampaignLoading ||
            !selectedCampaign.recipients ||
            selectedCampaign.recipients.length === 0
              ? 0.6
              : 1,
          whiteSpace: "nowrap",
        }}
      >

        {sendCampaignLoading
          ? "Sending..."
          : "Send Campaign"}

      </button>

    </div>

    {sendCampaignSuccess && (
      <div
        style={{
          marginTop: "15px",
          padding: "12px",
          background: "#dcfce7",
          color: "#166534",
          borderRadius: "6px",
        }}
      >
        {sendCampaignSuccess}
      </div>
    )}

    {sendCampaignError && (
      <div
        style={{
          marginTop: "15px",
          padding: "12px",
          background: "#fee2e2",
          color: "#991b1b",
          borderRadius: "6px",
        }}
      >
        {sendCampaignError}
      </div>
    )}

  </div>
)}



                {/* =====================================================
                    ADD NEW RECIPIENT
                ===================================================== */}

                {selectedCampaign.campaign?.status === "DRAFT" && (

                  <div
                    style={{
                      marginTop: "20px",
                      padding: "20px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      background: "#f8fafc",
                    }}
                  >

                    <div style={{ marginBottom: "16px" }}>

                      <h2 style={{ margin: "0 0 6px" }}>
                        Add New Recipient
                      </h2>

                      <p
                        style={{
                          margin: 0,
                          color: "#64748b",
                        }}
                      >
                        Add a new recipient directly to this campaign.
                      </p>

                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(220px, 1fr) minmax(220px, 1fr) auto",
                        gap: "15px",
                        alignItems: "end",
                      }}
                    >

                      <div>

                        <label
                          style={{
                            display: "block",
                            marginBottom: "7px",
                            fontWeight: "600",
                          }}
                        >
                          Recipient Name
                        </label>

                        <input
                          type="text"
                          value={newRecipientName}
                          onChange={(event) => {
                            setNewRecipientName(event.target.value);
                            setNewRecipientError("");
                            setNewRecipientSuccess("");
                          }}
                          placeholder="Enter recipient name"
                          style={{
                            width: "100%",
                            padding: "11px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            boxSizing: "border-box",
                          }}
                        />

                      </div>

                      <div>

                        <label
                          style={{
                            display: "block",
                            marginBottom: "7px",
                            fontWeight: "600",
                          }}
                        >
                          Phone Number
                        </label>

                        <input
                          type="text"
                          value={newRecipientPhone}
                          onChange={(event) => {
                            setNewRecipientPhone(event.target.value);
                            setNewRecipientError("");
                            setNewRecipientSuccess("");
                          }}
                          placeholder="+919876543215"
                          style={{
                            width: "100%",
                            padding: "11px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            boxSizing: "border-box",
                          }}
                        />

                      </div>

                      <button
                        className="view-button"
                        onClick={addNewRecipient}
                        disabled={addingNewRecipient}
                        style={{
                          padding: "11px 18px",
                          cursor: addingNewRecipient
                            ? "not-allowed"
                            : "pointer",
                          opacity: addingNewRecipient ? 0.7 : 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {addingNewRecipient
                          ? "Adding..."
                          : "Add Recipient"}
                      </button>

                    </div>

                    {newRecipientSuccess && (
                      <div
                        style={{
                          marginTop: "15px",
                          padding: "12px",
                          background: "#dcfce7",
                          color: "#166534",
                          borderRadius: "6px",
                        }}
                      >
                        {newRecipientSuccess}
                      </div>
                    )}

                    {newRecipientError && (
                      <div
                        style={{
                          marginTop: "15px",
                          padding: "12px",
                          background: "#fee2e2",
                          color: "#991b1b",
                          borderRadius: "6px",
                        }}
                      >
                        {newRecipientError}
                      </div>
                    )}

                  </div>

                )}


                {/* =====================================================
                    ADD RECIPIENTS TO CAMPAIGN
                ===================================================== */}

<div
  className="data-section"
  style={{
    marginTop: "20px",
    padding: "20px"
  }}
>

  <div className="data-section-header">

    <div>

      <h2>
        Add Recipients
      </h2>

      <p>
        Select recipients to add to this campaign.
      </p>

    </div>

    <div className="message-count">
      {selectedRecipientIds.length} Selected
    </div>

  </div>


  {/* SUCCESS MESSAGE */}

  {addRecipientsSuccess && (

    <div
      style={{
        marginBottom: "15px",
        padding: "12px",
        background: "#dcfce7",
        color: "#166534",
        borderRadius: "6px"
      }}
    >
      {addRecipientsSuccess}
    </div>

  )}


  {/* ERROR MESSAGE */}

  {addRecipientsError && (

    <div
      style={{
        marginBottom: "15px",
        padding: "12px",
        background: "#fee2e2",
        color: "#991b1b",
        borderRadius: "6px"
      }}
    >
      {addRecipientsError}
    </div>

  )}


  <div className="messages-table-wrapper">

    <table className="messages-table">

      <thead>

        <tr>

          <th>
            Select
          </th>

          <th>
            Recipient
          </th>

          <th>
            Phone Number
          </th>

          <th>
            Status
          </th>

        </tr>

      </thead>


      <tbody>

        {recipients.map((recipient) => {

          const alreadyAdded =
            (selectedCampaign.recipients || [])
              .some(
                (existingRecipient) =>
                  existingRecipient.phone_number ===
                  recipient.phone_number
              );

          return (

            <tr key={recipient.id}>

              <td>

                <input
                  type="checkbox"
                  checked={
                    selectedRecipientIds.includes(
                      recipient.id
                    )
                  }
                  disabled={alreadyAdded}
                  onChange={(event) => {

                    if (event.target.checked) {

                      setSelectedRecipientIds(
                        (previous) => [
                          ...previous,
                          recipient.id
                        ]
                      );

                    } else {

                      setSelectedRecipientIds(
                        (previous) =>
                          previous.filter(
                            (id) =>
                              id !== recipient.id
                          )
                      );

                    }

                  }}
                />

              </td>


              <td>

                <div className="recipient-cell">

                  <div className="recipient-avatar">

                    {recipient.recipient_name
                      ? recipient.recipient_name
                          .charAt(0)
                          .toUpperCase()
                      : "?"}

                  </div>

                  <strong>
                    {recipient.recipient_name || "-"}
                  </strong>

                </div>

              </td>


              <td>
                {recipient.phone_number || "-"}
              </td>


              <td>

                {alreadyAdded ? (

                  <span className="status-badge status-delivered">
                    ALREADY ADDED
                  </span>

                ) : (

                  <span className="status-badge status-pending">
                    AVAILABLE
                  </span>

                )}

              </td>

            </tr>

          );

        })}

      </tbody>

    </table>

  </div>


  <div
    style={{
      marginTop: "20px",
      display: "flex",
      justifyContent: "flex-end"
    }}
  >

    <button
      className="view-button"
      onClick={addRecipientsToCampaign}
      disabled={
        addingRecipients ||
        selectedRecipientIds.length === 0
      }
      style={{
        padding: "10px 20px",
        cursor:
          addingRecipients ||
          selectedRecipientIds.length === 0
            ? "not-allowed"
            : "pointer",
        opacity:
          addingRecipients ||
          selectedRecipientIds.length === 0
            ? 0.6
            : 1
      }}
    >

      {addingRecipients
        ? "Adding..."
        : "Add Selected Recipients"}

    </button>

  </div>

</div>


                <div className="messages-table-wrapper">

                  <table className="messages-table">

                    <thead>

                      <tr>

                        <th>
                          Recipient
                        </th>

                        <th>
                          Phone Number
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Created At
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {(selectedCampaign.recipients || [])
                        .map((recipient) => (

                          <tr key={recipient.id}>

                            <td>
                              {recipient.recipient_name || "-"}
                            </td>

                            <td>
                              {recipient.phone_number || "-"}
                            </td>

                            <td>

                              <span
                                className={`status-badge ${getStatusClass(
                                  recipient.status
                                )}`}
                              >
                                {recipient.status || "-"}
                              </span>

                            </td>

                            <td>
                              {formatDate(
                                recipient.created_at
                              )}
                            </td>

                          </tr>

                        ))}

                    </tbody>

                  </table>

                </div>

              </section>

            )}

          </>


) : currentPage === "rcs-utility" ? (
  <>
    <div className="page-header">
      <div>
        <h1>RCS Utility Manager</h1>
        <p>Manage RCS sender IDs and utility settings.</p>
      </div>

      <button
        type="button"
        className="view-button"
        onClick={() => {
  setEditingRcsSenderId(null);
  setShowAddRcsSenderForm(true);
  setNewRcsBrandName("");
  setNewRcsBotId("");
  setNewRcsStatus("APPROVED");
  setRcsSendStatus("");
}}
      >
        + Add RCS Sender
      </button>
    </div>

    {rcsSendStatus && (
      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          background: "#eff6ff",
          color: "#1d4ed8",
          borderRadius: "7px",
        }}
      >
        {rcsSendStatus}
      </div>
    )}

    <div
      style={{
        display: "flex",
        gap: "10px",
        marginBottom: "16px",
      }}
    >
      <button
        type="button"
        onClick={() => setRcsUtilityTab("sender-ids")}
        style={{
          padding: "11px 18px",
          borderRadius: "7px",
          border: "1px solid #dbe3ef",
          background:
            rcsUtilityTab === "sender-ids" ? "#0f6fdc" : "#fff",
          color:
            rcsUtilityTab === "sender-ids" ? "#fff" : "#334155",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        Sender IDs
      </button>
    
     {/* ADD THIS */}
  <button
    type="button"
    onClick={() => setRcsUtilityTab("templates")}
    style={{
      padding: "11px 18px",
      borderRadius: "7px",
      border: "1px solid #dbe3ef",
      background:
        rcsUtilityTab === "templates"
          ? "#0f6fdc"
          : "#fff",
      color:
        rcsUtilityTab === "templates"
          ? "#fff"
          : "#334155",
      cursor: "pointer",
      fontWeight: "600",
    }}
  >
    Templates
  </button>
</div>

    {rcsUtilityTab === "sender-ids" && (
      <section className="data-section">

        {showAddRcsSenderForm && (
          <div
            style={{
              marginBottom: "20px",
              padding: "18px",
              border: "1px solid #dbe3ef",
              borderRadius: "8px",
              background: "#f8fafc",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Add RCS Sender ID
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(180px, 1fr))",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    marginBottom: "7px",
                  }}
                >
                  Brand Name
                </label>

                <input
                  type="text"
                  value={newRcsBrandName}
                  onChange={(e) =>
                    setNewRcsBrandName(e.target.value)
                  }
                  placeholder="Example: My Brand"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "7px",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    marginBottom: "7px",
                  }}
                >
                  Bot ID
                </label>

                <input
                  type="text"
                  value={newRcsBotId}
                  onChange={(e) =>
                    setNewRcsBotId(e.target.value)
                  }
                  placeholder="Example: BOT123"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "7px",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    marginBottom: "7px",
                  }}
                >
                  Status
                </label>

                <select
                  value={newRcsStatus}
                  onChange={(e) =>
                    setNewRcsStatus(e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "7px",
                    background: "#fff",
                  }}
                >
                  <option value="APPROVED">
                    APPROVED
                  </option>
                  <option value="PENDING">
                    PENDING
                  </option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                type="button"
                className="view-button"
              onClick={async () => {

  const brandName =
    newRcsBrandName.trim();

  const botId =
    newRcsBotId.trim();

  if (!brandName) {
    setRcsSendStatus(
      "Please enter a Brand Name."
    );
    return;
  }

  if (!botId) {
    setRcsSendStatus(
      "Please enter a Bot ID."
    );
    return;
  }

  const isEditing =
    editingRcsSenderId !== null;

  setRcsSendStatus(
    isEditing
      ? "Updating RCS Sender ID..."
      : "Adding RCS Sender ID..."
  );

  try {

    const url = isEditing
      ? `http://localhost:5000/api/rcs/sender-ids/${editingRcsSenderId}`
      : "http://localhost:5000/api/rcs/sender-ids";

    const method =
      isEditing ? "PUT" : "POST";

    const response = await fetch(
      url,
      {
        method: method,

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          user_id: 1,
          brand_name: brandName,
          bot_id: botId,
          status: newRcsStatus,
        }),
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        (
          isEditing
            ? "Failed to update RCS Sender ID"
            : "Failed to add RCS Sender ID"
        )
      );
    }

    setRcsSendStatus(
      isEditing
        ? "RCS Sender ID updated successfully."
        : "RCS Sender ID added successfully."
    );

    setShowAddRcsSenderForm(false);

    setEditingRcsSenderId(null);

    setNewRcsBrandName("");
    setNewRcsBotId("");
    setNewRcsStatus("APPROVED");

    // Reload RCS Sender IDs
    const senderResponse = await fetch(
      "http://localhost:5000/api/rcs/sender-ids"
    );

    const senderData =
      await senderResponse.json();

    const formattedRcsSenders =
      Array.isArray(senderData)
        ? senderData.map((sender) => ({
            id: sender.id,

            user:
              sender.user_id === 1
                ? "demo"
                : `User ${sender.user_id}`,

            brandName:
              sender.brand_name,

            botId:
              sender.bot_id,

            status:
              sender.status,

            createdAt:
              sender.created_at
                ? new Date(
                    sender.created_at
                  ).toLocaleString()
                : "-",
          }))
        : [];

    setRcsSenderIds(
      formattedRcsSenders
    );

  } catch (error) {

    console.error(
      "RCS Sender save/update error:",
      error
    );

    setRcsSendStatus(
      error.message ||
      "Unable to save RCS Sender ID."
    );

  }

}}
              >
                Save Sender
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddRcsSenderForm(false);
                  setEditingRcsSenderId(null);
                  setRcsSendStatus("");
                }}
                style={{
                  padding: "10px 18px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "7px",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {rcsLoading ? (
          <div className="messages-loading">
            Loading RCS Sender IDs...
          </div>
        ) : rcsSenderIds.length === 0 ? (
          <div className="messages-empty">
            No RCS Sender IDs found.
          </div>
        ) : (
          <div className="messages-table-wrapper">
            <table className="messages-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Brand Name</th>
                  <th>Bot ID</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rcsSenderIds.map((sender) => (
                  <tr key={sender.id}>
                    <td>{sender.id}</td>
                    <td>{sender.user || "-"}</td>
                    <td>{sender.brandName || "-"}</td>
                    <td>{sender.botId || "-"}</td>
                    <td>
                      <span
                        className={`status-badge ${getStatusClass(
                          sender.status
                        )}`}
                      >
                        {sender.status || "-"}
                      </span>
                    </td>
                    <td>
  {sender.createdAt || "-"}
</td>

<td>
  <button
    type="button"
    onClick={() => {
      setNewRcsBrandName(sender.brandName || "");
      setNewRcsBotId(sender.botId || "");
      setNewRcsStatus(sender.status || "APPROVED");

      setRcsSendStatus("");
      setShowAddRcsSenderForm(true);
      setEditingRcsSenderId(sender.id);
    }}
    style={{
      marginRight: "6px",
      border: "1px solid #cbd5e1",
      background: "#fff",
      borderRadius: "5px",
      padding: "6px 9px",
      cursor: "pointer",
    }}
  >
    ✎
  </button>

  <button
    type="button"
    onClick={async () => {
      const confirmed = window.confirm(
        `Delete RCS Sender "${sender.brandName}"?`
      );

      if (!confirmed) {
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/rcs/sender-ids/${sender.id}`,
          {
            method: "DELETE",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to delete RCS Sender ID"
          );
        }

        setRcsSenderIds((items) =>
          items.filter(
            (item) => item.id !== sender.id
          )
        );

        setRcsSendStatus(
          "RCS Sender ID deleted successfully."
        );
      } catch (error) {
        console.error(
          "RCS Sender delete error:",
          error
        );

        setRcsSendStatus(
          error.message ||
          "Unable to delete RCS Sender ID."
        );
      }
    }}
    style={{
      border: "1px solid #fecaca",
      background: "#fff",
      color: "#dc2626",
      borderRadius: "5px",
      padding: "6px 9px",
      cursor: "pointer",
    }}
  >
    🗑
  </button>
</td>
</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    )}
              {rcsUtilityTab === "templates" && (
  <section className="data-section">

    {!showAddRcsTemplateForm ? (
      <>
        {/* ================================
            TEMPLATE LIST
        ================================= */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>
              RCS Template List
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
              }}
            >
              Manage RCS templates available for campaigns.
            </p>
          </div>

          <button
            type="button"
            className="view-button"
            onClick={() => {
              setEditingRcsTemplateId(null);
              setRcsTemplateBotId("");
              setRcsTemplateMessageType("TRANSACTIONAL");
              setRcsTemplateName("");
              setRcsTemplateType("SHORT_TEXT");
              setRcsTemplateText("");
              setRcsTemplateUrl("");
              setShowAddRcsTemplateForm(true);
            }}
          >
            + Add Template
          </button>
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "18px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <select
            value={rcsTemplatePageSize}
            onChange={(e) =>
              setRcsTemplatePageSize(
                Number(e.target.value)
              )
            }
            style={{
              padding: "9px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "7px",
              background: "#fff",
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <input
            type="text"
            placeholder="Template Search..."
            value={rcsTemplateSearch}
            onChange={(e) =>
              setRcsTemplateSearch(e.target.value)
            }
            style={{
              width: "280px",
              maxWidth: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "7px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {rcsTemplates.length === 0 ? (
          <div
            className="messages-empty"
            style={{
              padding: "45px 20px",
              textAlign: "center",
            }}
          >
            No RCS templates found.
          </div>
        ) : (
          <div className="messages-table-wrapper">
            <table className="messages-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Template Name</th>
                  <th>Bot ID</th>
                  <th>Template Type</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rcsTemplates
                  .filter((template) =>
                    String(
                      template.templateName || ""
                    )
                      .toLowerCase()
                      .includes(
                        rcsTemplateSearch
                          .trim()
                          .toLowerCase()
                      )
                  )
                  .slice(0, rcsTemplatePageSize)
                  .map((template) => (
                    <tr key={template.id}>
                      <td>
                        👤 {template.user || "demo"}
                      </td>

                      <td>
                        <strong>
                          {template.templateName || "-"}
                        </strong>
                      </td>

                      <td>
                        {template.botId || "-"}
                      </td>

                      <td>
                        {template.templateType || "-"}
                      </td>

                      <td>
                        <span className="status-badge status-delivered">
                          ● {template.status || "APPROVED"}
                        </span>
                      </td>

                      <td>
                        {template.createdAt || "-"}
                      </td>

                      <td>
                        <button
                          type="button"
                          title="Edit template"
                          onClick={() => {
                            setEditingRcsTemplateId(template.id);
                            setRcsTemplateBotId(template.botId || "");
                            setRcsTemplateMessageType(
                              template.messageType || "TRANSACTIONAL"
                            );
                            setRcsTemplateName(template.templateName || "");
                            setRcsTemplateType(template.templateType || "SHORT_TEXT");
                            setShowAddRcsTemplateForm(true);
                          }}
                          style={{
                            marginRight: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#fff",
                            borderRadius: "5px",
                            padding: "6px 9px",
                            cursor: "pointer",
                          }}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          title="Delete template"
                          onClick={async () => {
                            const confirmed = window.confirm(
                              `Delete RCS template "${template.templateName || "this template"}"?`
                            );

                            if (!confirmed) {
                              return;
                            }

                            try {
                              const response = await fetch(
                                `http://localhost:5000/api/rcs/templates/${template.id}`,
                                { method: "DELETE" }
                              );

                              const data = await response.json().catch(() => ({}));

                              if (!response.ok) {
                                throw new Error(
                                  data.error || "Failed to delete RCS template"
                                );
                              }

                              setRcsTemplates((previous) =>
                                previous.filter((item) => item.id !== template.id)
                              );

                              if (editingRcsTemplateId === template.id) {
                                setEditingRcsTemplateId(null);
                                setShowAddRcsTemplateForm(false);
                              }

                              alert("RCS template deleted successfully.");
                            } catch (error) {
                              console.error("RCS template delete error:", error);
                              alert(
                                error.message ||
                                  "Unable to delete RCS template."
                              );
                            }
                          }}
                          style={{
                            border: "1px solid #fecaca",
                            background: "#fff",
                            color: "#dc2626",
                            borderRadius: "5px",
                            padding: "6px 9px",
                            cursor: "pointer",
                          }}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    ) : (

      /* =====================================
         ADD RCS TEMPLATE
      ====================================== */

      <div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            gap: "15px",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>
              {editingRcsTemplateId ? "Edit RCS Template" : "Add RCS Template"}
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
              }}
            >
              {editingRcsTemplateId
                ? "Update the selected RCS message template."
                : "Create a new RCS message template."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowAddRcsTemplateForm(false);
              setEditingRcsTemplateId(null);
            }}
            style={{
              padding: "9px 16px",
              border: "1px solid #cbd5e1",
              borderRadius: "7px",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        </div>

        {/* Form */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "22px",
          }}
        >

          {/* Bot ID */}
          <div style={{ marginBottom: "22px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              Bot ID
            </label>

            <select
              value={rcsTemplateBotId}
              onChange={(e) =>
                setRcsTemplateBotId(e.target.value)
              }
              style={{
                width: "100%",
                padding: "11px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "7px",
                background: "#fff",
              }}
            >
              <option value="">
                Select Bot ID
              </option>

              {rcsSenderIds.map((sender) => (
                <option
                  key={sender.id}
                  value={sender.botId}
                >
                  {sender.botId} — {sender.brandName}
                </option>
              ))}
            </select>
          </div>

          {/* Message Type */}
          <div style={{ marginBottom: "22px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "10px",
              }}
            >
              Bot Message Type
            </label>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >

              {[
                ["TRANSACTIONAL", "Transactional"],
                ["PROMOTIONAL", "Promotional"],
                ["OTP", "OTP"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setRcsTemplateMessageType(value)
                  }
                  style={{
                    padding: "11px 25px",
                    borderRadius: "20px",
                    border:
                      "1px solid #dbe3ef",
                    background:
                      rcsTemplateMessageType === value
                        ? "#536ee6"
                        : "#eef2ff",
                    color:
                      rcsTemplateMessageType === value
                        ? "#fff"
                        : "#536ee6",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  {label}
                </button>
              ))}

            </div>

            <p
              style={{
                margin: "8px 0 0",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              Displays the message type assigned
              to the selected Bot ID.
            </p>
          </div>

          {/* Template Name */}
          <div style={{ marginBottom: "22px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              Template Name/Code
            </label>

            <input
              type="text"
              value={rcsTemplateName}
              onChange={(e) =>
                setRcsTemplateName(
                  e.target.value.slice(0, 30)
                )
              }
              placeholder="Enter Template Name"
              style={{
                width: "100%",
                padding: "11px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "7px",
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                textAlign: "right",
                marginTop: "5px",
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              Chars: {rcsTemplateName.length}/30
            </div>
          </div>

          {/* Template Type */}
          <div style={{ marginBottom: "22px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              Template Type
            </label>

            <select
              value={rcsTemplateType}
              onChange={(e) =>
                setRcsTemplateType(e.target.value)
              }
              style={{
                width: "100%",
                padding: "11px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "7px",
                background: "#fff",
              }}
            >
              <option value="SHORT_TEXT">
                Short Text
              </option>

              <option value="RICH_MESSAGE">
                Rich Message
              </option>

              <option value="TEXT_TEMPLATE">
                Text Template
              </option>

              <option value="STANDALONE_TEMPLATE">
                Standalone Template
              </option>

              <option value="CAROUSEL_TEMPLATE">
                Carousel Template
              </option>
            </select>
          </div>

          <RcsTemplateEditor
            key={editingRcsTemplateId || "new-rcs-template"}
            templateType={rcsTemplateType}
            initialContent={
              editingRcsTemplateId
                ? rcsTemplates.find(
                    (template) => template.id === editingRcsTemplateId
                  )?.content || null
                : null
            }
            onCancel={() => {
              setShowAddRcsTemplateForm(false);
              setEditingRcsTemplateId(null);
            }}
            onSave={async (content) => {
              if (!rcsTemplateBotId) {
                alert("Please select a Bot ID.");
                return;
              }

              if (!rcsTemplateName.trim()) {
                alert("Please enter Template Name/Code.");
                return;
              }

              const selectedBot = rcsSenderIds.find(
                (sender) => String(sender.botId) === String(rcsTemplateBotId)
              );

              const isEditing = editingRcsTemplateId !== null;

              try {
                const url = isEditing
                  ? `http://localhost:5000/api/rcs/templates/${editingRcsTemplateId}`
                  : "http://localhost:5000/api/rcs/templates";

                const response = await fetch(url, {
                  method: isEditing ? "PUT" : "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    user_id: 1,
                    bot_id: rcsTemplateBotId,
                    bot_message_type: rcsTemplateMessageType,
                    template_name: rcsTemplateName.trim(),
                    template_type: rcsTemplateType,
                    status: isEditing
                      ? rcsTemplates.find(
                          (template) => template.id === editingRcsTemplateId
                        )?.status || "PENDING"
                      : "PENDING",
                    content,
                    brand_name: selectedBot?.brandName || "-",
                  }),
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                  throw new Error(
                    data.error ||
                      (isEditing
                        ? "Failed to update RCS template"
                        : "Failed to save RCS template")
                  );
                }

                // Reload from MySQL after every save/update. This makes the
                // database the source of truth instead of React state.
                await loadRcsTemplates();

                setShowAddRcsTemplateForm(false);
                setEditingRcsTemplateId(null);

                alert(
                  isEditing
                    ? "RCS template updated successfully."
                    : "RCS template saved successfully."
                );
              } catch (error) {
                console.error("RCS template save/update error:", error);
                alert(
                  error.message ||
                    "Unable to save/update RCS template."
                );
              }
            }}
          />

        </div>
      </div>
    )}
  </section>
)}

  </>


        ) : currentPage === "delivery" ? (

          <>

            <div className="page-header">

              <div>

                <h1>
                  WhatsApp Delivery Logs
                </h1>

                <p>
                  Track the delivery status of your WhatsApp messages.
                </p>

              </div>

            </div>


            <section className="data-section">

              <div className="data-section-header">

                <div>

                  <h2>
                    Delivery Activity
                  </h2>

                  <p>
                    Live records from the WhatsApp delivery logs.
                  </p>

                </div>

                <div className="message-count">
                  {messages.length} Logs
                </div>

              </div>


              {messagesError ? (

                <div className="messages-error">
                  {messagesError}
                </div>

              ) : messagesLoading ? (

                <div className="messages-loading">
                  Loading delivery logs...
                </div>

              ) : (

                <div className="messages-table-wrapper">

                  <table className="messages-table">

                    <thead>

                      <tr>

                        <th>
                          Recipient
                        </th>

                        <th>
                          Phone Number
                        </th>

                        <th>
                          Provider Message ID
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Delivered At
                        </th>

                        <th>
                          Failure Reason
                        </th>

                        <th>
                          Created At
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {[...messages]
                        .sort((a, b) => {
                          const aId = Number(a.delivery_log_id);
                          const bId = Number(b.delivery_log_id);

                          if (!Number.isNaN(aId) && !Number.isNaN(bId)) {
                            return aId - bId;
                          }

                          return String(a.provider_message_id || "").localeCompare(
                            String(b.provider_message_id || ""),
                            undefined,
                            { numeric: true }
                          );
                        })
                        .map((message) => (

                        <tr
                          key={
                            message.delivery_log_id ||
                            message.recipient_id
                          }
                        >

                          <td>
                            {message.recipient_name || "-"}
                          </td>

                          <td>
                            {message.phone_number || "-"}
                          </td>

                          <td>

                            <span className="provider-id">
                              {message.provider_message_id || "-"}
                            </span>

                          </td>

                          <td>

                            <span
                              className={`status-badge ${getStatusClass(
                                message.status
                              )}`}
                            >
                              {message.status || "-"}
                            </span>

                          </td>

                          <td>
                            {formatDate(
                              message.delivered_at
                            )}
                          </td>

                          <td>
                            {message.failure_reason || "-"}
                          </td>

                          <td>
                            {formatDate(
                              message.created_at
                            )}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

          </>


         ) : currentPage === "templates" ? (

          <>

            <div className="page-header">

              <div>
                <h1>WhatsApp Templates</h1>

                <p>
                  Create and manage WhatsApp message templates used by campaigns.
                </p>
              </div>

              <button
                type="button"
                className="view-button"
                onClick={() => {
                  setAddWhatsAppTemplateError("");
                  setAddWhatsAppTemplateSuccess("");
                  setShowAddWhatsAppTemplate((value) => !value);
                }}
                disabled={addWhatsAppTemplateLoading}
                style={{
                  padding: "11px 18px",
                  borderRadius: "7px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                {showAddWhatsAppTemplate ? "× Close" : "+ Add Template"}
              </button>

            </div>

            {showAddWhatsAppTemplate && (

              <section
                className="data-section"
                style={{
                  marginBottom: "20px",
                  border: "1px solid #dbe4f0",
                }}
              >

                <div className="data-section-header">
                  <div>
                    <h2>Create WhatsApp Template</h2>
                    <p>
                      Select the WhatsApp number that owns this template.
                    </p>
                  </div>
                </div>

                {addWhatsAppTemplateError && (
                  <div className="messages-error">
                    {addWhatsAppTemplateError}
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: "16px",
                  }}
                >

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "7px",
                        fontWeight: "600",
                      }}
                    >
                      WhatsApp Number
                    </label>

                    <select
                      value={selectedWhatsAppNumberId}
                      onChange={(event) =>
                        setSelectedWhatsAppNumberId(event.target.value)
                      }
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "7px",
                        background: "#fff",
                      }}
                    >
                      <option value="">
                        Select WhatsApp Number
                      </option>

                      {whatsappNumbers.map((number) => (
                        <option key={number.id} value={number.id}>
                          {number.phone_number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "7px",
                        fontWeight: "600",
                      }}
                    >
                      Template Name
                    </label>

                    <input
                      type="text"
                      value={newWhatsAppTemplateName}
                      onChange={(event) =>
                        setNewWhatsAppTemplateName(event.target.value)
                      }
                      placeholder="Example: Diwali Offer 2026"
                      maxLength={100}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "7px",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "7px",
                        fontWeight: "600",
                      }}
                    >
                      Category
                    </label>

                    <select
                      value={newWhatsAppTemplateCategory}
                      onChange={(event) =>
                        setNewWhatsAppTemplateCategory(event.target.value)
                      }
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "7px",
                        background: "#fff",
                      }}
                    >
                      <option value="MARKETING">MARKETING</option>
                      <option value="UTILITY">UTILITY</option>
                      <option value="AUTHENTICATION">AUTHENTICATION</option>
                    </select>
                  </div>

                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginTop: "16px",
                  }}
                >

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "7px",
                        fontWeight: "600",
                      }}
                    >
                      Type
                    </label>

                    <select
                      value={newWhatsAppTemplateType}
                      onChange={(event) =>
                        setNewWhatsAppTemplateType(event.target.value)
                      }
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "7px",
                        background: "#fff",
                      }}
                    >
                      <option value="CUSTOM">CUSTOM</option>
                      <option value="OTP">OTP</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "7px",
                        fontWeight: "600",
                      }}
                    >
                      Status
                    </label>

                    <select
                      value={newWhatsAppTemplateStatus}
                      onChange={(event) =>
                        setNewWhatsAppTemplateStatus(event.target.value)
                      }
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "7px",
                        background: "#fff",
                      }}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>

                </div>

                <div style={{ marginTop: "16px" }}>

                  <label
                    style={{
                      display: "block",
                      marginBottom: "7px",
                      fontWeight: "600",
                    }}
                  >
                    Template Content
                  </label>

                  <textarea
                    value={newWhatsAppTemplateContent}
                    onChange={(event) =>
                      setNewWhatsAppTemplateContent(event.target.value)
                    }
                    rows={5}
                    maxLength={4096}
                    placeholder="Hello {{1}}, get 20% off on your next order. Use code {{2}}."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "11px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "7px",
                      resize: "vertical",
                      lineHeight: "1.5",
                    }}
                  />

                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "18px",
                  }}
                >

                  <button
                    type="button"
                    onClick={() => {
                      resetWhatsAppTemplateForm();
                      setShowAddWhatsAppTemplate(false);
                    }}
                    disabled={addWhatsAppTemplateLoading}
                    style={{
                      padding: "10px 18px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "7px",
                      background: "#fff",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="view-button"
                    onClick={addWhatsAppTemplate}
                    disabled={addWhatsAppTemplateLoading}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "7px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    {addWhatsAppTemplateLoading
                      ? "Saving..."
                      : "Save Template"}
                  </button>

                </div>

              </section>
            )}

            {addWhatsAppTemplateSuccess && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "11px 14px",
                  borderRadius: "7px",
                  border: "1px solid #bbf7d0",
                  background: "#f0fdf4",
                  color: "#166534",
                  fontWeight: "600",
                }}
              >
                {addWhatsAppTemplateSuccess}
              </div>
            )}

            <section className="data-section">

              <div className="data-section-header">

                <div>
                  <h2>Template List</h2>

                  <p>
                    Templates loaded directly from the WhatsApp templates database.
                  </p>
                </div>

                <div className="message-count">
                  {templates.length} Templates
                </div>

              </div>

              {templatesError && (
                <div className="messages-error">
                  {templatesError}
                </div>
              )}

              {templatesLoading ? (

                <div className="messages-loading">
                  Loading WhatsApp templates...
                </div>

              ) : templates.length === 0 ? (

                <div className="messages-empty">
                  No WhatsApp templates found.
                </div>

              ) : (

                <div className="messages-table-wrapper">

                  <table className="messages-table campaign-table">

                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Template Name</th>
                        <th>WhatsApp Number</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Template Content</th>
                        <th>Created At</th>
                      </tr>
                    </thead>

                    <tbody>

                      {templates.map((template) => {

                        const number = whatsappNumbers.find(
                          (item) =>
                            Number(item.id) ===
                            Number(template.whatsapp_number_id)
                        );

                        return (
                          <tr key={template.id}>

                            <td>{template.id}</td>

                            <td>
                              <strong>
                                {template.template_name || "-"}
                              </strong>
                            </td>

                            <td>
                              {number?.phone_number ||
                                template.whatsapp_number_id ||
                                "-"}
                            </td>

                            <td>{template.category || "-"}</td>

                            <td>{template.template_type || "-"}</td>

                            <td>
                              <span
                                className={`status-badge ${getStatusClass(
                                  template.status
                                )}`}
                              >
                                {template.status || "-"}
                              </span>
                            </td>

                            <td>
                              <div className="template-content-cell">
                                {template.template_content || "-"}
                              </div>
                            </td>

                            <td>
                              {formatDate(template.created_at)}
                            </td>

                          </tr>
                        );
                      })}

                    </tbody>

                  </table>

                </div>
              )}

            </section>

          </>

) : currentPage === "recipients" ? (

          <>

            <div className="page-header">

              <div>

                <h1>
                  WhatsApp Recipients
                </h1>

                <p>
                  Manage and monitor WhatsApp campaign recipients.
                </p>

              </div>

            </div>


            <section className="data-section">

              <div className="data-section-header">

                <div>

                  <h2>
                    Recipient List
                  </h2>

                  <p>
                    Recipients loaded directly from the WhatsApp recipients database.
                  </p>

                </div>

                <div className="message-count">
                  {recipients.length} Recipients
                </div>

              </div>


              {recipientsError && (

                <div className="messages-error">
                  {recipientsError}
                </div>

              )}


              {recipientsLoading ? (

                <div className="messages-loading">
                  Loading WhatsApp recipients...
                </div>

              ) : recipients.length === 0 ? (

                <div className="messages-empty">
                  No WhatsApp recipients found.
                </div>

              ) : (

                <div className="messages-table-wrapper">

                  <table className="messages-table campaign-table">

                    <thead>

                      <tr>

                        <th>
                          ID
                        </th>

                        <th>
                          Recipient
                        </th>

                        <th>
                          Phone Number
                        </th>

                        <th>
                          Campaign
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Created At
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {recipients.map((recipient) => (

                        <tr key={recipient.id}>

                          <td>
                            {recipient.id}
                          </td>


                          <td>

                            <div className="recipient-cell">

                              <div className="recipient-avatar">

                                {recipient.recipient_name
                                  ? recipient.recipient_name
                                      .charAt(0)
                                      .toUpperCase()
                                  : "?"}

                              </div>

                              <strong>
                                {recipient.recipient_name || "-"}
                              </strong>

                            </div>

                          </td>


                          <td>
                            {recipient.phone_number || "-"}
                          </td>


                          <td>
                            {recipient.campaign_name || "-"}
                          </td>


                          <td>

                            <span
                              className={`status-badge ${getStatusClass(
                                recipient.status
                              )}`}
                            >
                              {recipient.status || "-"}
                            </span>

                          </td>


                          <td>
                            {formatDate(
                              recipient.created_at
                            )}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

          </>


        ) : (

          <>

            <div className="page-header">

              <div>

                <h1>
                  WhatsApp Recipients
                </h1>

                <p>
                  Manage WhatsApp campaign recipients.
                </p>

              </div>

            </div>


            <section className="data-section">

              <div className="messages-empty">
                Recipients module is ready for the next backend connection.
              </div>

            </section>

          </>

        )}


      </main>

    </div>

  );

}

export default App;

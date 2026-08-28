import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = "https://cpaas-dashboard-production.up.railway.app/api/rcs/broadcasts";

export default function RCSBroadcast() {
  const [senders, setSenders] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] =
    useState([]);
  const [showContacts, setShowContacts] =
    useState(false);
  const [loadingContacts, setLoadingContacts] =
  useState(false);

  const [numbersText, setNumbersText] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [selectedSender, setSelectedSender] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [gateway, setGateway] = useState("RCS");

  const [excludeBlocked, setExcludeBlocked] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  const fileInputRef = useRef(null);

  // ---------------------------------------------------------
// SELECT / UNSELECT CONTACT
// ---------------------------------------------------------

const toggleContactSelection = (contact) => {
  setSelectedContacts((previous) => {
    const exists = previous.some(
      (item) =>
        String(item.id) ===
        String(contact.id)
    );

    if (exists) {
      return previous.filter(
        (item) =>
          String(item.id) !==
          String(contact.id)
      );
    }

    return [
      ...previous,
      contact,
    ];
  });
};

// ---------------------------------------------------------
// SELECT ALL CONTACTS
// ---------------------------------------------------------

const toggleSelectAllContacts = () => {
  if (
    selectedContacts.length ===
    contacts.length
  ) {
    setSelectedContacts([]);
    return;
  }

  setSelectedContacts([...contacts]);
};

// ---------------------------------------------------------
// ADD SELECTED CONTACTS
// ---------------------------------------------------------

const handleAddSelectedContacts = () => {
  if (selectedContacts.length === 0) {
    setError(
      "Please select at least one contact."
    );
    return;
  }

  const selectedNumbers =
    selectedContacts
      .map(
        (contact) =>
          contact.phone_number
      )
      .filter(Boolean);

  setNumbersText((previous) => {
    const existingNumbers = previous
      .split(/[\n,\s]+/)
      .map((number) =>
        number.trim()
      )
      .filter(Boolean);

    const combinedNumbers = [
      ...existingNumbers,
      ...selectedNumbers,
    ];

    // Remove duplicates
    return [
      ...new Set(combinedNumbers),
    ].join("\n");
  });

  setShowContacts(false);
  setSelectedContacts([]);

  setMessage(
    `${selectedNumbers.length} contact(s) added to recipients.`
  );

  setError("");
};

  // ---------------------------------------------------------
  // LOAD SENDERS + TEMPLATES + BROADCASTS
  // ---------------------------------------------------------
  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoading(true);
      setError("");

      const [sendersResponse, templatesResponse, broadcastsResponse] =
        await Promise.all([
          fetch(`${API_BASE}/options/senders`),
          fetch(`${API_BASE}/options/templates`),
          fetch(`${API_BASE}`),
        ]);

      if (!sendersResponse.ok) {
        throw new Error("Unable to load RCS senders");
      }

      if (!templatesResponse.ok) {
        throw new Error("Unable to load RCS templates");
      }

      if (!broadcastsResponse.ok) {
        throw new Error("Unable to load RCS broadcasts");
      }

      const sendersData = await sendersResponse.json();
      const templatesData = await templatesResponse.json();
      const broadcastsData = await broadcastsResponse.json();

      setSenders(Array.isArray(sendersData) ? sendersData : []);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      setBroadcasts(Array.isArray(broadcastsData) ? broadcastsData : []);
    } catch (err) {
      console.error("RCS Broadcast loading error:", err);
      setError(err.message || "Unable to load RCS broadcast data");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // PROCESS PHONE NUMBERS
  // ---------------------------------------------------------
  const numbers = useMemo(() => {
    return numbersText
      .split(/[\n,\s]+/)
      .map((number) => number.trim())
      .filter(Boolean)
      .map((number) => {
        if (number.startsWith("+")) {
          return number;
        }

        // Automatically add +91 for Indian numbers
        if (number.startsWith("91")) {
          return `+${number}`;
        }

        return `+91${number}`;
      });
  }, [numbersText]);

  const totalNumbers = numbers.length;

  // ---------------------------------------------------------
  // INSERT NUMBER
  // ---------------------------------------------------------
  const handleInsertNumber = () => {
    const number = window.prompt("Enter mobile number");

    if (!number) {
      return;
    }

    const cleaned = number.trim();

    if (!cleaned) {
      return;
    }

    setNumbersText((previous) => {
      if (!previous.trim()) {
        return cleaned;
      }

      return `${previous}\n${cleaned}`;
    });
  };

  // ---------------------------------------------------------
// GET CONTACTS
// ---------------------------------------------------------

const handleGetContacts = async () => {
  setMessage("");
  setError("");

  try {
    setLoadingContacts(true);

    console.log(
      "========== GET RCS CONTACTS =========="
    );

    const response = await fetch(
      "https://cpaas-dashboard-production.up.railway.app/api/rcs/contacts?user_id=1"
    );

    const data = await response
      .json()
      .catch(() => []);

    console.log(
      "RCS contacts response:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.message ||
          "Unable to load contacts."
      );
    }

    if (!Array.isArray(data)) {
      throw new Error(
        "Invalid contacts response from server."
      );
    }

    setContacts(data);
    setSelectedContacts([]);

    setShowContacts(true);

    if (data.length === 0) {
      setMessage(
        "No contacts are available."
      );
    }

  } catch (err) {
    console.error(
      "Get RCS contacts error:",
      err
    );

    setError(
      err.message ||
        "Unable to load contacts."
    );
  } finally {
    setLoadingContacts(false);
  }
};

  // ---------------------------------------------------------
  // FILE UPLOAD
  // ---------------------------------------------------------
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = String(e.target?.result || "");

        const extractedNumbers = text
          .split(/[\n,\r\t]+/)
          .map((value) => value.trim())
          .filter(Boolean)
          .filter((value) => /[0-9]/.test(value));

        if (extractedNumbers.length === 0) {
          setError("No phone numbers were found in the uploaded file.");
          return;
        }

        setNumbersText((previous) => {
          const existing = previous.trim();

          if (!existing) {
            return extractedNumbers.join("\n");
          }

          return `${existing}\n${extractedNumbers.join("\n")}`;
        });

        setMessage(
          `${extractedNumbers.length} number(s) imported from ${file.name}`
        );
        setError("");
      } catch (err) {
        console.error(err);
        setError("Unable to read the uploaded file.");
      }
    };

    reader.onerror = () => {
      setError("Unable to read the uploaded file.");
    };

    reader.readAsText(file);

    // Allow the same file to be selected again
    event.target.value = "";
  };

  // ---------------------------------------------------------
  // CLEAR NUMBERS
  // ---------------------------------------------------------
  const handleClearNumbers = () => {
    setNumbersText("");
    setMessage("");
    setError("");
  };

    // ---------------------------------------------------------
  // SEND NOW
  // ---------------------------------------------------------
  const handleSendNow = async () => {
    setMessage("");
    setError("");

    // -----------------------------
    // BASIC VALIDATION
    // -----------------------------
    if (numbers.length === 0) {
      setError("Please enter at least one mobile number.");
      return;
    }

    if (!campaignName.trim()) {
      setError("Please enter a campaign name.");
      return;
    }

    if (!selectedSender) {
      setError("Please select a sender.");
      return;
    }

    if (!selectedTemplate) {
      setError("Please select a template.");
      return;
    }

    try {
      setSending(true);

      // -----------------------------
      // FIND SELECTED SENDER
      // -----------------------------
      const sender = senders.find(
        (item) =>
          String(item.id) === String(selectedSender)
      );

      if (!sender) {
        throw new Error("Selected RCS sender was not found.");
      }

      if (!sender.bot_id) {
        throw new Error(
          "Selected RCS sender does not have a bot ID."
        );
      }

      // -----------------------------
      // BUILD PAYLOAD
      // -----------------------------
      const payload = {
        bot_id: sender.bot_id,
        template_id: Number(selectedTemplate),
        broadcast_name: campaignName.trim(),
        gateway: gateway || "RCS",

        // IMPORTANT:
        // Send ALL numbers in one broadcast.
        total_recipients: numbers.length,
        phone_numbers: numbers,

        exclude_blocked: excludeBlocked,
      };

      console.log(
        "========== RCS SEND REQUEST =========="
      );

      console.log(
        JSON.stringify(payload, null, 2)
      );

      console.log(
        "Recipient count:",
        numbers.length
      );

      console.log(
        "======================================"
      );

      // -----------------------------
      // STEP 1:
      // CREATE BROADCAST
      // -----------------------------
      const createResponse = await fetch(
        API_BASE,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

      const createData =
        await createResponse
          .json()
          .catch(() => ({}));

      if (!createResponse.ok) {
        throw new Error(
          createData.message ||
            createData.error ||
            "Unable to create RCS broadcast."
        );
      }

      console.log(
        "RCS broadcast created:",
        createData
      );

      const broadcastId =
        createData.broadcast_id ||
        createData.id;

      if (!broadcastId) {
        throw new Error(
          "Broadcast was created, but no broadcast ID was returned by the server."
        );
      }

      // -----------------------------
      // STEP 2:
      // SEND BROADCAST
      // -----------------------------
      console.log(
        "Sending broadcast ID:",
        broadcastId
      );

      const sendResponse = await fetch(
        `${API_BASE}/${broadcastId}/send`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const sendData =
        await sendResponse
          .json()
          .catch(() => ({}));

      console.log(
        "RCS send response:",
        sendData
      );

      if (!sendResponse.ok) {
        throw new Error(
          sendData.message ||
            sendData.error ||
            "Broadcast was created, but sending failed."
        );
      }

      // -----------------------------
      // SUCCESS
      // -----------------------------
      setMessage(
        sendData.message ||
          `RCS broadcast sent successfully to ${numbers.length} recipient(s).`
      );

      // Clear form
      setNumbersText("");
      setCampaignName("");

      // Refresh recent broadcasts
      await loadOptions();

    } catch (err) {
      console.error(
        "RCS Send Now error:",
        err
      );

      setError(
        err.message ||
          "Unable to send RCS broadcast."
      );

    } finally {
      setSending(false);
    }
  };


  // ---------------------------------------------------------
// SCHEDULE
// ---------------------------------------------------------

const handleSchedule = async () => {
  console.log("========== RCS SCHEDULE CLICKED ==========");

  setMessage("");
  setError("");

  // -----------------------------
  // BASIC VALIDATION
  // -----------------------------

  if (numbers.length === 0) {
    setError("Please enter at least one mobile number.");
    return;
  }

  if (!campaignName.trim()) {
    setError("Please enter a campaign name.");
    return;
  }

  if (!selectedSender) {
    setError("Please select a sender.");
    return;
  }

  if (!selectedTemplate) {
    setError("Please select a template.");
    return;
  }

  // -----------------------------
  // SCHEDULE TIME VALIDATION
  // -----------------------------

  if (!scheduledAt) {
    setShowSchedulePicker(true);
    setError("Please select a scheduled date and time.");
    return;
  }

  const selectedDate = new Date(scheduledAt);

  if (Number.isNaN(selectedDate.getTime())) {
    setError("Invalid scheduled date and time.");
    return;
  }

  if (selectedDate.getTime() <= Date.now()) {
    setError(
      "Scheduled date and time must be in the future."
    );
    return;
  }

  try {
    setSending(true);

    // -----------------------------
    // FIND SENDER
    // -----------------------------

    const sender = senders.find(
      (item) =>
        String(item.id) === String(selectedSender)
    );

    if (!sender) {
      throw new Error(
        "Selected RCS sender was not found."
      );
    }

    if (!sender.bot_id) {
      throw new Error(
        "Selected RCS sender does not have a bot ID."
      );
    }

    // -----------------------------
    // FORMAT MYSQL DATETIME
    // -----------------------------

    const year = selectedDate.getFullYear();
    const month = String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      selectedDate.getDate()
    ).padStart(2, "0");

    const hour = String(
      selectedDate.getHours()
    ).padStart(2, "0");

    const minute = String(
      selectedDate.getMinutes()
    ).padStart(2, "0");

    const formattedScheduledAt =
      `${year}-${month}-${day} ${hour}:${minute}:00`;

    // -----------------------------
    // PAYLOAD
    // -----------------------------

    const payload = {
      bot_id: sender.bot_id,
      template_id: Number(selectedTemplate),
      broadcast_name: campaignName.trim(),
      gateway: gateway || "RCS",
      total_recipients: numbers.length,
      phone_numbers: numbers,
      exclude_blocked: excludeBlocked,
      scheduled_at: formattedScheduledAt,
    };

    console.log(
      "========== RCS SCHEDULE REQUEST =========="
    );

    console.log(
      JSON.stringify(payload, null, 2)
    );

    console.log(
      "=========================================="
    );

    // -----------------------------
    // SEND TO BACKEND
    // -----------------------------

    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message ||
          data.error ||
          "Unable to schedule RCS broadcast."
      );
    }

    // -----------------------------
    // SUCCESS
    // -----------------------------

    setMessage(
      data.message ||
        "RCS broadcast scheduled successfully."
    );

    setError("");

    setNumbersText("");
    setCampaignName("");
    setScheduledAt("");
    setShowSchedulePicker(false);

    await loadOptions();

  } catch (err) {
    console.error(
      "RCS Schedule error:",
      err
    );

    setError(
      err.message ||
        "Unable to schedule RCS broadcast."
    );

  } finally {
    setSending(false);
  }
};

  // ---------------------------------------------------------
  // TEMPLATE PREVIEW
  // ---------------------------------------------------------
  const selectedTemplateData = templates.find(
    (item) => String(item.id) === String(selectedTemplate)
  );

  return (
    <div className="rcs-broadcast-page">
      <style>{`
        .rcs-broadcast-page {
          min-height: 100%;
          background: #ffffff;
          padding: 28px;
          box-sizing: border-box;
        }

        .rcs-title {
          background: linear-gradient(90deg, #0057d9, #0754c8);
          color: white;
          padding: 15px 22px;
          border-radius: 4px;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 22px;
        }

        .rcs-card {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          padding: 20px;
          margin-bottom: 20px;
        }

        .rcs-action-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .rcs-action-btn {
          height: 46px;
          border: none;
          border-radius: 5px;
          background: #075bd5;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }

        .rcs-action-btn.secondary {
          background: #e9eef5;
          color: #333;
        }

        .rcs-action-btn:hover {
          opacity: 0.92;
        }

        .rcs-number-area {
          width: 100%;
          min-height: 115px;
          border: 1px solid #d8dce3;
          border-left: 4px solid #075bd5;
          border-radius: 3px;
          padding: 15px;
          box-sizing: border-box;
          resize: vertical;
          font-size: 14px;
          outline: none;
        }

        .rcs-number-area:focus {
          border-color: #075bd5;
          border-left-color: #075bd5;
        }

        .rcs-number-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }

        .rcs-small-actions {
          display: flex;
          gap: 12px;
        }

        .rcs-icon-btn {
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 18px;
        }

        .rcs-count {
          font-size: 14px;
          color: #444;
        }

        .section-heading {
          text-align: center;
          color: #777;
          font-size: 14px;
          margin: 18px 0 25px;
          position: relative;
        }

        .section-heading::before,
        .section-heading::after {
          content: "";
          position: absolute;
          top: 50%;
          width: 30%;
          height: 1px;
          background: #ddd;
        }

        .section-heading::before {
          left: 0;
        }

        .section-heading::after {
          right: 0;
        }

        .rcs-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px 55px;
        }

        .rcs-field {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .rcs-field label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .rcs-field input,
        .rcs-field select {
          height: 44px;
          border: none;
          border-bottom: 1px solid #d5d9df;
          outline: none;
          background: white;
          font-size: 14px;
          padding: 0 8px;
        }

        .rcs-field input:focus,
        .rcs-field select:focus {
          border-bottom: 2px solid #075bd5;
        }

        .rcs-checkbox {
          margin-top: 25px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #555;
        }

        .rcs-checkbox input {
          width: 17px;
          height: 17px;
        }

        .rcs-bottom-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 28px;
        }

        .send-btn,
        .schedule-btn {
          min-width: 130px;
          height: 44px;
          border-radius: 5px;
          border: none;
          font-weight: 600;
          cursor: pointer;
        }

        .send-btn {
          background: #075bd5;
          color: white;
        }

        .schedule-btn {
          background: #dce2eb;
          color: #444;
        }

        .send-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .alert-success {
          background: #e8f7ed;
          color: #18763a;
          padding: 12px 15px;
          border-radius: 5px;
          margin-bottom: 15px;
        }

        .alert-error {
          background: #fdeaea;
          color: #b42318;
          padding: 12px 15px;
          border-radius: 5px;
          margin-bottom: 15px;
        }

        .template-preview {
          margin-top: 18px;
          padding: 14px;
          border-radius: 6px;
          background: #f5f7fa;
          font-size: 13px;
          color: #555;
        }

        .broadcast-list {
          margin-top: 20px;
        }

        .broadcast-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px;
          border-bottom: 1px solid #eee;
          font-size: 13px;
        }

        .status-badge {
          padding: 4px 9px;
          border-radius: 12px;
          background: #eef2f7;
          font-size: 11px;
          font-weight: 600;
        }

        @media (max-width: 800px) {
          .rcs-form-grid {
            grid-template-columns: 1fr;
          }

          .rcs-action-row {
            grid-template-columns: 1fr;
          }

          .section-heading::before,
          .section-heading::after {
            width: 20%;
          }
        }
      `}</style>

      <div className="rcs-title">
        Broadcast RCS Message
      </div>

      {message && (
        <div className="alert-success">
          {message}
        </div>
      )}

      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      <div className="rcs-card">
        {/* TOP ACTION BUTTONS */}
        <div className="rcs-action-row">
          <button
            className="rcs-action-btn"
            onClick={handleInsertNumber}
          >
            ☷ Insert Number
          </button>

          <button
            className="rcs-action-btn secondary"
            onClick={handleGetContacts}
          >
            ☎ Get Contacts
          </button>

          <button
            className="rcs-action-btn secondary"
            onClick={handleUploadClick}
          >
            📄 Upload File
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>


        {/* -------------------------------------------------
    CONTACT SELECTION PANEL
------------------------------------------------- */}

{showContacts && (
  <div
    style={{
      marginBottom: "18px",
      padding: "18px",
      border: "1px solid #d7e1ef",
      borderRadius: "8px",
      background: "#f7f9fc",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "15px",
      }}
    >
      <strong
        style={{
          fontSize: "16px",
        }}
      >
        Select Contacts
      </strong>

      <button
        type="button"
        onClick={() => {
          setShowContacts(false);
          setSelectedContacts([]);
        }}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: "18px",
        }}
      >
        ✕
      </button>
    </div>

    {loadingContacts ? (
      <div>
        Loading contacts...
      </div>
    ) : contacts.length === 0 ? (
      <div
        style={{
          color: "#777",
        }}
      >
        No contacts found.
      </div>
    ) : (
      <>
        {/* SELECT ALL */}

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={
              contacts.length > 0 &&
              selectedContacts.length ===
                contacts.length
            }
            onChange={
              toggleSelectAllContacts
            }
          />

          Select All
        </label>

        {/* CONTACT LIST */}

        <div
          style={{
            maxHeight: "220px",
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #e1e5ea",
            borderRadius: "6px",
          }}
        >
          {contacts.map(
            (contact) => {
              const isSelected =
                selectedContacts.some(
                  (item) =>
                    String(item.id) ===
                    String(contact.id)
                );

              return (
                <label
                  key={contact.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    borderBottom:
                      "1px solid #eee",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() =>
                      toggleContactSelection(
                        contact
                      )
                    }
                  />

                  <div>
                    <div
                      style={{
                        fontWeight: "600",
                      }}
                    >
                      {contact.business_name ||
                        "Contact"}
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        color: "#555",
                      }}
                    >
                      {contact.phone_number}
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        color:
                          contact.status ===
                          "CONNECTED"
                            ? "#198754"
                            : "#777",
                      }}
                    >
                      {contact.status ||
                        "UNKNOWN"}
                    </div>
                  </div>
                </label>
              );
            }
          )}
        </div>

        {/* ADD BUTTON */}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "15px",
          }}
        >
          <button
            type="button"
            onClick={
              handleAddSelectedContacts
            }
            style={{
              padding:
                "10px 18px",
              border: "none",
              borderRadius: "5px",
              background:
                "#075bd5",
              color: "#fff",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Add Selected (
            {selectedContacts.length})
          </button>
        </div>
      </>
    )}
  </div>
)}

        {/* NUMBER INPUT */}
        <textarea
          className="rcs-number-area"
          placeholder="Enter numbers followed by +91"
          value={numbersText}
          onChange={(e) => setNumbersText(e.target.value)}
        />

        <div className="rcs-number-footer">
          <div className="rcs-small-actions">
            <button
              className="rcs-icon-btn"
              title="Clear numbers"
              onClick={handleClearNumbers}
            >
              🗑️
            </button>
          </div>

          <div className="rcs-count">
            Total Numbers: <strong>{totalNumbers}</strong>
          </div>
        </div>

        {/* CAMPAIGN DETAILS */}
        <div className="section-heading">
          Enter Campaign Details
        </div>

        <div className="rcs-form-grid">
          {/* SENDER */}
          <div className="rcs-field">
            <label>Select Sender</label>

            <select
              value={selectedSender}
              onChange={(e) => setSelectedSender(e.target.value)}
              disabled={loading}
            >
              <option value="">
                Select Sender Id
              </option>

              {senders.map((sender) => (
                <option
                  key={sender.id}
                  value={sender.id}
                >
                  {sender.brand_name} ({sender.bot_id})
                </option>
              ))}
            </select>
          </div>

          {/* CAMPAIGN NAME */}
          <div className="rcs-field">
            <label>Campaign Name</label>

            <input
              type="text"
              placeholder="Enter Campaign Name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
            />
          </div>

          {/* GATEWAY */}
          <div className="rcs-field">
            <label>Select Gateway</label>

            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
            >
              <option value="RCS">
                RCS
              </option>
            </select>
          </div>

          {/* TEMPLATE */}
          <div className="rcs-field">
            <label>Select Template</label>

            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              disabled={loading}
            >
              <option value="">
                Select Template
              </option>

              {templates.map((template) => (
                <option
                  key={template.id}
                  value={template.id}
                >
                  {template.template_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TEMPLATE PREVIEW */}
        {selectedTemplateData && (
          <div className="template-preview">
            <strong>Selected Template:</strong>{" "}
            {selectedTemplateData.template_name}

            <br />

            <strong>Type:</strong>{" "}
            {selectedTemplateData.template_type}

            <br />

            <strong>Message Type:</strong>{" "}
            {selectedTemplateData.bot_message_type}

            <br />

            <strong>Status:</strong>{" "}
            {selectedTemplateData.status}
          </div>
        )}

        {/* BLOCKED NUMBERS */}
        <label className="rcs-checkbox">
          <input
            type="checkbox"
            checked={excludeBlocked}
            onChange={(e) =>
              setExcludeBlocked(e.target.checked)
            }
          />

          Exclude Blocked Numbers
        </label>

        {/* -------------------------------------------------
    SCHEDULE DATE & TIME
------------------------------------------------- */}

{showSchedulePicker && (
  <div
    style={{
      marginTop: "20px",
      padding: "20px",
      border: "1px solid #d7e1ef",
      borderRadius: "8px",
      background: "#f7f9fc",
    }}
  >
    <div
      style={{
        fontSize: "16px",
        fontWeight: "600",
        marginBottom: "14px",
        color: "#222",
      }}
    >
      Select Scheduled Date & Time
    </div>

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <input
        type="datetime-local"
        value={scheduledAt}
        min={new Date(
          Date.now() -
            new Date().getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16)}
        onChange={(e) => {
          setScheduledAt(e.target.value);
          setError("");
          setMessage("");
        }}
        style={{
          height: "42px",
          padding: "0 12px",
          border: "1px solid #cfd6df",
          borderRadius: "5px",
          background: "#fff",
          fontSize: "14px",
          outline: "none",
        }}
      />

      <button
        type="button"
        onClick={handleSchedule}
        disabled={sending}
        style={{
          height: "42px",
          padding: "0 18px",
          border: "none",
          borderRadius: "5px",
          background: "#075bd5",
          color: "#fff",
          fontWeight: "600",
          cursor: sending
            ? "not-allowed"
            : "pointer",
          opacity: sending ? 0.6 : 1,
        }}
      >
        {sending
          ? "Scheduling..."
          : "Confirm Schedule"}
      </button>

      <button
        type="button"
        onClick={() => {
          setShowSchedulePicker(false);
          setScheduledAt("");
          setError("");
          setMessage("");
        }}
        disabled={sending}
        style={{
          height: "42px",
          padding: "0 18px",
          border: "1px solid #cbd3df",
          borderRadius: "5px",
          background: "#fff",
          color: "#444",
          fontWeight: "600",
          cursor: sending
            ? "not-allowed"
            : "pointer",
        }}
      >
        Cancel
      </button>
    </div>
  </div>
)}


        {/* ACTION BUTTONS */}
        <div className="rcs-bottom-actions">
          <button
            className="send-btn"
            onClick={handleSendNow}
            disabled={sending || loading}
          >
            {sending ? "Sending..." : "✈ Send Now"}
          </button>

        <button
  type="button"
  className="schedule-btn"
  onClick={() => {
    console.log("🔥 Schedule RCS button clicked");
    setError("");
    setShowSchedulePicker(true);
  }}
  disabled={sending}
>
  {sending ? "Scheduling..." : "Schedule RCS ⏱"}
</button>
        </div>
      </div>

      {/* EXISTING BROADCASTS */}
      <div className="rcs-card broadcast-list">
        <h3>Recent RCS Broadcasts</h3>

        {broadcasts.length === 0 ? (
          <p style={{ color: "#777", fontSize: "14px" }}>
            No RCS broadcasts found.
          </p>
        ) : (
          broadcasts.map((broadcast) => (
            <div
              className="broadcast-row"
              key={broadcast.id}
            >
              <div>
                <strong>
                  {broadcast.broadcast_name ||
                    `Broadcast #${broadcast.id}`}
                </strong>

                <div>
                  Recipients:{" "}
                  {broadcast.total_recipients ?? 0}
                </div>
              </div>

              <span className="status-badge">
                {broadcast.status || "DRAFT"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

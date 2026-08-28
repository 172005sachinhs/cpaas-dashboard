import { useEffect, useMemo, useState } from "react";

const API_BASE = "https://cpaas-dashboard-production.up.railway.app";

function RCSReport() {
  const [activeTab, setActiveTab] = useState("campaign");

  const [campaigns, setCampaigns] = useState([]);
  const [numberLogs, setNumberLogs] = useState([]);
  const [inboundMessages, setInboundMessages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [campaignSearch, setCampaignSearch] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // =====================================================
  // LOAD CAMPAIGN REPORT
  // =====================================================

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/rcs/reports?user_id=1`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load RCS campaign report"
        );
      }

      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("RCS campaign report error:", err);
      setError(err.message || "Unable to load campaign report.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD NUMBER LOGS
  // =====================================================

  const loadNumberLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/rcs/reports/number-logs?user_id=1`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load RCS number logs"
        );
      }

      setNumberLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("RCS number logs error:", err);
      setError(err.message || "Unable to load number logs.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD INBOUND
  // =====================================================

  const loadInboundMessages = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/rcs/reports/inbound?user_id=1`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load inbound messages"
        );
      }

      setInboundMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("RCS inbound error:", err);
      setError(err.message || "Unable to load inbound messages.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadCampaigns();
  }, []);

  // =====================================================
  // TAB LOAD
  // =====================================================

  useEffect(() => {
    if (activeTab === "campaign") {
      loadCampaigns();
    }

    if (activeTab === "number-logs") {
      loadNumberLogs();
    }

    if (activeTab === "inbound") {
      loadInboundMessages();
    }
  }, [activeTab]);

  // =====================================================
  // FILTER CAMPAIGNS
  // =====================================================

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const campaignName = String(
        campaign.broadcast_name || ""
      ).toLowerCase();

      const templateName = String(
        campaign.template_name || ""
      ).toLowerCase();

      const status = String(
        campaign.status || ""
      ).toUpperCase();

      const campaignMatch = campaignName.includes(
        campaignSearch.trim().toLowerCase()
      );

      const templateMatch = templateName.includes(
        templateSearch.trim().toLowerCase()
      );

      const statusMatch =
        statusFilter === "ALL" ||
        status === statusFilter;

      return (
        campaignMatch &&
        templateMatch &&
        statusMatch
      );
    });
  }, [
    campaigns,
    campaignSearch,
    templateSearch,
    statusFilter,
  ]);

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (value) => {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  // =====================================================
  // CSV DOWNLOAD
  // =====================================================

  const downloadCSV = (rows, filename) => {
    if (!rows || rows.length === 0) {
      alert("No data available to download.");
      return;
    }

    const headers = Object.keys(rows[0]);

    const csvRows = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value =
              row[header] === null ||
              row[header] === undefined
                ? ""
                : String(row[header]);

            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ];

    const blob = new Blob(
      [csvRows.join("\n")],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =====================================================
  // DOWNLOAD CAMPAIGN REPORT
  // =====================================================

  const downloadCampaignCSV = () => {
    const rows = filteredCampaigns.map((item) => ({
      ID: item.id,
      User: item.user_name || "-",
      Bot_ID: item.bot_id || "-",
      Gateway: item.gateway || "-",
      Campaign: item.broadcast_name || "-",
      Message_ID: item.message_id || "-",
      Category: item.category || "-",
      Template: item.template_name || "-",
      Template_Type: item.template_type || "-",
      Template_Status: item.template_status || "-",
      Type: item.report_type || "-",
      Total_Number: item.total_recipients || 0,
      Sent: item.sent_count || 0,
      Delivered: item.delivered_count || 0,
      Failed: item.failed_count || 0,
      Status: item.status || "-",
      Total_Cost: item.total_cost || 0,
      Scheduled_At: formatDate(item.scheduled_at),
      Created_At: formatDate(item.created_at),
    }));

    downloadCSV(
      rows,
      "RCS_Campaign_Report.csv"
    );
  };

  // =====================================================
  // DOWNLOAD NUMBER LOGS
  // =====================================================

  const downloadNumberLogsCSV = () => {
    const rows = numberLogs.map((item) => ({
      ID: item.id,
      Campaign: item.broadcast_name || "-",
      Phone_Number: item.phone_number || "-",
      Recipient: item.recipient_name || "-",
      Status: item.status || "-",
      Error_Message: item.error_message || "-",
      Sent_At: formatDate(item.sent_at),
      Delivered_At: formatDate(item.delivered_at),
      Created_At: formatDate(item.created_at),
    }));

    downloadCSV(
      rows,
      "RCS_Number_Logs.csv"
    );
  };

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (status) => {
    const value = String(
      status || ""
    ).toUpperCase();

    if (value === "SENT") return "sent";
    if (value === "DELIVERED") return "delivered";
    if (value === "FAILED") return "failed";
    if (value === "PENDING") return "pending";
    if (value === "DRAFT") return "draft";

    return "pending";
  };

  // =====================================================
  // STYLES
  // =====================================================

  const pageStyle = {
    padding: "24px",
    background: "#f8fafc",
    minHeight: "100vh",
    boxSizing: "border-box",
  };

  const tabContainerStyle = {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(180px, 1fr))",
    gap: "12px",
    marginBottom: "22px",
  };

  const tabStyle = {
    minHeight: "82px",
    border: "1px solid #dbe3ef",
    borderRadius: "10px",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    color: "#334155",
  };

  const activeTabStyle = {
    ...tabStyle,
    background: "#eff6ff",
    border: "1px solid #93c5fd",
    color: "#1d4ed8",
  };

  const cardStyle = {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "20px",
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    boxSizing: "border-box",
    background: "#fff",
  };

  const primaryButton = {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "600",
  };

  const secondaryButton = {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#334155",
    padding: "10px 16px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "600",
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div style={pageStyle}>

      {/* HEADER */}

      <div
        style={{
          marginBottom: "22px",
        }}
      >
        <h1
          style={{
            margin: 0,
            color: "#0f172a",
          }}
        >
          RCS Campaign Report
        </h1>

        <p
          style={{
            marginTop: "7px",
            color: "#64748b",
          }}
        >
          Monitor RCS campaigns, logs, and downloadable reports.
        </p>
      </div>

      {/* TABS */}

      <div style={tabContainerStyle}>

        <button
          type="button"
          onClick={() =>
            setActiveTab("campaign")
          }
          style={
            activeTab === "campaign"
              ? activeTabStyle
              : tabStyle
          }
        >
          <div
            style={{
              fontSize: "22px",
              marginBottom: "8px",
            }}
          >
            ▣
          </div>

          RCS Campaign Report
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab("number-logs")
          }
          style={
            activeTab === "number-logs"
              ? activeTabStyle
              : tabStyle
          }
        >
          <div
            style={{
              fontSize: "22px",
              marginBottom: "8px",
            }}
          >
            ▤
          </div>

          RCS Number Logs
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab("inbound")
          }
          style={
            activeTab === "inbound"
              ? activeTabStyle
              : tabStyle
          }
        >
          <div
            style={{
              fontSize: "22px",
              marginBottom: "8px",
            }}
          >
            ✉
          </div>

          RCS Inbound Message
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab("download")
          }
          style={
            activeTab === "download"
              ? activeTabStyle
              : tabStyle
          }
        >
          <div
            style={{
              fontSize: "22px",
              marginBottom: "8px",
            }}
          >
            ⇩
          </div>

          RCS Report Download
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#b91c1c",
            border: "1px solid #fecaca",
            padding: "12px 15px",
            borderRadius: "8px",
            marginBottom: "18px",
          }}
        >
          {error}
        </div>
      )}

      {/* =================================================
          CAMPAIGN REPORT
      ================================================= */}

      {activeTab === "campaign" && (
        <div style={cardStyle}>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                }}
              >
                Campaign Activity
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#64748b",
                }}
              >
                {filteredCampaigns.length} campaign(s)
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
              }}
            >
              <button
                type="button"
                style={secondaryButton}
                onClick={loadCampaigns}
              >
                ↻ Refresh
              </button>

              <button
                type="button"
                style={primaryButton}
                onClick={() => {
                  window.location.href =
                    "/rcs/broadcast";
                }}
              >
                ➤ Create Campaign
              </button>
            </div>
          </div>

          {/* FILTERS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(180px, 1fr))",
              gap: "12px",
              marginBottom: "22px",
            }}
          >

            <input
              style={inputStyle}
              placeholder="Campaign name"
              value={campaignSearch}
              onChange={(e) =>
                setCampaignSearch(e.target.value)
              }
            />

            <input
              style={inputStyle}
              placeholder="Template name"
              value={templateSearch}
              onChange={(e) =>
                setTemplateSearch(e.target.value)
              }
            />

            <select
              style={inputStyle}
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="ALL">
                All Status
              </option>

              <option value="DRAFT">
                Draft
              </option>

              <option value="SCHEDULED">
                Scheduled
              </option>

              <option value="SENT">
                Sent
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="FAILED">
                Failed
              </option>

              <option value="DELIVERED">
                Delivered
              </option>
            </select>

          </div>

          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              Loading RCS campaigns...
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              No RCS campaigns found.
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "1100px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f8fafc",
                    }}
                  >
                    <th style={thStyle}>
                      User/Parents
                    </th>

                    <th style={thStyle}>
                      Primary Info
                    </th>

                    <th style={thStyle}>
                      Category/Template
                    </th>

                    <th style={thStyle}>
                      Type
                    </th>

                    <th style={thStyle}>
                      Total Cost
                    </th>

                    <th style={thStyle}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {filteredCampaigns.map(
                    (campaign) => (
                      <tr key={campaign.id}>

                        <td style={tdStyle}>
                          <strong>
                            👤{" "}
                            {campaign.user_name ||
                              "demo"}
                          </strong>

                          <div style={smallText}>
                            BOT ID:{" "}
                            {campaign.bot_id ||
                              "-"}
                          </div>

                          <div style={smallText}>
                            GATEWAY:{" "}
                            {campaign.gateway ||
                              "-"}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <strong>
                            CAMPAIGN{" "}
                            {campaign.broadcast_name ||
                              "-"}
                          </strong>

                          <div style={smallText}>
                            MESSAGE ID:{" "}
                            {campaign.message_id ||
                              "-"}
                          </div>

                          <div style={smallText}>
                            {formatDate(
                              campaign.created_at
                            )}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <div style={smallLabel}>
                            CATEGORY
                          </div>

                          <strong>
                            {campaign.category ||
                              "-"}
                          </strong>

                          <div
                            style={{
                              marginTop: "7px",
                            }}
                          >
                            <div style={smallLabel}>
                              TEMPLATE
                            </div>

                            <strong>
                              {campaign.template_name ||
                                "-"}
                            </strong>
                          </div>

                          <div
                            style={{
                              marginTop: "7px",
                            }}
                          >
                            <div style={smallLabel}>
                              TEMPLATE STATUS
                            </div>

                            <span
                              style={{
                                color:
                                  String(
                                    campaign.template_status
                                  ).toUpperCase() ===
                                  "APPROVED"
                                    ? "#15803d"
                                    : "#d97706",
                                fontWeight: "700",
                              }}
                            >
                              ●{" "}
                              {campaign.template_status ||
                                "-"}
                            </span>
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <div style={smallLabel}>
                            TOTAL NUMBER
                          </div>

                          <strong>
                            {campaign.total_recipients ||
                              0}
                          </strong>

                          <div
                            style={{
                              marginTop: "7px",
                            }}
                          >
                            <div style={smallLabel}>
                              TYPE
                            </div>

                            <strong>
                              {campaign.report_type ||
                                "RCS-COMPOSE"}
                            </strong>
                          </div>

                          <div
                            style={{
                              marginTop: "7px",
                            }}
                          >
                            <div style={smallLabel}>
                              STATUS
                            </div>

                            <StatusBadge
                              status={
                                campaign.status
                              }
                            />
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <strong>
                            INR{" "}
                            {Number(
                              campaign.total_cost ||
                                0
                            ).toFixed(3)}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          <button
                            type="button"
                            style={{
                              ...secondaryButton,
                              padding: "7px 10px",
                            }}
                            onClick={() =>
                              alert(
                                `Campaign ID: ${campaign.id}\n\nSent: ${
                                  campaign.sent_count ||
                                  0
                                }\nDelivered: ${
                                  campaign.delivered_count ||
                                  0
                                }\nFailed: ${
                                  campaign.failed_count ||
                                  0
                                }`
                              )
                            }
                          >
                            👁
                          </button>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* =================================================
          NUMBER LOGS
      ================================================= */}

      {activeTab === "number-logs" && (
        <div style={cardStyle}>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                margin: 0,
              }}
            >
              RCS Number Logs
            </h2>

            <div
              style={{
                display: "flex",
                gap: "8px",
              }}
            >
              <button
                type="button"
                style={secondaryButton}
                onClick={loadNumberLogs}
              >
                ↻ Refresh
              </button>

              <button
                type="button"
                style={primaryButton}
                onClick={downloadNumberLogsCSV}
              >
                ⇩ Download
              </button>
            </div>
          </div>

          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
              }}
            >
              Loading number logs...
            </div>
          ) : numberLogs.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              No RCS number logs found.
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "900px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f8fafc",
                    }}
                  >
                    <th style={thStyle}>
                      ID
                    </th>

                    <th style={thStyle}>
                      Campaign
                    </th>

                    <th style={thStyle}>
                      Phone Number
                    </th>

                    <th style={thStyle}>
                      Recipient
                    </th>

                    <th style={thStyle}>
                      Status
                    </th>

                    <th style={thStyle}>
                      Sent At
                    </th>

                    <th style={thStyle}>
                      Delivered At
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {numberLogs.map(
                    (log) => (
                      <tr key={log.id}>

                        <td style={tdStyle}>
                          {log.id}
                        </td>

                        <td style={tdStyle}>
                          {log.broadcast_name ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {log.phone_number ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {log.recipient_name ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          <StatusBadge
                            status={log.status}
                          />
                        </td>

                        <td style={tdStyle}>
                          {formatDate(
                            log.sent_at
                          )}
                        </td>

                        <td style={tdStyle}>
                          {formatDate(
                            log.delivered_at
                          )}
                        </td>

                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* =================================================
          INBOUND MESSAGE
      ================================================= */}

      {activeTab === "inbound" && (
        <div style={cardStyle}>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                margin: 0,
              }}
            >
              RCS Inbound Message
            </h2>

            <button
              type="button"
              style={secondaryButton}
              onClick={loadInboundMessages}
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
              }}
            >
              Loading inbound messages...
            </div>
          ) : inboundMessages.length === 0 ? (
            <div
              style={{
                padding: "55px 20px",
                textAlign: "center",
                border: "1px dashed #cbd5e1",
                borderRadius: "10px",
                color: "#64748b",
              }}
            >
              <div
                style={{
                  fontSize: "34px",
                  marginBottom: "12px",
                }}
              >
                ✉
              </div>

              <h3
                style={{
                  margin: "0 0 8px",
                  color: "#334155",
                }}
              >
                RCS Inbound Message
              </h3>

              <p
                style={{
                  margin: 0,
                }}
              >
                No inbound RCS messages are available yet.
              </p>
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    {Object.keys(
                      inboundMessages[0]
                    ).map((key) => (
                      <th
                        key={key}
                        style={thStyle}
                      >
                        {key
                          .replaceAll("_", " ")
                          .toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {inboundMessages.map(
                    (message, index) => (
                      <tr
                        key={
                          message.id ||
                          index
                        }
                      >
                        {Object.keys(
                          inboundMessages[0]
                        ).map((key) => (
                          <td
                            key={key}
                            style={tdStyle}
                          >
                            {message[key] ??
                              "-"}
                          </td>
                        ))}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* =================================================
          REPORT DOWNLOAD
      ================================================= */}

      {activeTab === "download" && (
        <div style={cardStyle}>

          <h2
            style={{
              marginTop: 0,
            }}
          >
            RCS Report Download
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(280px, 1fr))",
              gap: "20px",
              marginTop: "25px",
            }}
          >

            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "30px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "12px",
                }}
              >
                ▣
              </div>

              <h3>
                RCS Campaign Report
              </h3>

              <p
                style={{
                  color: "#64748b",
                }}
              >
                Campaign, message ID, template,
                recipient count, status and cost.
              </p>

              <button
                type="button"
                style={primaryButton}
                onClick={downloadCampaignCSV}
              >
                ⇩ Download Campaign CSV
              </button>
            </div>

            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "30px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "12px",
                }}
              >
                ▤
              </div>

              <h3>
                RCS Number Logs
              </h3>

              <p
                style={{
                  color: "#64748b",
                }}
              >
                Recipient phone numbers, statuses,
                sent time and delivery time.
              </p>

              <button
                type="button"
                style={primaryButton}
                onClick={async () => {
                  if (
                    numberLogs.length === 0
                  ) {
                    await loadNumberLogs();
                  }

                  setTimeout(
                    downloadNumberLogsCSV,
                    300
                  );
                }}
              >
                ⇩ Download Number Logs CSV
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// =====================================================
// STATUS BADGE
// =====================================================

function StatusBadge({ status }) {
  const value = String(
    status || "PENDING"
  ).toUpperCase();

  let background = "#fef3c7";
  let color = "#92400e";

  if (value === "SENT") {
    background = "#dbeafe";
    color = "#1d4ed8";
  }

  if (value === "DELIVERED") {
    background = "#dcfce7";
    color = "#15803d";
  }

  if (value === "FAILED") {
    background = "#fee2e2";
    color = "#b91c1c";
  }

  if (value === "DRAFT") {
    background = "#e2e8f0";
    color = "#475569";
  }

  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: "999px",
        background,
        color,
        fontSize: "12px",
        fontWeight: "700",
      }}
    >
      ● {value}
    </span>
  );
}

// =====================================================
// TABLE STYLES
// =====================================================

const thStyle = {
  textAlign: "left",
  padding: "13px 12px",
  borderBottom: "1px solid #e2e8f0",
  color: "#475569",
  fontSize: "13px",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "15px 12px",
  borderBottom: "1px solid #eef2f7",
  verticalAlign: "top",
  color: "#334155",
  fontSize: "13px",
};

const smallText = {
  marginTop: "5px",
  color: "#64748b",
  fontSize: "12px",
};

const smallLabel = {
  color: "#94a3b8",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.4px",
  marginBottom: "2px",
};

export default RCSReport;

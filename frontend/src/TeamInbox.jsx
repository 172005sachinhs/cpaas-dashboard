import { useEffect, useMemo, useState } from "react";

const API_BASE = "https://cpaas-dashboard-production.up.railway.app";

const INITIAL_CHATS = [
  [1, "Arvind Ahluwalia", "A", "Hi Sir", "Jan 8, 2026", "10:42 AM", false, "green", "opened"],
  [2, "Navjyot", "N", "Hello", "Jan 6, 2026", "4:18 PM", true, "purple", "pending"],
  [3, "Shokeen", "S", "Thanks for your reply. We will...", "Jan 6, 2026", "2:11 PM", false, "peach", "opened"],
  [4, "Sangeeta Malu", "S", "🎵 Audio", "Dec 31, 2025", "11:38 AM", true, "blue", "opened"],
  [5, "Vedprakash Agarwal", "V", "🎥 Video", "Dec 31, 2025", "9:24 AM", false, "lavender", "closed"],
  [6, "Alok Gupta", "A", "Hi", "Dec 30, 2025", "6:15 PM", false, "yellow", "unassigned"],
  [7, "vivanteshwar", "V", "We are looking for whatsapp se...", "Dec 29, 2025", "1:07 PM", true, "teal", "unassigned"],
  [8, "Rahul Sharma", "R", "Can you help me with this?", "Dec 28, 2025", "3:41 PM", false, "red", "opened"],
  [9, "Priya", "P", "Thank you", "Dec 27, 2025", "12:20 PM", true, "pink", "opened"],
  [10, "Amit Kumar", "A", "I need some information", "Dec 26, 2025", "5:05 PM", false, "indigo", "closed"],
].map(
  ([
    id,
    name,
    initials,
    preview,
    date,
    time,
    unread,
    color,
    status,
  ]) => ({
    id,
    name,
    initials,
    preview,
    date,
    time,
    unread,
    color,
    status,
  })
);

const FILTERS = [
  ["all", "All Chats", "●"],
  ["assign", "Assign Chats", "✉"],
  ["opened", "Opened Chats", "✉"],
  ["pending", "Pending Chats", "◷"],
  ["closed", "Closed Chats", "✓"],
  ["unassigned", "Unassigned", "♟"],
  ["read", "Unread Chats", "▣"],
  ["custom", "Custom Dates", "▣"],
];

const COLOR_POOL = [
  "green",
  "purple",
  "peach",
  "blue",
  "lavender",
  "yellow",
  "teal",
  "red",
  "pink",
  "indigo",
];

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "A";

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function formatDateTime(value) {
  if (!value) {
    const now = new Date();

    return {
      date: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: now.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  }

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return {
      date: "",
      time: "",
    };
  }

  return {
    date: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

/*
 * Normalize assignment values coming from MySQL/API.
 *
 * This is important because MySQL/API can sometimes return:
 *   null
 *   undefined
 *   ""
 *   "null"
 *   "0"
 *   0
 *   an actual agent id
 */
function normalizeAssignedAgentId(item) {
  const value =
    item.assigned_agent_id ??
    item.assignedAgentId ??
    item.agent_id ??
    item.agentId ??
    item.assigned_to ??
    item.assignedTo ??
    null;

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "null" ||
    value === "NULL" ||
    value === 0 ||
    value === "0"
  ) {
    return null;
  }

  return value;
}

function mapApiChat(item, index = 0) {
  const dt = formatDateTime(
    item.last_message_at || item.created_at
  );

  const status = String(
    item.status ||
      item.chat_status ||
      "OPENED"
  )
    .trim()
    .toLowerCase();

  const assignedAgentId =
    normalizeAssignedAgentId(item);

  return {
    id: item.id,
    name:
      item.customer_name ||
      item.name ||
      "Unknown Customer",

    initials: getInitials(
      item.customer_name ||
        item.name ||
        "Unknown Customer"
    ),

    preview:
      item.last_message ||
      item.last_message_text ||
      item.preview ||
      "No messages yet",

    date: dt.date,
    time: dt.time,

    unread:
      Number(item.unread_count || 0) > 0 ||
      item.unread === true ||
      item.is_unread === true,

    color:
      item.color ||
      COLOR_POOL[index % COLOR_POOL.length],

    status,

    customerPhone:
      item.customer_phone ||
      item.phone_number ||
      item.phone ||
      "",

    assignedAgentId,

    assignedAgentName:
      item.assigned_agent_name ||
      item.assignedAgentName ||
      item.agent_name ||
      item.agentName ||
      "",
  };
}

function isAssignedChat(chat) {
  return (
    chat.assignedAgentId !== null &&
    chat.assignedAgentId !== undefined &&
    chat.assignedAgentId !== "" &&
    chat.assignedAgentId !== "null" &&
    chat.assignedAgentId !== 0 &&
    chat.assignedAgentId !== "0"
  );
}

async function apiRequest(path, options = {}) {
  const response = await fetch(
    `${API_BASE}${path}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

export default function TeamInbox({
  page = "chat-inbox",
}) {
  const [chats, setChats] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [agents, setAgents] = useState([]);

  const [loadingChats, setLoadingChats] =
    useState(true);

  const [loadingAgents, setLoadingAgents] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [savingAgent, setSavingAgent] =
    useState(false);

  const [error, setError] = useState("");

  const [showAgentForm, setShowAgentForm] =
    useState(false);

  const [editingAgent, setEditingAgent] =
    useState(null);

  const [agentForm, setAgentForm] = useState({
    name: "",
    email: "",
    status: "Online",
    assignedChats: 0,
  });

  /*
   * ---------------------------------------------------------
   * LOAD AGENTS
   * ---------------------------------------------------------
   */

  const loadAgents = async () => {
    try {
      setLoadingAgents(true);
      setError("");

      const data = await apiRequest(
        "/api/team-inbox/agents"
      );

      setAgents(
        Array.isArray(data)
          ? data.map((agent) => ({
              ...agent,
              id: agent.id,
              assignedChats:
                Number(
                  agent.assignedChats ??
                    agent.assigned_chats ??
                    0
                ),
            }))
          : []
      );
    } catch (err) {
      console.error(
        "Team Inbox agents load error:",
        err
      );

      setError(err.message);
    } finally {
      setLoadingAgents(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * LOAD CHATS
   * ---------------------------------------------------------
   */

  const loadChats = async () => {
    try {
      setLoadingChats(true);
      setError("");

      let data = await apiRequest(
        "/api/team-inbox/chats"
      );

      /*
       * Only seed demo chats when database has
       * absolutely no chats.
       */
      if (
        Array.isArray(data) &&
        data.length === 0
      ) {
        for (const item of INITIAL_CHATS) {
          try {
            await apiRequest(
              "/api/team-inbox/chats",
              {
                method: "POST",
                body: JSON.stringify({
                  customer_name: item.name,
                  customer_phone: `demo-${item.id}`,
                  status:
                    item.status.toUpperCase(),
                  last_message: item.preview,
                }),
              }
            );
          } catch (seedError) {
            console.error(
              `Could not create demo chat ${item.id}:`,
              seedError
            );
          }
        }

        data = await apiRequest(
          "/api/team-inbox/chats"
        );
      }

      const mapped = Array.isArray(data)
        ? data.map((item, index) =>
            mapApiChat(item, index)
          )
        : [];

      setChats(mapped);

      /*
       * Do NOT automatically clear selected chat here.
       *
       * This is important for Unread Chats.
       * Once an unread chat is opened, it may no longer
       * match the unread filter, but the user should still
       * be able to see the conversation and send a message.
       */
      if (
        selected &&
        !mapped.some(
          (item) => item.id === selected
        )
      ) {
        setSelected(null);
      }
    } catch (err) {
      console.error(
        "Team Inbox chats load error:",
        err
      );

      setError(err.message);
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    loadAgents();
    loadChats();
  }, []);

  /*
   * ---------------------------------------------------------
   * LOAD MESSAGES
   * ---------------------------------------------------------
   */

  const loadMessages = async (chatId) => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    try {
      const data = await apiRequest(
        `/api/team-inbox/chats/${chatId}/messages`
      );

      setMessages(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Team Inbox messages load error:",
        err
      );

      setMessages([]);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }

    loadMessages(selected);

    /*
     * Mark the conversation read on the backend.
     *
     * IMPORTANT:
     * We do NOT immediately remove it from local
     * `chats`. This prevents the unread conversation
     * from disappearing while it is open.
     */
    apiRequest(
      `/api/team-inbox/chats/${selected}/read`,
      {
        method: "PUT",
      }
    ).catch((err) => {
      console.error(
        "Mark chat read error:",
        err
      );
    });
  }, [selected]);

  /*
   * ---------------------------------------------------------
   * FILTER + SEARCH
   * ---------------------------------------------------------
   */

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    return chats.filter((chat) => {
      const assignedAgent =
        agents.find(
          (agent) =>
            Number(agent.id) ===
            Number(chat.assignedAgentId)
        );

      const agentName = String(
        chat.assignedAgentName ||
          assignedAgent?.name ||
          ""
      ).toLowerCase();

      const searchMatch =
        !q ||
        String(chat.name || "")
          .toLowerCase()
          .includes(q) ||
        String(chat.preview || "")
          .toLowerCase()
          .includes(q) ||
        String(chat.customerPhone || "")
          .toLowerCase()
          .includes(q) ||
        agentName.includes(q);

      let filterMatch = true;

      switch (filter) {
        case "assign":
          filterMatch =
            isAssignedChat(chat);
          break;

        case "opened":
          filterMatch =
            chat.status === "opened";
          break;

        case "pending":
          filterMatch =
            chat.status === "pending";
          break;

        case "closed":
          filterMatch =
            chat.status === "closed";
          break;

        case "unassigned":
          filterMatch =
            !isAssignedChat(chat);
          break;

        case "read":
          /*
           * The UI says "Unread Chats".
           */
          filterMatch =
            chat.unread === true;
          break;

        case "custom":
          /*
           * Custom date picker is not yet connected.
           * Keep all chats visible until dates are selected.
           */
          filterMatch = true;
          break;

        case "all":
        default:
          filterMatch = true;
          break;
      }

      return (
        searchMatch &&
        filterMatch
      );
    });
  }, [
    chats,
    agents,
    filter,
    search,
  ]);

  /*
   * IMPORTANT:
   *
   * We intentionally DO NOT have the old:
   *
   *   if (!stillVisible) setSelected(null)
   *
   * here.
   *
   * That old logic caused the Unread conversation to
   * disappear immediately after it became read.
   */

  const chat = chats.find(
    (item) => item.id === selected
  );

  const unreadCount =
    chats.filter(
      (item) => item.unread
    ).length;

  /*
   * ---------------------------------------------------------
   * SEND MESSAGE
   * ---------------------------------------------------------
   */

  const sendMessage = async () => {
    const text = message.trim();

    if (
      !text ||
      !chat ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);
      setError("");

      await apiRequest(
        `/api/team-inbox/chats/${chat.id}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            message_text: text,
            sender_type: "AGENT",
            sender_name:
              "Team Inbox Agent",
            message_status: "SENT",
          }),
        }
      );

      setMessage("");

      await loadMessages(
        chat.id
      );

      await loadChats();
    } catch (err) {
      console.error(
        "Send Team Inbox message error:",
        err
      );

      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleMessageKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  /*
   * ---------------------------------------------------------
   * AGENT FORM
   * ---------------------------------------------------------
   */

  const openAddAgent = () => {
    setEditingAgent(null);

    setAgentForm({
      name: "",
      email: "",
      status: "Online",
      assignedChats: 0,
    });

    setShowAgentForm(true);
  };

  const openEditAgent = (
    agent
  ) => {
    setEditingAgent(agent);

    setAgentForm({
      name: agent.name || "",
      email: agent.email || "",
      status:
        agent.status ||
        "Online",
      assignedChats:
        agent.assignedChats || 0,
    });

    setShowAgentForm(true);
  };

  const closeAgentForm = () => {
    if (savingAgent) {
      return;
    }

    setShowAgentForm(false);
    setEditingAgent(null);
  };

  const saveAgent = async () => {
    const name =
      agentForm.name.trim();

    const email =
      agentForm.email.trim();

    if (!name) {
      alert(
        "Please enter agent name."
      );
      return;
    }

    if (!email) {
      alert(
        "Please enter agent email."
      );
      return;
    }

    try {
      setSavingAgent(true);
      setError("");

      const body = {
        name,
        email,
        status:
          agentForm.status,
        assignedChats:
          Number(
            agentForm.assignedChats
          ) || 0,
      };

      if (editingAgent) {
        await apiRequest(
          `/api/team-inbox/agents/${editingAgent.id}`,
          {
            method: "PUT",
            body: JSON.stringify(
              body
            ),
          }
        );
      } else {
        await apiRequest(
          "/api/team-inbox/agents",
          {
            method: "POST",
            body: JSON.stringify(
              body
            ),
          }
        );
      }

      await loadAgents();
      closeAgentForm();
    } catch (err) {
      console.error(
        "Save Team Inbox agent error:",
        err
      );

      setError(err.message);
    } finally {
      setSavingAgent(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * ASSIGN CHAT
   * ---------------------------------------------------------
   */

  const assignChat = async (
    agentId
  ) => {
    if (!chat) {
      return;
    }

    try {
      setError("");

      await apiRequest(
        `/api/team-inbox/chats/${chat.id}/assign`,
        {
          method: "PUT",
          body: JSON.stringify({
            assigned_agent_id:
              agentId,
          }),
        }
      );

      await loadChats();
    } catch (err) {
      console.error(
        "Assign chat error:",
        err
      );

      setError(err.message);
    }
  };

  /*
   * ---------------------------------------------------------
   * AGENT LIST
   * ---------------------------------------------------------
   */

  if (page === "agent-list") {
    return (
      <div className="ti-agent-page">
        {error && (
          <div className="ti-error">
            {error}

            <button
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>
          </div>
        )}

        <div className="ti-agent-heading">
          <div>
            <div className="ti-breadcrumb">
              Team Inbox / Agent List
            </div>

            <h1>
              Agent List
            </h1>

            <p>
              Manage the agents who
              handle conversations in
              Team Inbox.
            </p>
          </div>

          <button
            className="ti-primary"
            onClick={
              openAddAgent
            }
            disabled={
              loadingAgents
            }
          >
            + Add Agent
          </button>
        </div>

        <div className="ti-agent-card">
          <div className="ti-agent-row ti-agent-head">
            <span>
              Agent
            </span>

            <span>
              Email
            </span>

            <span>
              Status
            </span>

            <span>
              Assigned Chats
            </span>

            <span>
              Action
            </span>
          </div>

          {loadingAgents ? (
            <div className="ti-no-chats">
              Loading agents...
            </div>
          ) : (
            agents.map(
              (agent) => (
                <div
                  className="ti-agent-row"
                  key={agent.id}
                >
                  <strong>
                    <span className="ti-agent-avatar">
                      {getInitials(
                        agent.name
                      ).charAt(0)}
                    </span>

                    {agent.name}
                  </strong>

                  <span>
                    {agent.email}
                  </span>

                  <span
                    className={
                      agent.status ===
                      "Online"
                        ? "ti-online"
                        : "ti-offline"
                    }
                  >
                    {agent.status}
                  </span>

                  <span>
                    {
                      agent.assignedChats ||
                      0
                    }
                  </span>

                  <button
                    className="ti-edit"
                    onClick={() =>
                      openEditAgent(
                        agent
                      )
                    }
                  >
                    Edit
                  </button>
                </div>
              )
            )
          )}

          {!loadingAgents &&
            agents.length === 0 && (
              <div className="ti-no-chats">
                No agents found.
              </div>
            )}
        </div>

        {showAgentForm && (
          <div
            className="ti-modal-overlay"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeAgentForm();
              }
            }}
          >
            <div
              className="ti-modal"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="ti-modal-header">
                <div>
                  <h2>
                    {editingAgent
                      ? "Edit Agent"
                      : "Add Agent"}
                  </h2>

                  <p>
                    {editingAgent
                      ? "Update agent information."
                      : "Add a new Team Inbox agent."}
                  </p>
                </div>

                <button
                  className="ti-modal-close"
                  onClick={
                    closeAgentForm
                  }
                >
                  ×
                </button>
              </div>

              <div className="ti-form-group">
                <label>
                  Agent Name
                </label>

                <input
                  type="text"
                  value={
                    agentForm.name
                  }
                  onChange={(
                    event
                  ) =>
                    setAgentForm(
                      (previous) => ({
                        ...previous,
                        name:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Enter agent name"
                />
              </div>

              <div className="ti-form-group">
                <label>
                  Email
                </label>

                <input
                  type="email"
                  value={
                    agentForm.email
                  }
                  onChange={(
                    event
                  ) =>
                    setAgentForm(
                      (previous) => ({
                        ...previous,
                        email:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Enter agent email"
                />
              </div>

              <div className="ti-form-row">
                <div className="ti-form-group">
                  <label>
                    Status
                  </label>

                  <select
                    value={
                      agentForm.status
                    }
                    onChange={(
                      event
                    ) =>
                      setAgentForm(
                        (previous) => ({
                          ...previous,
                          status:
                            event.target
                              .value,
                        })
                      )
                    }
                  >
                    <option value="Online">
                      Online
                    </option>

                    <option value="Offline">
                      Offline
                    </option>
                  </select>
                </div>

                <div className="ti-form-group">
                  <label>
                    Assigned Chats
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      agentForm.assignedChats
                    }
                    onChange={(
                      event
                    ) =>
                      setAgentForm(
                        (previous) => ({
                          ...previous,
                          assignedChats:
                            event.target
                              .value,
                        })
                      )
                    }
                  />
                </div>
              </div>

              <div className="ti-modal-actions">
                <button
                  className="ti-cancel-button"
                  onClick={
                    closeAgentForm
                  }
                  disabled={
                    savingAgent
                  }
                >
                  Cancel
                </button>

                <button
                  className="ti-save-button"
                  onClick={
                    saveAgent
                  }
                  disabled={
                    savingAgent
                  }
                >
                  {savingAgent
                    ? "Saving..."
                    : editingAgent
                      ? "Update Agent"
                      : "Add Agent"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * CHAT INBOX
   * ---------------------------------------------------------
   */

  return (
    <div className="team-inbox-page">
      {error && (
        <div className="ti-error">
          {error}

          <button
            onClick={() =>
              setError("")
            }
          >
            ×
          </button>
        </div>
      )}

      <aside className="ti-sidebar">
        <div className="ti-account">
          <div className="ti-account-logo">
            ✓
          </div>

          <div>
            <strong>
              Unique
            </strong>

            <small>
              +919311945771
            </small>
          </div>

          <span>
            ⌄
          </span>
        </div>

        <div className="ti-title">
          Generic
        </div>

        <button
          className="ti-all"
          onClick={() => {
            setFilter("all");
            setSearch("");
          }}
        >
          All Chats
        </button>

        <div className="ti-title ti-conv-title">
          Conversations
        </div>

        {FILTERS.map(
          ([
            id,
            label,
            icon,
          ]) => (
            <button
              key={id}
              onClick={() =>
                setFilter(id)
              }
              className={`ti-filter ${
                filter === id
                  ? "active"
                  : ""
              }`}
            >
              <span>
                {icon}
              </span>

              {label}
            </button>
          )
        )}
      </aside>

      <section className="ti-list">
        <div className="ti-tabs">
          <button
            className={
              filter === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("all")
            }
          >
            All Chats{" "}
            <b>
              {chats.length}
            </b>
          </button>

          <button
            className={
              filter === "read"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("read")
            }
          >
            Unread{" "}
            <b>
              {unreadCount}
            </b>
          </button>

          <span>
            ▱
          </span>
        </div>

        <div className="ti-search">
          <span>
            ⌕
          </span>

          <input
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search..."
          />

          {search && (
            <button
              onClick={() =>
                setSearch("")
              }
            >
              ×
            </button>
          )}
        </div>

        <div className="ti-list-scroll">
          {loadingChats ? (
            <div className="ti-no-results">
              Loading chats...
            </div>
          ) : (
            visible.map(
              (item) => (
                <button
                  key={item.id}
                  className={`ti-chat ${
                    selected ===
                    item.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => {
                    /*
                     * IMPORTANT:
                     * Do not set unread=false here.
                     *
                     * That was the reason an unread chat
                     * immediately disappeared from the
                     * Unread filter.
                     *
                     * The backend read endpoint handles
                     * the read state.
                     */
                    setSelected(
                      item.id
                    );
                  }}
                >
                  <span
                    className={`ti-avatar ${item.color}`}
                  >
                    {item.initials.charAt(
                      0
                    )}
                  </span>

                  <span className="ti-chat-body">
                    <span className="ti-name">
                      <strong>
                        {item.name}
                      </strong>

                      <small>
                        {item.date}
                      </small>
                    </span>

                    <span
                      className={
                        item.unread
                          ? "unread"
                          : ""
                      }
                    >
                      {item.preview}
                    </span>

                    {item.assignedAgentName && (
                      <small className="ti-assigned-agent">
                        {
                          item.assignedAgentName
                        }
                      </small>
                    )}

                    <i>
                      ♟
                    </i>
                  </span>

                  {item.unread && (
                    <em />
                  )}
                </button>
              )
            )
          )}

          {!loadingChats &&
            !visible.length && (
              <div className="ti-no-results">
                No chats found.
              </div>
            )}
        </div>

        <div className="ti-footer">
          Showing{" "}
          {visible.length} of{" "}
          {chats.length}
        </div>
      </section>

      <main className="ti-main">
        {!chat ? (
          <div className="ti-empty">
            <div className="ti-illustration">
              <div className="ti-phone">
                <div>
                  ×
                </div>
              </div>

              <div className="ti-laptop">
                <div className="ti-check">
                  ✓
                </div>
              </div>
            </div>

            <h2>
              Team Inbox
            </h2>

            <p>
              An official business
              account has a green
              checkmark next to its
              name.
            </p>

            <p>
              This shows that WhatsApp
              has confirmed that an
              authentic and notable
              brand owns this account.
            </p>
          </div>
        ) : (
          <div className="ti-conversation">
            <header>
              <div
                className={`ti-avatar ${chat.color}`}
              >
                {chat.initials.charAt(
                  0
                )}
              </div>

              <div>
                <strong>
                  {chat.name}
                </strong>

                <small>
                  WhatsApp conversation
                </small>
              </div>

              <div className="ti-actions">
                <button
                  title="Assign"
                  onClick={() => {
                    if (
                      !agents.length
                    ) {
                      alert(
                        "Add an agent first from Agent List."
                      );
                      return;
                    }

                    /*
                     * Keep the current working
                     * assignment behavior.
                     */
                    assignChat(
                      agents[0].id
                    );
                  }}
                >
                  ♟
                </button>

                <button
                  title="More"
                  onClick={() =>
                    alert(
                      `Customer: ${
                        chat.customerPhone ||
                        "Not available"
                      }`
                    )
                  }
                >
                  ⋮
                </button>

                <button
                  title="Close"
                  onClick={() =>
                    setSelected(null)
                  }
                >
                  ×
                </button>
              </div>
            </header>

            <div className="ti-messages">
              <label>
                TODAY
              </label>

              {messages.length ===
              0 ? (
                <div className="ti-no-results">
                  No messages yet.
                </div>
              ) : (
                messages.map(
                  (item) => {
                    const isAgent =
                      String(
                        item.sender_type ||
                          ""
                      ).toUpperCase() ===
                      "AGENT";

                    const dt =
                      formatDateTime(
                        item.sent_at ||
                          item.created_at
                      );

                    return (
                      <div
                        className="ti-bubble"
                        key={item.id}
                        style={
                          isAgent
                            ? {
                                marginLeft:
                                  "auto",
                                borderRadius:
                                  "10px 5px 10px 10px",
                              }
                            : undefined
                        }
                      >
                        <span>
                          {
                            item.message_text
                          }
                        </span>

                        <small>
                          {dt.time}
                        </small>
                      </div>
                    );
                  }
                )
              )}
            </div>

            <div className="ti-composer">
              <button
                title="Attach"
                onClick={() =>
                  alert(
                    "Attachment feature can be connected later."
                  )
                }
              >
                ＋
              </button>

              <input
                value={message}
                onChange={(
                  event
                ) =>
                  setMessage(
                    event.target
                      .value
                  )
                }
                onKeyDown={
                  handleMessageKeyDown
                }
                placeholder="Type a message..."
                disabled={sending}
              />

              <button
                onClick={
                  sendMessage
                }
                disabled={
                  !message.trim() ||
                  sending
                }
                title="Send"
              >
                {sending
                  ? "…"
                  : "➤"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

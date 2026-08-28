import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_BASE = "http://localhost:5000";

const NODE_TYPES = {
  start: { title: "Flow Start", icon: "⌘", category: "Trigger" },
  text: { title: "Text Only", icon: "▢", category: "Message" },
  buttons: { title: "Text Buttons", icon: "▣", category: "Message" },
  media: { title: "Media Node", icon: "▧", category: "Message" },
  question: { title: "Ask Question", icon: "?", category: "Action" },
  askMedia: { title: "Ask Media", icon: "▧", category: "Action" },
  attribute: { title: "Set Attribute", icon: "$", category: "Action" },
};

const createId = (prefix = "node") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const makeNode = (type, x, y) => {
  const defaults = {
    start: { keyword: "", text: "" },
    text: { text: "Thanks for your response" },
    buttons: { text: "Choose an option", buttons: ["Yes", "No"] },
    media: { text: "", mediaUrl: "" },
    question: { question: "What is your name?", attribute: "name" },
    askMedia: { prompt: "Please send an image", attribute: "media" },
    attribute: { attribute: "status", value: "" },
  };

  return {
    id: createId(),
    type,
    x,
    y,
    data: defaults[type] || {},
  };
};

const initialNodes = [
  makeNode("start", 110, 130),
  makeNode("text", 520, 220),
];

const initialEdges = [
  { id: "edge-initial", source: initialNodes[0].id, target: initialNodes[1].id },
];

function AutomationFlowBuilder() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [flowId, setFlowId] = useState(null);
  const [flowName, setFlowName] = useState("RCS Demo");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [zoom, setZoom] = useState(1);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [dragging, setDragging] = useState(null);
  const canvasRef = useRef(null);

  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes]
  );

  const loadLatestFlow = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/automations/flows`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load automation flow");
      }

      if (Array.isArray(data) && data.length > 0) {
        const latest = data[0];
        const parsed = typeof latest.flow_data === "string"
          ? JSON.parse(latest.flow_data)
          : latest.flow_data;

        if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          setFlowId(latest.id);
          setFlowName(latest.flow_name || "RCS Demo");
          setMessage("Saved flow loaded from MySQL.");
        }
      } else {
        setMessage("New flow ready. Add nodes and save it.");
      }
    } catch (error) {
      console.error("Automation flow load error:", error);
      setMessage(`Unable to load saved flow: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLatestFlow();
  }, [loadLatestFlow]);

  const addNode = (type) => {
    const maxX = nodes.reduce((max, node) => Math.max(max, node.x), 80);
    const maxY = nodes.reduce((max, node) => Math.max(max, node.y), 100);
    const node = makeNode(type, Math.min(maxX + 60, 760), Math.min(maxY + 40, 560));
    setNodes((previous) => [...previous, node]);
    setMessage(`${NODE_TYPES[type].title} added.`);
  };

  const updateNode = (nodeId, patch) => {
    setNodes((previous) =>
      previous.map((node) =>
        node.id === nodeId
          ? { ...node, ...patch, data: { ...node.data, ...(patch.data || {}) } }
          : node
      )
    );
  };

  const deleteNode = (nodeId) => {
    setNodes((previous) => previous.filter((node) => node.id !== nodeId));
    setEdges((previous) =>
      previous.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
    setConnectingFrom(null);
  };

  const connectNodes = (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) {
      setConnectingFrom(null);
      return;
    }

    const alreadyExists = edges.some(
      (edge) => edge.source === sourceId && edge.target === targetId
    );

    if (!alreadyExists) {
      setEdges((previous) => [
        ...previous,
        { id: `edge-${Date.now()}`, source: sourceId, target: targetId },
      ]);
    }

    setConnectingFrom(null);
  };

  const handleHandleClick = (nodeId, side) => {
    if (side === "source") {
      setConnectingFrom(nodeId);
      setMessage("Connection started. Click a target handle on another node.");
      return;
    }

    if (connectingFrom) {
      connectNodes(connectingFrom, nodeId);
    }
  };

  const beginDrag = (event, nodeId) => {
    if (event.button !== 0) return;
    const node = nodeMap.get(nodeId);
    if (!node) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    setDragging({
      nodeId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: node.x,
      startY: node.y,
      canvasLeft: canvasRect.left,
      canvasTop: canvasRect.top,
    });

    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  useEffect(() => {
    const move = (event) => {
      if (!dragging) return;
      const dx = (event.clientX - dragging.startClientX) / zoom;
      const dy = (event.clientY - dragging.startClientY) / zoom;

      updateNode(dragging.nodeId, {
        x: Math.max(20, dragging.startX + dx),
        y: Math.max(20, dragging.startY + dy),
      });
    };

    const up = () => setDragging(null);

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, zoom]);

  const saveFlow = async () => {
    if (!flowName.trim()) {
      alert("Please enter a flow name.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload = {
        user_id: 1,
        flow_name: flowName.trim(),
        flow_data: { nodes, edges },
      };

      const url = flowId
        ? `${API_BASE}/api/automations/flows/${flowId}`
        : `${API_BASE}/api/automations/flows`;

      const response = await fetch(url, {
        method: flowId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Unable to save automation flow");
      }

      setFlowId(data.id || flowId);
      setMessage("Flow saved successfully to MySQL.");
    } catch (error) {
      console.error("Automation flow save error:", error);
      setMessage(`Unable to save flow: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const clearFlow = () => {
    const confirmed = window.confirm(
      "Clear the current flow? This only clears the editor. Click Save to overwrite the saved flow."
    );
    if (!confirmed) return;

    const freshNodes = [
      makeNode("start", 110, 130),
      makeNode("text", 520, 220),
    ];
    setNodes(freshNodes);
    setEdges([{ id: "edge-reset", source: freshNodes[0].id, target: freshNodes[1].id }]);
    setConnectingFrom(null);
    setMessage("Editor reset. Saved MySQL data has not been changed.");
  };

  const getNodeCenter = (node) => ({
    x: node.x + 115,
    y: node.y + 52,
  });

  return (
    <section
      style={{
        height: "calc(100vh - 92px)",
        minHeight: "650px",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 22px",
          borderBottom: "1px solid #e5e7eb",
          background: "#fff",
          gap: "16px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", color: "#0f172a" }}>
            Automation Flow Builder
          </h1>
          <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "13px" }}>
            Build and save a visual automation flow.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <input
            value={flowName}
            onChange={(event) => setFlowName(event.target.value)}
            placeholder="Flow name"
            style={{
              width: "180px",
              padding: "10px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: "7px",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={clearFlow}
            style={secondaryButton}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={saveFlow}
            disabled={saving || loading}
            style={primaryButton}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: "9px 22px",
            background: "#eff6ff",
            color: "#1d4ed8",
            borderBottom: "1px solid #dbeafe",
            fontSize: "13px",
          }}
        >
          {message}
        </div>
      )}

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div
          ref={canvasRef}
          style={{
            position: "relative",
            flex: 1,
            overflow: "auto",
            backgroundImage:
              "radial-gradient(#d8dee8 1px, transparent 1px)",
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundColor: "#fff",
          }}
          onClick={() => connectingFrom && setConnectingFrom(null)}
        >
          {loading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,.75)",
                color: "#475569",
              }}
            >
              Loading saved flow...
            </div>
          )}

          <div
            style={{
              position: "relative",
              width: `${1100 * zoom}px`,
              height: `${720 * zoom}px`,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <svg
              width="1100"
              height="720"
              style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
            >
              {edges.map((edge) => {
                const source = nodeMap.get(edge.source);
                const target = nodeMap.get(edge.target);
                if (!source || !target) return null;

                const sourceCenter = getNodeCenter(source);
                const targetCenter = getNodeCenter(target);
                const startX = source.x + 230;
                const startY = source.y + 52;
                const endX = target.x;
                const endY = targetCenter.y;
                const bend = Math.max(60, Math.abs(endX - startX) / 2);

                return (
                  <path
                    key={edge.id}
                    d={`M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>

            {nodes.map((node) => (
              <FlowNode
                key={node.id}
                node={node}
                connectingFrom={connectingFrom}
                onHandleClick={handleHandleClick}
                onDragStart={beginDrag}
                onDelete={deleteNode}
                onUpdate={updateNode}
              />
            ))}
          </div>

          <div
            style={{
              position: "fixed",
              left: "18px",
              bottom: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              background: "#fff",
              border: "1px solid #dbe2ea",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(15,23,42,.08)",
              overflow: "hidden",
            }}
          >
            <button type="button" onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(1)))} style={zoomButton}>+</button>
            <button type="button" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(1)))} style={zoomButton}>−</button>
            <button type="button" onClick={() => setZoom(1)} style={zoomButton}>⌗</button>
          </div>
        </div>

        <aside
          style={{
            width: "235px",
            flex: "0 0 235px",
            borderLeft: "1px solid #e5e7eb",
            background: "#fff",
            padding: "16px",
            overflowY: "auto",
          }}
        >
          <h3 style={{ margin: "4px 0 14px", color: "#334155", fontSize: "14px" }}>
            Message types
          </h3>

          <PaletteButton type="text" onClick={addNode} />
          <PaletteButton type="buttons" onClick={addNode} />
          <PaletteButton type="media" onClick={addNode} />

          <h3 style={{ margin: "22px 0 14px", color: "#334155", fontSize: "14px" }}>
            Actions
          </h3>

          <PaletteButton type="question" onClick={addNode} />
          <PaletteButton type="askMedia" onClick={addNode} />
          <PaletteButton type="attribute" onClick={addNode} />

          <div
            style={{
              marginTop: "22px",
              padding: "10px",
              borderRadius: "7px",
              background: "#f8fafc",
              color: "#64748b",
              fontSize: "12px",
              lineHeight: 1.5,
            }}
          >
            <strong>How to connect:</strong>
            <br />
            Click the small right handle of a node, then click the left handle of the destination node.
          </div>
        </aside>
      </div>
    </section>
  );
}

function PaletteButton({ type, onClick }) {
  const meta = NODE_TYPES[type];
  return (
    <button
      type="button"
      onClick={() => onClick(type)}
      style={{
        width: "100%",
        minHeight: "70px",
        marginBottom: "10px",
        padding: "10px",
        background: "#fff",
        border: "1px solid #dbe3ee",
        borderRadius: "9px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        color: "#334155",
      }}
    >
      <span style={{ fontSize: "22px", lineHeight: 1 }}>{meta.icon}</span>
      <span style={{ fontSize: "12px", fontWeight: 600 }}>{meta.title}</span>
    </button>
  );
}

function FlowNode({ node, connectingFrom, onHandleClick, onDragStart, onDelete, onUpdate }) {
  const meta = NODE_TYPES[node.type];
  const data = node.data || {};

  const setData = (key, value) =>
    onUpdate(node.id, { data: { [key]: value } });

  return (
    <div
      style={{
        position: "absolute",
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: "230px",
        minHeight: "104px",
        background: "#fff",
        border: connectingFrom === node.id ? "2px solid #2563eb" : "1px solid #dbe3ee",
        borderRadius: "8px",
        boxShadow: "0 3px 12px rgba(15,23,42,.08)",
        userSelect: "none",
      }}
    >
      <button
        type="button"
        title="Delete node"
        onClick={() => onDelete(node.id)}
        style={{
          position: "absolute",
          right: "7px",
          top: "5px",
          border: 0,
          background: "transparent",
          color: "#94a3b8",
          cursor: "pointer",
          fontSize: "14px",
          zIndex: 3,
        }}
      >
        ×
      </button>

      {node.type !== "start" && (
        <button
          type="button"
          title="Connect to this node"
          onClick={(event) => {
            event.stopPropagation();
            onHandleClick(node.id, "target");
          }}
          style={handleStyle("left", connectingFrom && connectingFrom !== node.id)}
        >
          0
        </button>
      )}

      <button
        type="button"
        title="Start connection"
        onClick={(event) => {
          event.stopPropagation();
          onHandleClick(node.id, "source");
        }}
        style={handleStyle("right", connectingFrom === node.id)}
      >
        0
      </button>

      <div
        onPointerDown={(event) => onDragStart(event, node.id)}
        style={{
          height: "38px",
          padding: "0 35px 0 12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "linear-gradient(90deg,#edf5ff,#f8fbff)",
          borderBottom: "1px solid #e5edf6",
          borderRadius: "8px 8px 0 0",
          cursor: "grab",
          touchAction: "none",
        }}
      >
        <span style={{ color: "#2563eb", fontWeight: 800 }}>{meta.icon}</span>
        <strong style={{ fontSize: "13px", color: "#334155" }}>{meta.title}</strong>
      </div>

      <div style={{ padding: "10px 12px", fontSize: "12px", color: "#475569" }}>
        {node.type === "start" && (
          <label style={fieldLabel}>
            Type, press enter to add keyword
            <input
              value={data.keyword || ""}
              onChange={(event) => setData("keyword", event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder="Enter keywords"
              style={nodeInput}
            />
          </label>
        )}

        {node.type === "text" && (
          <label style={fieldLabel}>
            Message
            <textarea
              value={data.text || ""}
              onChange={(event) => setData("text", event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              rows={2}
              style={{ ...nodeInput, resize: "vertical" }}
            />
          </label>
        )}

        {node.type === "buttons" && (
          <>
            <label style={fieldLabel}>
              Message
              <input value={data.text || ""} onChange={(event) => setData("text", event.target.value)} style={nodeInput} />
            </label>
            <label style={fieldLabel}>
              Buttons (comma separated)
              <input
                value={(data.buttons || []).join(", ")}
                onChange={(event) => setData("buttons", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))}
                style={nodeInput}
              />
            </label>
          </>
        )}

        {node.type === "media" && (
          <>
            <label style={fieldLabel}>
              Message
              <input value={data.text || ""} onChange={(event) => setData("text", event.target.value)} style={nodeInput} />
            </label>
            <label style={fieldLabel}>
              Media URL
              <input value={data.mediaUrl || ""} onChange={(event) => setData("mediaUrl", event.target.value)} style={nodeInput} />
            </label>
          </>
        )}

        {node.type === "question" && (
          <>
            <label style={fieldLabel}>
              Question
              <input value={data.question || ""} onChange={(event) => setData("question", event.target.value)} style={nodeInput} />
            </label>
            <label style={fieldLabel}>
              Save as
              <input value={data.attribute || ""} onChange={(event) => setData("attribute", event.target.value)} style={nodeInput} />
            </label>
          </>
        )}

        {node.type === "askMedia" && (
          <>
            <label style={fieldLabel}>
              Prompt
              <input value={data.prompt || ""} onChange={(event) => setData("prompt", event.target.value)} style={nodeInput} />
            </label>
            <label style={fieldLabel}>
              Save as
              <input value={data.attribute || ""} onChange={(event) => setData("attribute", event.target.value)} style={nodeInput} />
            </label>
          </>
        )}

        {node.type === "attribute" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            <input value={data.attribute || ""} onChange={(event) => setData("attribute", event.target.value)} placeholder="Attribute" style={nodeInput} />
            <input value={data.value || ""} onChange={(event) => setData("value", event.target.value)} placeholder="Value" style={nodeInput} />
          </div>
        )}
      </div>
    </div>
  );
}

const primaryButton = {
  border: 0,
  borderRadius: "7px",
  padding: "10px 20px",
  background: "#1746a2",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButton = {
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  padding: "9px 14px",
  background: "#fff",
  color: "#334155",
  cursor: "pointer",
  fontWeight: 600,
};

const zoomButton = {
  width: "34px",
  height: "30px",
  border: 0,
  background: "#fff",
  cursor: "pointer",
  color: "#475569",
  fontSize: "17px",
};

const nodeInput = {
  width: "100%",
  boxSizing: "border-box",
  marginTop: "5px",
  padding: "6px 7px",
  border: "1px solid #dbe3ee",
  borderRadius: "5px",
  background: "#fff",
  fontSize: "11px",
};

const fieldLabel = {
  display: "block",
  marginBottom: "7px",
  fontSize: "11px",
  fontWeight: 600,
  color: "#64748b",
};

const handleStyle = (side, active) => ({
  position: "absolute",
  [side]: "-7px",
  top: "47px",
  width: "14px",
  height: "14px",
  padding: 0,
  borderRadius: "50%",
  border: active ? "2px solid #2563eb" : "2px solid #fff",
  background: active ? "#2563eb" : "#64748b",
  color: "transparent",
  cursor: "crosshair",
  zIndex: 4,
});

export default AutomationFlowBuilder;

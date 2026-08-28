const express = require("express");
const router = express.Router();
const db = require("./db");

// =====================================================
// HELPERS
// =====================================================

function parseFlowData(flowData) {
    if (!flowData) {
        return {
            nodes: [],
            edges: []
        };
    }

    if (typeof flowData === "object") {
        return {
            nodes: Array.isArray(flowData.nodes)
                ? flowData.nodes
                : [],
            edges: Array.isArray(flowData.edges)
                ? flowData.edges
                : []
        };
    }

    if (typeof flowData === "string") {
        try {
            const parsed = JSON.parse(flowData);

            return {
                nodes: Array.isArray(parsed.nodes)
                    ? parsed.nodes
                    : [],
                edges: Array.isArray(parsed.edges)
                    ? parsed.edges
                    : []
            };
        } catch (error) {
            console.error(
                "Invalid automation flow JSON:",
                error
            );

            return {
                nodes: [],
                edges: []
            };
        }
    }

    return {
        nodes: [],
        edges: []
    };
}


// =====================================================
// GET TRIGGER KEYWORD FROM FLOW START NODE
// =====================================================

function getTriggerKeyword(flowData) {
    const parsed = parseFlowData(flowData);

    const startNode = parsed.nodes.find(
        (node) => node && node.type === "start"
    );

    return String(
        startNode?.data?.keyword || ""
    ).trim();
}


// =====================================================
// NORMALIZE FLOW BEFORE SAVING
// =====================================================

function normalizeFlowData(flowData) {
    const parsed = parseFlowData(flowData);

    return {
        nodes: parsed.nodes,
        edges: parsed.edges
    };
}


// =====================================================
// EXECUTE NODE
// =====================================================

function executeNode(
    matchedFlow,
    incomingMessage,
    targetNode
) {
    if (!targetNode) {
        return {
            matched: true,
            flow_id: matchedFlow.id,
            flow_name: matchedFlow.flow_name,
            trigger: incomingMessage,
            executed_node: null,
            response: null,
            message:
                "Connected automation node not found."
        };
    }


    // =================================================
    // TEXT NODE
    // =================================================

    if (targetNode.type === "text") {
        const text =
            targetNode.data?.text
                ? String(targetNode.data.text)
                : "";

        return {
            matched: true,

            flow_id: matchedFlow.id,

            flow_name:
                matchedFlow.flow_name,

            trigger:
                incomingMessage,

            executed_node: {
                id: targetNode.id,
                type: targetNode.type
            },

            response: text
        };
    }


    // =================================================
    // BUTTONS NODE
    // =================================================

    if (targetNode.type === "buttons") {
        const data =
            targetNode.data || {};

        const message =
            data.text ||
            data.message ||
            "";

        let buttons =
            data.buttons || [];

        if (typeof buttons === "string") {
            buttons = buttons
                .split(",")
                .map((button) => button.trim())
                .filter(Boolean);
        }

        return {
            matched: true,

            flow_id: matchedFlow.id,

            flow_name:
                matchedFlow.flow_name,

            trigger:
                incomingMessage,

            executed_node: {
                id: targetNode.id,
                type: targetNode.type
            },

            response: {
                message,
                buttons
            }
        };
    }


    // =================================================
    // MEDIA NODE
    // =================================================

    if (targetNode.type === "media") {
        const data =
            targetNode.data || {};

        return {
            matched: true,

            flow_id: matchedFlow.id,

            flow_name:
                matchedFlow.flow_name,

            trigger:
                incomingMessage,

            executed_node: {
                id: targetNode.id,
                type: targetNode.type
            },

            response: {
                message:
                    data.text || "",

                mediaUrl:
                    data.mediaUrl || ""
            }
        };
    }


    // =================================================
    // QUESTION NODE
    // =================================================

    if (targetNode.type === "question") {
        const data =
            targetNode.data || {};

        return {
            matched: true,

            flow_id: matchedFlow.id,

            flow_name:
                matchedFlow.flow_name,

            trigger:
                incomingMessage,

            executed_node: {
                id: targetNode.id,
                type: targetNode.type
            },

            response: {
                question:
                    data.question || "",

                attribute:
                    data.attribute || ""
            }
        };
    }


    // =================================================
    // ASK MEDIA NODE
    // =================================================

    if (targetNode.type === "askMedia") {
        const data =
            targetNode.data || {};

        return {
            matched: true,

            flow_id: matchedFlow.id,

            flow_name:
                matchedFlow.flow_name,

            trigger:
                incomingMessage,

            executed_node: {
                id: targetNode.id,
                type: targetNode.type
            },

            response: {
                prompt:
                    data.prompt || "",

                attribute:
                    data.attribute || ""
            }
        };
    }


    // =================================================
    // ATTRIBUTE NODE
    // =================================================

    if (targetNode.type === "attribute") {
        const data =
            targetNode.data || {};

        return {
            matched: true,

            flow_id: matchedFlow.id,

            flow_name:
                matchedFlow.flow_name,

            trigger:
                incomingMessage,

            executed_node: {
                id: targetNode.id,
                type: targetNode.type
            },

            response: {
                attribute:
                    data.attribute || "",

                value:
                    data.value || ""
            }
        };
    }


    // =================================================
    // UNKNOWN NODE
    // =================================================

    return {
        matched: true,

        flow_id: matchedFlow.id,

        flow_name:
            matchedFlow.flow_name,

        trigger:
            incomingMessage,

        executed_node: {
            id: targetNode.id,
            type: targetNode.type
        },

        response: null,

        message:
            `Automation matched, but node type "${targetNode.type}" is not implemented yet.`
    };
}


// =====================================================
// GET ALL FLOWS
// IMPORTANT:
// /flows ROUTES ARE BEFORE /:id ROUTES
// =====================================================


// =====================================================
// GET ALL FLOWS
// GET /api/automations/flows
// =====================================================

router.get(
    "/api/automations/flows",
    (req, res) => {
        const query = `
            SELECT
                id,
                user_id,
                flow_name,
                trigger_keyword,
                flow_data,
                status,
                created_at,
                updated_at
            FROM automation_flows
            ORDER BY id DESC
        `;

        db.query(
            query,
            (err, results) => {
                if (err) {
                    console.error(
                        "Automation flows query error:",
                        err
                    );

                    return res.status(500).json({
                        error: err.message
                    });
                }

                const flows = results.map(
                    (flow) => ({
                        ...flow,

                        flow_data:
                            parseFlowData(
                                flow.flow_data
                            )
                    })
                );

                return res.json(flows);
            }
        );
    }
);


// =====================================================
// GET SINGLE FLOW
// GET /api/automations/flows/:id
// =====================================================

router.get(
    "/api/automations/flows/:id",
    (req, res) => {
        const flowId =
            req.params.id;

        const query = `
            SELECT
                id,
                user_id,
                flow_name,
                trigger_keyword,
                flow_data,
                status,
                created_at,
                updated_at
            FROM automation_flows
            WHERE id = ?
        `;

        db.query(
            query,
            [flowId],
            (err, results) => {
                if (err) {
                    console.error(
                        "Automation flow query error:",
                        err
                    );

                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (results.length === 0) {
                    return res.status(404).json({
                        error:
                            "Automation flow not found"
                    });
                }

                const flow =
                    results[0];

                flow.flow_data =
                    parseFlowData(
                        flow.flow_data
                    );

                return res.json(flow);
            }
        );
    }
);


// =====================================================
// CREATE FLOW
// POST /api/automations/flows
// =====================================================

router.post(
    "/api/automations/flows",
    (req, res) => {
        const {
            user_id,
            flow_name,
            trigger_keyword,
            flow_data,
            status
        } = req.body;

        if (!flow_name) {
            return res.status(400).json({
                error:
                    "flow_name is required"
            });
        }

        if (!flow_data) {
            return res.status(400).json({
                error:
                    "flow_data is required"
            });
        }

        const normalizedFlow =
            normalizeFlowData(
                flow_data
            );

        // Prefer keyword coming from Flow Start node.
        const actualTrigger =
            getTriggerKeyword(
                normalizedFlow
            ) ||
            String(
                trigger_keyword || ""
            ).trim() ||
            null;

        const flowDataValue =
            JSON.stringify(
                normalizedFlow
            );

        const query = `
            INSERT INTO automation_flows
            (
                user_id,
                flow_name,
                trigger_keyword,
                flow_data,
                status
            )
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            query,
            [
                user_id || 1,
                flow_name.trim(),
                actualTrigger,
                flowDataValue,
                status || "DRAFT"
            ],
            (err, result) => {
                if (err) {
                    console.error(
                        "Automation flow insert error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            err.message
                    });
                }

                return res.status(201).json({
                    message:
                        "Automation flow created successfully",

                    id:
                        result.insertId,

                    user_id:
                        user_id || 1,

                    flow_name:
                        flow_name.trim(),

                    trigger_keyword:
                        actualTrigger,

                    status:
                        status || "DRAFT"
                });
            }
        );
    }
);


// =====================================================
// UPDATE FLOW
// PUT /api/automations/flows/:id
//
// THIS IS THE ENDPOINT USED BY
// AutomationFlowBuilder.jsx
// =====================================================

router.put(
    "/api/automations/flows/:id",
    (req, res) => {
        updateAutomationFlow(
            req,
            res
        );
    }
);


// =====================================================
// GET ALL AUTOMATIONS
// GET /api/automations
// =====================================================

router.get(
    "/api/automations",
    (req, res) => {
        const query = `
            SELECT
                id,
                user_id,
                flow_name,
                trigger_keyword,
                flow_data,
                status,
                created_at,
                updated_at
            FROM automation_flows
            ORDER BY id DESC
        `;

        db.query(
            query,
            (err, results) => {
                if (err) {
                    console.error(
                        "Automation flows query error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            err.message
                    });
                }

                const flows =
                    results.map(
                        (flow) => ({
                            ...flow,

                            flow_data:
                                parseFlowData(
                                    flow.flow_data
                                )
                        })
                    );

                return res.json(flows);
            }
        );
    }
);


// =====================================================
// GET SINGLE AUTOMATION
// GET /api/automations/:id
//
// KEEP THIS AFTER /flows ROUTES
// =====================================================

router.get(
    "/api/automations/:id",
    (req, res) => {
        const flowId =
            req.params.id;

        const query = `
            SELECT
                id,
                user_id,
                flow_name,
                trigger_keyword,
                flow_data,
                status,
                created_at,
                updated_at
            FROM automation_flows
            WHERE id = ?
        `;

        db.query(
            query,
            [flowId],
            (err, results) => {
                if (err) {
                    console.error(
                        "Automation flow query error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            err.message
                    });
                }

                if (results.length === 0) {
                    return res.status(404).json({
                        error:
                            "Automation flow not found"
                    });
                }

                const flow =
                    results[0];

                flow.flow_data =
                    parseFlowData(
                        flow.flow_data
                    );

                return res.json(flow);
            }
        );
    }
);


// =====================================================
// UPDATE AUTOMATION FLOW HELPER
// =====================================================

function updateAutomationFlow(
    req,
    res
) {
    const flowId =
        req.params.id;

    const {
        user_id,
        flow_name,
        trigger_keyword,
        flow_data,
        status
    } = req.body;

    let normalizedFlow = null;

    if (
        flow_data !== undefined &&
        flow_data !== null
    ) {
        normalizedFlow =
            normalizeFlowData(
                flow_data
            );
    }

    // -------------------------------------------------
    // Determine trigger keyword
    // -------------------------------------------------

    let actualTrigger =
        trigger_keyword !== undefined
            ? String(
                  trigger_keyword || ""
              ).trim()
            : null;

    if (normalizedFlow) {
        const nodeKeyword =
            getTriggerKeyword(
                normalizedFlow
            );

        if (nodeKeyword) {
            actualTrigger =
                nodeKeyword;
        }
    }

    const flowDataValue =
        normalizedFlow
            ? JSON.stringify(
                  normalizedFlow
              )
            : null;

    const query = `
        UPDATE automation_flows
        SET
            user_id =
                COALESCE(?, user_id),

            flow_name =
                COALESCE(?, flow_name),

            trigger_keyword =
                COALESCE(?, trigger_keyword),

            flow_data =
                COALESCE(?, flow_data),

            status =
                COALESCE(?, status)

        WHERE id = ?
    `;

    db.query(
        query,
        [
            user_id !== undefined
                ? user_id
                : null,

            flow_name
                ? flow_name.trim()
                : null,

            actualTrigger !== null
                ? actualTrigger || null
                : null,

            flowDataValue,

            status
                ? status
                : null,

            flowId
        ],
        (err, result) => {
            if (err) {
                console.error(
                    "Automation flow update error:",
                    err
                );

                return res.status(500).json({
                    error:
                        err.message
                });
            }

            if (
                result.affectedRows === 0
            ) {
                return res.status(404).json({
                    error:
                        "Automation flow not found"
                });
            }

            return res.json({
                message:
                    "Automation flow updated successfully",

                id:
                    Number(flowId),

                trigger_keyword:
                    actualTrigger,

                status:
                    status || null
            });
        }
    );
}


// =====================================================
// OLD UPDATE ENDPOINT
// PUT /api/automations/:id
//
// KEPT FOR BACKWARD COMPATIBILITY
// =====================================================

router.put(
    "/api/automations/:id",
    (req, res) => {
        updateAutomationFlow(
            req,
            res
        );
    }
);


// =====================================================
// OLD CREATE ENDPOINT
// POST /api/automations
//
// KEPT FOR BACKWARD COMPATIBILITY
// =====================================================

router.post(
    "/api/automations",
    (req, res) => {
        const {
            user_id,
            flow_name,
            trigger_keyword,
            flow_data,
            status
        } = req.body;

        if (!flow_name) {
            return res.status(400).json({
                error:
                    "flow_name is required"
            });
        }

        if (!flow_data) {
            return res.status(400).json({
                error:
                    "flow_data is required"
            });
        }

        const normalizedFlow =
            normalizeFlowData(
                flow_data
            );

        const actualTrigger =
            getTriggerKeyword(
                normalizedFlow
            ) ||
            String(
                trigger_keyword || ""
            ).trim() ||
            null;

        const flowDataValue =
            JSON.stringify(
                normalizedFlow
            );

        const query = `
            INSERT INTO automation_flows
            (
                user_id,
                flow_name,
                trigger_keyword,
                flow_data,
                status
            )
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            query,
            [
                user_id || 1,
                flow_name.trim(),
                actualTrigger,
                flowDataValue,
                status || "DRAFT"
            ],
            (err, result) => {
                if (err) {
                    console.error(
                        "Automation flow insert error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            err.message
                    });
                }

                return res.status(201).json({
                    message:
                        "Automation flow created successfully",

                    id:
                        result.insertId,

                    user_id:
                        user_id || 1,

                    flow_name:
                        flow_name.trim(),

                    trigger_keyword:
                        actualTrigger,

                    status:
                        status || "DRAFT"
                });
            }
        );
    }
);


// =====================================================
// DELETE AUTOMATION FLOW
// DELETE /api/automations/:id
// =====================================================

router.delete(
    "/api/automations/:id",
    (req, res) => {
        const flowId =
            req.params.id;

        const query = `
            DELETE FROM automation_flows
            WHERE id = ?
        `;

        db.query(
            query,
            [flowId],
            (err, result) => {
                if (err) {
                    console.error(
                        "Automation flow delete error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            err.message
                    });
                }

                if (
                    result.affectedRows === 0
                ) {
                    return res.status(404).json({
                        error:
                            "Automation flow not found"
                    });
                }

                return res.json({
                    message:
                        "Automation flow deleted successfully",

                    id:
                        Number(flowId)
                });
            }
        );
    }
);


// =====================================================
// AUTOMATION EXECUTION TEST
//
// POST /api/automations/test
//
// BODY:
//
// {
//     "message": "menu",
//     "user_id": 1
// }
//
// OR:
//
// {
//     "message": "Pricing",
//     "user_id": 1
// }
//
// =====================================================

router.post(
    "/api/automations/test",
    (req, res) => {
        const {
            message,
            user_id
        } = req.body;

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (
            !message ||
            typeof message !== "string"
        ) {
            return res.status(400).json({
                error:
                    "message is required"
            });
        }

        const incomingMessage =
            message.trim();

        if (!incomingMessage) {
            return res.status(400).json({
                error:
                    "message cannot be empty"
            });
        }


        // -------------------------------------------------
        // GET ACTIVE / DRAFT FLOWS
        // -------------------------------------------------

        const query = `
            SELECT
                id,
                user_id,
                flow_name,
                trigger_keyword,
                flow_data,
                status
            FROM automation_flows
            WHERE
                status = 'DRAFT'
                OR status = 'ACTIVE'
            ORDER BY id DESC
        `;

        db.query(
            query,
            (err, flows) => {
                if (err) {
                    console.error(
                        "Automation execution query error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            err.message
                    });
                }


                // =================================================
                // STEP 1
                // MATCH FLOW START KEYWORD
                // =================================================

                for (
                    const flow of flows
                ) {
                    // User filtering
                    if (
                        user_id &&
                        Number(flow.user_id) !==
                            Number(user_id)
                    ) {
                        continue;
                    }

                    const flowData =
                        parseFlowData(
                            flow.flow_data
                        );

                    const nodes =
                        flowData.nodes;

                    const edges =
                        flowData.edges;

                    // ---------------------------------------------
                    // FIND START NODE
                    // ---------------------------------------------

                    const startNode =
                        nodes.find(
                            (node) =>
                                node.type ===
                                "start"
                        );

                    if (!startNode) {
                        continue;
                    }

                    // ---------------------------------------------
                    // GET KEYWORD
                    // ---------------------------------------------

                    const keyword =
                        String(
                            startNode.data?.keyword ||
                                flow.trigger_keyword ||
                                ""
                        ).trim();

                    if (!keyword) {
                        continue;
                    }

                    // ---------------------------------------------
                    // MATCH KEYWORD
                    // ---------------------------------------------

                    if (
                        keyword.toLowerCase() !==
                        incomingMessage.toLowerCase()
                    ) {
                        continue;
                    }

                    // ---------------------------------------------
                    // FIND NEXT EDGE
                    // ---------------------------------------------

                    const nextEdge =
                        edges.find(
                            (edge) =>
                                edge.source ===
                                startNode.id
                        );

                    if (!nextEdge) {
                        return res.json({
                            matched: true,

                            flow_id:
                                flow.id,

                            flow_name:
                                flow.flow_name,

                            trigger:
                                incomingMessage,

                            response: null,

                            message:
                                "Automation matched, but Flow Start has no connected node."
                        });
                    }

                    // ---------------------------------------------
                    // FIND TARGET NODE
                    // ---------------------------------------------

                    const targetNode =
                        nodes.find(
                            (node) =>
                                node.id ===
                                nextEdge.target
                        );

                    if (!targetNode) {
                        return res.status(500).json({
                            error:
                                "Connected automation node not found."
                        });
                    }

                    // ---------------------------------------------
                    // EXECUTE NODE
                    // ---------------------------------------------

                    return res.json(
                        executeNode(
                            flow,
                            incomingMessage,
                            targetNode
                        )
                    );
                }


                // =================================================
                // STEP 2
                // MATCH BUTTON BRANCHES
                // =================================================

                for (
                    const flow of flows
                ) {
                    // User filtering
                    if (
                        user_id &&
                        Number(flow.user_id) !==
                            Number(user_id)
                    ) {
                        continue;
                    }

                    const flowData =
                        parseFlowData(
                            flow.flow_data
                        );

                    const nodes =
                        flowData.nodes;

                    const edges =
                        flowData.edges;

                    // ---------------------------------------------
                    // FIND BUTTON NODES
                    // ---------------------------------------------

                    const buttonNodes =
                        nodes.filter(
                            (node) =>
                                node.type ===
                                "buttons"
                        );

                    for (
                        const buttonNode of buttonNodes
                    ) {
                        const buttonData =
                            buttonNode.data ||
                            {};

                        let buttons =
                            buttonData.buttons ||
                            [];

                        if (
                            typeof buttons ===
                            "string"
                        ) {
                            buttons =
                                buttons
                                    .split(",")
                                    .map(
                                        (button) =>
                                            button.trim()
                                    )
                                    .filter(Boolean);
                        }

                        // -----------------------------------------
                        // CHECK SELECTED BUTTON
                        // -----------------------------------------

                        const selectedButton =
                            buttons.find(
                                (button) =>
                                    String(button)
                                        .trim()
                                        .toLowerCase() ===
                                    incomingMessage
                                        .toLowerCase()
                            );

                        if (!selectedButton) {
                            continue;
                        }

                        // -----------------------------------------
                        // GET ALL OUTGOING EDGES
                        // -----------------------------------------

                        const outgoingEdges =
                            edges.filter(
                                (edge) =>
                                    edge.source ===
                                    buttonNode.id
                            );

                        // -----------------------------------------
                        // FIRST:
                        // FIND EDGE USING edge.button
                        // -----------------------------------------

                        let branchEdge =
                            outgoingEdges.find(
                                (edge) =>
                                    edge.button &&
                                    String(
                                        edge.button
                                    )
                                        .trim()
                                        .toLowerCase() ===
                                    String(
                                        selectedButton
                                    )
                                        .trim()
                                        .toLowerCase()
                            );

                        // -----------------------------------------
                        // BACKWARD COMPATIBILITY
                        //
                        // Old saved flows may not have
                        // edge.button.
                        //
                        // In that case use the order:
                        //
                        // buttons[0] -> outgoingEdges[0]
                        // buttons[1] -> outgoingEdges[1]
                        // buttons[2] -> outgoingEdges[2]
                        // -----------------------------------------

                        if (!branchEdge) {
                            const buttonIndex =
                                buttons.findIndex(
                                    (button) =>
                                        String(
                                            button
                                        )
                                            .trim()
                                            .toLowerCase() ===
                                        String(
                                            selectedButton
                                        )
                                            .trim()
                                            .toLowerCase()
                                );

                            if (
                                buttonIndex >= 0
                            ) {
                                branchEdge =
                                    outgoingEdges[
                                        buttonIndex
                                    ] || null;
                            }
                        }

                        // -----------------------------------------
                        // NO BRANCH
                        // -----------------------------------------

                        if (!branchEdge) {
                            return res.json({
                                matched: true,

                                flow_id:
                                    flow.id,

                                flow_name:
                                    flow.flow_name,

                                trigger:
                                    incomingMessage,

                                executed_node: {
                                    id:
                                        buttonNode.id,

                                    type:
                                        buttonNode.type
                                },

                                response: null,

                                message:
                                    `Button "${selectedButton}" was found, but it has no connected automation node.`
                            });
                        }

                        // -----------------------------------------
                        // FIND TARGET NODE
                        // -----------------------------------------

                        const targetNode =
                            nodes.find(
                                (node) =>
                                    node.id ===
                                    branchEdge.target
                            );

                        if (!targetNode) {
                            return res.status(500).json({
                                error:
                                    `Target node for button "${selectedButton}" was not found.`
                            });
                        }

                        // -----------------------------------------
                        // EXECUTE TARGET
                        // -----------------------------------------

                        return res.json(
                            executeNode(
                                flow,
                                incomingMessage,
                                targetNode
                            )
                        );
                    }
                }


                // =================================================
                // NO MATCH
                // =================================================

                return res.json({
                    matched: false,

                    message:
                        "No automation flow matched this message.",

                    input:
                        incomingMessage
                });
            }
        );
    }
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./db");
const whatsappRoutes = require("./whatsappRoutes");

console.log(
    "LOADED WHATSAPP ROUTES FROM:",
    require.resolve("./whatsappRoutes")
);
const smsRoutes = require("./smsRoutes");
const rcsRoutes = require("./rcsRoutes");
const automationRoutes = require("./automationRoutes");
const rcsBroadcastRoutes = require("./rcsBroadcastRoutes");
const apiKeyRoutes = require("./apiKeyRoutes");

dotenv.config();

const app = express();
const PORT = 5000;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());

app.use(whatsappRoutes);
app.use(smsRoutes);
app.use(rcsRoutes);
app.use(automationRoutes);
app.use(rcsBroadcastRoutes);
app.use(apiKeyRoutes);

// =====================================================
// API KEY AUTHENTICATION
// =====================================================

function authenticateApiKey(req, res, next) {

    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
        return res.status(401).json({
            error: "API key is required"
        });
    }

    db.query(
        "SELECT * FROM api_keys WHERE api_key = ? AND status = 'ACTIVE'",
        [apiKey],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    error: "Invalid API key"
                });
            }

            req.user = {
                id: results[0].user_id,
                api_key_id: results[0].id
            };

            next();
        }
    );
}

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {

    res.json({
        message: "Omnichannel CPaaS Backend is running"
    });

});

// =====================================================
// TEST MESSAGES
// =====================================================

app.get("/api/test-messages", (req, res) => {

    db.query(
        "SELECT * FROM test_messages ORDER BY id DESC",
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(results);

        }
    );

});

// =====================================================
// ALL MESSAGES
// =====================================================

app.get("/api/messages", (req, res) => {

    db.query(
        "SELECT * FROM test_messages ORDER BY id DESC",
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(results);

        }
    );

});

// =====================================================
// MESSAGE BY ID
// =====================================================

app.get("/api/messages/:id", (req, res) => {

    const id = req.params.id;

    db.query(
        "SELECT * FROM test_messages WHERE id = ?",
        [id],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    error: "Message not found"
                });
            }

            res.json(results[0]);

        }
    );

});

// =====================================================
// CREATE MESSAGE
// =====================================================

app.post("/api/messages", (req, res) => {

    const { message, status } = req.body;

    if (!message) {
        return res.status(400).json({
            error: "Message is required"
        });
    }

    db.query(
        "INSERT INTO test_messages (message, status) VALUES (?, ?)",
        [message, status || "RECEIVED"],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Message stored successfully",
                id: result.insertId
            });

        }
    );

});

// =====================================================
// DEVELOPER API TEST
// =====================================================

app.get(
    "/api/developer/test",
    authenticateApiKey,
    (req, res) => {

        res.json({
            message: "API key is valid",
            user_id: req.user.id,
            api_key_id: req.user.api_key_id
        });

    }
);

// =====================================================
// SMS SEND API
// =====================================================

app.post(
    "/api/sms/send",
    authenticateApiKey,
    (req, res) => {

        const {
            phone_number,
            message,
            sender_id,
            campaign_name
        } = req.body;

        if (!phone_number) {
            return res.status(400).json({
                error: "Phone number is required"
            });
        }

        if (!message) {
            return res.status(400).json({
                error: "Message is required"
            });
        }

        db.query(
            `INSERT INTO sms_messages
            (
                user_id,
                sender_id,
                phone_number,
                message,
                status,
                campaign_name
            )
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                sender_id || null,
                phone_number,
                message,
                "QUEUED",
                campaign_name || null
            ],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                res.status(201).json({
                    message: "SMS queued successfully",
                    sms_id: result.insertId,
                    user_id: req.user.id,
                    phone_number: phone_number,
                    status: "QUEUED"
                });

            }
        );

    }
);

// =====================================================
// GET ALL SMS CAMPAIGNS
// =====================================================

app.get(
    "/api/sms/campaigns",
    authenticateApiKey,
    (req, res) => {

        db.query(
            `
            SELECT
                c.id,
                c.campaign_name,
                c.gateway,
                c.status,
                c.total_recipients,
                c.created_at,
                s.sender_id,
                t.template_name
            FROM sms_campaigns c
            JOIN sms_sender_ids s
                ON c.sender_id = s.id
            JOIN sms_templates t
                ON c.template_id = t.id
            WHERE c.user_id = ?
            ORDER BY c.id DESC
            `,
            [req.user.id],
            (err, results) => {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                res.json(results);

            }
        );

    }
);

// =====================================================
// GET SINGLE SMS CAMPAIGN
// =====================================================

app.get(
    "/api/sms/campaigns/:id",
    authenticateApiKey,
    (req, res) => {

        const campaignId = req.params.id;

        db.query(
            `
            SELECT
                c.id,
                c.campaign_name,
                c.gateway,
                c.status,
                c.total_recipients,
                c.created_at,
                s.sender_id,
                t.template_name,
                t.template_content
            FROM sms_campaigns c
            JOIN sms_sender_ids s
                ON c.sender_id = s.id
            JOIN sms_templates t
                ON c.template_id = t.id
            WHERE c.id = ?
            AND c.user_id = ?
            `,
            [campaignId, req.user.id],
            (err, campaignResults) => {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (campaignResults.length === 0) {
                    return res.status(404).json({
                        error: "Campaign not found"
                    });
                }

                const campaign = campaignResults[0];

                db.query(
                    `
                    SELECT
                        id,
                        phone_number,
                        recipient_name,
                        status,
                        created_at
                    FROM sms_campaign_recipients
                    WHERE campaign_id = ?
                    ORDER BY id
                    `,
                    [campaignId],
                    (err, recipientResults) => {

                        if (err) {
                            return res.status(500).json({
                                error: err.message
                            });
                        }

                        res.json({
                            campaign: campaign,
                            recipients: recipientResults
                        });

                    }
                );

            }
        );

    }
);

// =====================================================
// SEND SMS CAMPAIGN
// =====================================================

app.post(
    "/api/sms/campaigns/:id/send",
    authenticateApiKey,
    (req, res) => {

        const campaignId = req.params.id;

        db.query(
            `
            SELECT
                c.id,
                c.user_id,
                c.campaign_name,
                c.status,
                c.sender_id,
                c.template_id,

                s.sender_id AS sender_name,
                s.status AS sender_status,

                t.template_name,
                t.template_content,
                t.template_type,
                t.status AS template_status

            FROM sms_campaigns c

            JOIN sms_sender_ids s
                ON c.sender_id = s.id

            JOIN sms_templates t
                ON c.template_id = t.id

            WHERE c.id = ?
            AND c.user_id = ?
            `,
            [campaignId, req.user.id],
            (err, campaignResults) => {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (campaignResults.length === 0) {
                    return res.status(404).json({
                        error: "Campaign not found"
                    });
                }

                const campaign = campaignResults[0];

                if (campaign.status === "SENT") {
                    return res.status(400).json({
                        error: "Campaign has already been sent"
                    });
                }

                if (campaign.sender_status !== "ACTIVE") {
                    return res.status(400).json({
                        error: "Sender ID is not active"
                    });
                }

                if (campaign.template_status !== "APPROVED") {
                    return res.status(400).json({
                        error: "SMS template is not approved"
                    });
                }

                db.query(
                    `
                    SELECT
                        id,
                        phone_number,
                        recipient_name,
                        status
                    FROM sms_campaign_recipients
                    WHERE campaign_id = ?
                    `,
                    [campaignId],
                    (err, recipients) => {

                        if (err) {
                            return res.status(500).json({
                                error: err.message
                            });
                        }

                        if (recipients.length === 0) {
                            return res.status(400).json({
                                error: "No recipients found for this campaign"
                            });
                        }

                        let processed = 0;

                        recipients.forEach((recipient) => {

                            db.query(
                                `
                                UPDATE sms_campaign_recipients
                                SET status = 'SENT'
                                WHERE id = ?
                                `,
                                [recipient.id],
                                (err) => {

                                    if (err) {
                                        return res.status(500).json({
                                            error: err.message
                                        });
                                    }

                                    processed++;

                                    if (processed === recipients.length) {

                                        db.query(
                                            `
                                            UPDATE sms_campaigns
                                            SET
                                                status = 'SENT',
                                                total_recipients = ?
                                            WHERE id = ?
                                            `,
                                            [
                                                recipients.length,
                                                campaignId
                                            ],
                                            (err) => {

                                                if (err) {
                                                    return res.status(500).json({
                                                        error: err.message
                                                    });
                                                }

                                                res.json({

                                                    message:
                                                        "SMS campaign sent successfully",

                                                    campaign_id:
                                                        campaignId,

                                                    campaign_name:
                                                        campaign.campaign_name,

                                                    sender_id:
                                                        campaign.sender_name,

                                                    template:
                                                        campaign.template_name,

                                                    total_recipients:
                                                        recipients.length,

                                                    status: "SENT",

                                                    recipients:
                                                        recipients.map((r) => ({
                                                            name: r.recipient_name,
                                                            phone_number:
                                                                r.phone_number,
                                                            status: "SENT"
                                                        }))

                                                });

                                            }
                                        );

                                    }

                                }
                            );

                        });

                    }
                );

            }
        );

    }
);

// =====================================================
// SMS CAMPAIGN REPORT
// =====================================================

app.get(
    "/api/sms/campaigns/:id/report",
    authenticateApiKey,
    (req, res) => {

        const campaignId = req.params.id;

        db.query(
            `
            SELECT
                c.id AS campaign_id,
                c.campaign_name,

                COUNT(d.id) AS total_recipients,

                SUM(
                    CASE
                        WHEN d.status = 'SENT'
                        THEN 1
                        ELSE 0
                    END
                ) AS sent,

                SUM(
                    CASE
                        WHEN d.status = 'DELIVERED'
                        THEN 1
                        ELSE 0
                    END
                ) AS delivered,

                SUM(
                    CASE
                        WHEN d.status = 'FAILED'
                        THEN 1
                        ELSE 0
                    END
                ) AS failed,

                SUM(
                    CASE
                        WHEN d.status = 'PENDING'
                        THEN 1
                        ELSE 0
                    END
                ) AS pending

            FROM sms_campaigns c

            LEFT JOIN sms_delivery_logs d
                ON c.id = d.campaign_id

            WHERE c.id = ?
            AND c.user_id = ?

            GROUP BY
                c.id,
                c.campaign_name
            `,
            [campaignId, req.user.id],
            (err, results) => {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (results.length === 0) {
                    return res.status(404).json({
                        error: "Campaign report not found"
                    });
                }

                res.json({
                    campaign_id: results[0].campaign_id,
                    campaign_name: results[0].campaign_name,
                    total_recipients: Number(results[0].total_recipients),
                    sent: Number(results[0].sent),
                    delivered: Number(results[0].delivered),
                    failed: Number(results[0].failed),
                    pending: Number(results[0].pending)
                });

            }
        );

    }
);

// =====================================================
// WHATSAPP DASHBOARD STATISTICS
// =====================================================

app.get("/api/whatsapp/dashboard", (req, res) => {

    const query = `
        SELECT

            (SELECT COUNT(*)
             FROM whatsapp_campaign_recipients)
            AS total_initiated,

            (SELECT COUNT(*)
             FROM whatsapp_delivery_logs)
            AS total_sent,

            (SELECT COUNT(*)
             FROM whatsapp_delivery_logs
             WHERE status = 'DELIVERED')
            AS total_delivered,

            (SELECT COUNT(*)
             FROM whatsapp_delivery_logs
             WHERE status = 'READ')
            AS total_read,

            (SELECT COUNT(*)
             FROM whatsapp_delivery_logs
             WHERE status = 'FAILED')
            AS total_failed
    `;

    db.query(query, (err, results) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        const data = results[0];

        res.json({
            totalInitiated: Number(data.total_initiated),
            totalSent: Number(data.total_sent),
            totalDelivered: Number(data.total_delivered),
            totalRead: Number(data.total_read),
            totalFailed: Number(data.total_failed)
        });

    });

});

// =====================================================
// WHATSAPP MESSAGE DETAILS
// =====================================================

app.get("/api/whatsapp/messages", (req, res) => {

    const query = `
        SELECT
            r.id AS recipient_id,
            r.campaign_id,
            r.phone_number,
            r.recipient_name,

            d.id AS delivery_log_id,
            d.provider_message_id,
            d.status,
            d.delivered_at,
            d.failure_reason,
            d.created_at

        FROM whatsapp_campaign_recipients r

        LEFT JOIN whatsapp_delivery_logs d
            ON r.id = d.recipient_id

        ORDER BY r.id DESC
    `;

    db.query(query, (err, results) => {

        if (err) {
            console.error(
                "WhatsApp messages query error:",
                err
            );

            return res.status(500).json({
                error: err.message
            });
        }

        res.json(results);

    });

});


// =====================================================
// TEAM INBOX - HELPERS
// =====================================================

function getTeamInboxUserId(req) {
    const value =
        req.headers["x-user-id"] ||
        req.query.user_id ||
        (req.body && req.body.user_id);

    const userId = Number(value);

    // Temporary demo user.
    // Later we can connect this to your actual login system.
    return Number.isInteger(userId) && userId > 0 ? userId : 1;
}


// =====================================================
// TEAM INBOX - AGENTS
// =====================================================

// GET ALL AGENTS
// =====================================================
// TEAM INBOX - AGENTS
// =====================================================

app.get(
    "/api/team-inbox/agents",
    (req, res) => {

        const userId =
            getTeamInboxUserId(req);

        /*
         * assigned_chats is calculated from the
         * actual team_inbox_chats table.
         *
         * We do NOT trust the manually stored
         * assigned_chats value anymore.
         */
        const query = `
            SELECT
                a.id,
                a.user_id,
                a.name,
                a.email,
                a.status,
                COUNT(c.id) AS assigned_chats,
                a.created_at,
                a.updated_at

            FROM team_inbox_agents a

            LEFT JOIN team_inbox_chats c
                ON c.assigned_agent_id = a.id
                AND c.user_id = a.user_id

            WHERE a.user_id = ?

            GROUP BY
                a.id,
                a.user_id,
                a.name,
                a.email,
                a.status,
                a.created_at,
                a.updated_at

            ORDER BY
                a.id ASC
        `;

        db.query(
            query,
            [userId],
            (err, results) => {

                if (err) {

                    console.error(
                        "Team Inbox agents GET error:",
                        err
                    );

                    return res.status(500).json({
                        error: err.message
                    });
                }

                res.json(
                    results.map(
                        (agent) => ({
                            ...agent,

                            assignedChats:
                                Number(
                                    agent.assigned_chats ||
                                    0
                                )
                        })
                    )
                );
            }
        );
    }
);

// ADD AGENT
app.post("/api/team-inbox/agents", (req, res) => {

    const userId = getTeamInboxUserId(req);

    const {
        name,
        email,
        status,
        assignedChats
    } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            error: "Agent name is required"
        });
    }

    if (!email || !email.trim()) {
        return res.status(400).json({
            error: "Agent email is required"
        });
    }

    db.query(
        `
        INSERT INTO team_inbox_agents
        (
            user_id,
            name,
            email,
            status,
            assigned_chats
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            userId,
            name.trim(),
            email.trim(),
            status || "Online",
            Number(assignedChats) || 0
        ],
        (err, result) => {

            if (err) {
                console.error(
                    "Team Inbox agent POST error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Agent added successfully",
                agent_id: result.insertId
            });
        }
    );
});


// UPDATE AGENT
app.put("/api/team-inbox/agents/:id", (req, res) => {

    const userId = getTeamInboxUserId(req);
    const agentId = Number(req.params.id);

    const {
        name,
        email,
        status,
        assignedChats
    } = req.body;

    if (!Number.isInteger(agentId) || agentId <= 0) {
        return res.status(400).json({
            error: "Invalid agent ID"
        });
    }

    if (!name || !name.trim()) {
        return res.status(400).json({
            error: "Agent name is required"
        });
    }

    if (!email || !email.trim()) {
        return res.status(400).json({
            error: "Agent email is required"
        });
    }

    db.query(
        `
        UPDATE team_inbox_agents
        SET
            name = ?,
            email = ?,
            status = ?,
            assigned_chats = ?
        WHERE id = ?
        AND user_id = ?
        `,
        [
            name.trim(),
            email.trim(),
            status || "Online",
            Number(assignedChats) || 0,
            agentId,
            userId
        ],
        (err, result) => {

            if (err) {
                console.error(
                    "Team Inbox agent PUT error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: "Agent not found"
                });
            }

            res.json({
                message: "Agent updated successfully"
            });
        }
    );
});


// DELETE AGENT
app.delete("/api/team-inbox/agents/:id", (req, res) => {

    const userId = getTeamInboxUserId(req);
    const agentId = Number(req.params.id);

    if (!Number.isInteger(agentId) || agentId <= 0) {
        return res.status(400).json({
            error: "Invalid agent ID"
        });
    }

    db.query(
        `
        DELETE FROM team_inbox_agents
        WHERE id = ?
        AND user_id = ?
        `,
        [agentId, userId],
        (err, result) => {

            if (err) {
                console.error(
                    "Team Inbox agent DELETE error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: "Agent not found"
                });
            }

            res.json({
                message: "Agent deleted successfully"
            });
        }
    );
});

// =====================================================
// TEAM INBOX - CHATS
// =====================================================

// GET ALL CHATS
app.get("/api/team-inbox/chats", (req, res) => {
    const userId = getTeamInboxUserId(req);

    const {
        status,
        search
    } = req.query;

    /*
     * IMPORTANT:
     * Your database currently contains duplicate rows for
     * the same customer_phone.
     *
     * We keep the most recent chat row for each customer.
     *
     * This preserves the rows containing real messages:
     * Sangeeta -> chat 8
     * Rahul    -> chat 16
     * Priya    -> chat 18
     *
     * while preventing duplicate conversations from appearing.
     */

    let query = `
        SELECT
            c.id,
            c.user_id,
            c.whatsapp_number_id,
            c.customer_name,
            c.customer_phone,
            c.status,
            c.assigned_agent_id,
            c.unread_count,
            c.last_message,
            c.last_message_at,
            c.created_at,
            c.updated_at,

            a.name AS assigned_agent_name,
            a.email AS assigned_agent_email,

            wn.phone_number AS business_phone,
            wn.business_name

        FROM team_inbox_chats c

        LEFT JOIN team_inbox_agents a
            ON c.assigned_agent_id = a.id
            AND a.user_id = c.user_id

        LEFT JOIN whatsapp_numbers wn
            ON c.whatsapp_number_id = wn.id

        WHERE c.user_id = ?

        AND c.id = (
            SELECT c2.id
            FROM team_inbox_chats c2
            WHERE c2.user_id = c.user_id
              AND c2.customer_phone = c.customer_phone

            ORDER BY
                COALESCE(
                    c2.last_message_at,
                    c2.created_at
                ) DESC,
                c2.id DESC

            LIMIT 1
        )
    `;

    const params = [userId];

    /*
     * OPENED / PENDING / CLOSED
     *
     * UNASSIGNED is NOT a status.
     *
     * Assignment is controlled by assigned_agent_id.
     */
    if (status && status !== "all") {

        if (status === "unassigned") {

            query += `
                AND c.assigned_agent_id IS NULL
            `;

        } else if (status === "assigned") {

            query += `
                AND c.assigned_agent_id IS NOT NULL
            `;

        } else if (status === "unread") {

            query += `
                AND c.unread_count > 0
            `;

        } else {

            query += `
                AND UPPER(c.status) = ?
            `;

            params.push(
                status.toUpperCase()
            );
        }
    }

    /*
     * SEARCH
     */
    if (search && search.trim()) {

        query += `
            AND (
                c.customer_name LIKE ?
                OR c.customer_phone LIKE ?
                OR c.last_message LIKE ?
                OR a.name LIKE ?
                OR a.email LIKE ?
            )
        `;

        const searchValue =
            `%${search.trim()}%`;

        params.push(
            searchValue,
            searchValue,
            searchValue,
            searchValue,
            searchValue
        );
    }

    /*
     * Latest conversations first.
     */
    query += `
        ORDER BY
            COALESCE(
                c.last_message_at,
                c.created_at
            ) DESC,
            c.id DESC
    `;

    db.query(
        query,
        params,
        (err, results) => {

            if (err) {

                console.error(
                    "Team Inbox chats GET error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(results);
        }
    );
});

// GET SINGLE CHAT
app.get("/api/team-inbox/chats/:id", (req, res) => {

    const userId = getTeamInboxUserId(req);
    const chatId = Number(req.params.id);

    if (!Number.isInteger(chatId) || chatId <= 0) {
        return res.status(400).json({
            error: "Invalid chat ID"
        });
    }

    db.query(
        `
        SELECT
            c.*,

            a.name AS assigned_agent_name,
            a.email AS assigned_agent_email,

            wn.phone_number AS business_phone,
            wn.business_name

        FROM team_inbox_chats c

        LEFT JOIN team_inbox_agents a
            ON c.assigned_agent_id = a.id

        LEFT JOIN whatsapp_numbers wn
            ON c.whatsapp_number_id = wn.id

        WHERE c.id = ?
        AND c.user_id = ?
        `,
        [
            chatId,
            userId
        ],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    error: "Chat not found"
                });
            }

            res.json(results[0]);
        }
    );
});


// CREATE CHAT
app.post("/api/team-inbox/chats", (req, res) => {

    const userId = getTeamInboxUserId(req);

    const {
        whatsapp_number_id,
        customer_name,
        customer_phone,
        status,
        assigned_agent_id,
        last_message
    } = req.body;

    if (!customer_name || !customer_name.trim()) {
        return res.status(400).json({
            error: "Customer name is required"
        });
    }

    if (!customer_phone || !customer_phone.trim()) {
        return res.status(400).json({
            error: "Customer phone number is required"
        });
    }

    db.query(
        `
        INSERT INTO team_inbox_chats
        (
            user_id,
            whatsapp_number_id,
            customer_name,
            customer_phone,
            status,
            assigned_agent_id,
            unread_count,
            last_message,
            last_message_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            userId,
            whatsapp_number_id || null,
            customer_name.trim(),
            customer_phone.trim(),
            status || "OPENED",
            assigned_agent_id || null,
            last_message ? 1 : 0,
            last_message || null,
            last_message
                ? new Date()
                : null
        ],
        (err, result) => {

            if (err) {
                console.error(
                    "Team Inbox chat POST error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message:
                    "Chat created successfully",
                chat_id:
                    result.insertId
            });
        }
    );
});


// UPDATE CHAT
app.put("/api/team-inbox/chats/:id", (req, res) => {

    const userId = getTeamInboxUserId(req);
    const chatId = Number(req.params.id);

    const {
        status,
        assigned_agent_id,
        unread_count
    } = req.body;

    if (!Number.isInteger(chatId) || chatId <= 0) {
        return res.status(400).json({
            error: "Invalid chat ID"
        });
    }

    const updates = [];
    const params = [];

    if (status !== undefined) {
        updates.push("status = ?");
        params.push(status);
    }

    if (assigned_agent_id !== undefined) {
        updates.push(
            "assigned_agent_id = ?"
        );

        params.push(
            assigned_agent_id || null
        );
    }

    if (unread_count !== undefined) {
        updates.push(
            "unread_count = ?"
        );

        params.push(
            Math.max(
                0,
                Number(unread_count) || 0
            )
        );
    }

    if (updates.length === 0) {
        return res.status(400).json({
            error: "No fields to update"
        });
    }

    params.push(chatId);
    params.push(userId);

    db.query(
        `
        UPDATE team_inbox_chats
        SET ${updates.join(", ")}
        WHERE id = ?
        AND user_id = ?
        `,
        params,
        (err, result) => {

            if (err) {
                console.error(
                    "Team Inbox chat PUT error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: "Chat not found"
                });
            }

            res.json({
                message:
                    "Chat updated successfully"
            });
        }
    );
});


// =====================================================
// TEAM INBOX - MESSAGES
// =====================================================

// GET CHAT MESSAGES
app.get(
    "/api/team-inbox/chats/:id/messages",
    (req, res) => {

        const userId =
            getTeamInboxUserId(req);

        const chatId =
            Number(req.params.id);

        if (
            !Number.isInteger(chatId) ||
            chatId <= 0
        ) {
            return res.status(400).json({
                error: "Invalid chat ID"
            });
        }

        db.query(
            `
            SELECT id
            FROM team_inbox_chats
            WHERE id = ?
            AND user_id = ?
            `,
            [
                chatId,
                userId
            ],
            (chatErr, chatResults) => {

                if (chatErr) {
                    return res.status(500).json({
                        error:
                            chatErr.message
                    });
                }

                if (
                    chatResults.length === 0
                ) {
                    return res.status(404).json({
                        error:
                            "Chat not found"
                    });
                }

                db.query(
                    `
                    SELECT
                        id,
                        chat_id,
                        sender_type,
                        sender_name,
                        message_text,
                        message_status,
                        sent_at,
                        created_at
                    FROM team_inbox_messages
                    WHERE chat_id = ?
                    ORDER BY id ASC
                    `,
                    [chatId],
                    (err, messages) => {

                        if (err) {
                            console.error(
                                "Team Inbox messages GET error:",
                                err
                            );

                            return res.status(500).json({
                                error:
                                    err.message
                            });
                        }

                        res.json(messages);
                    }
                );
            }
        );
    }
);


// SEND / STORE MESSAGE
app.post(
    "/api/team-inbox/chats/:id/messages",
    (req, res) => {

        const userId =
            getTeamInboxUserId(req);

        const chatId =
            Number(req.params.id);

        const {
            message_text,
            sender_type,
            sender_name,
            message_status
        } = req.body;

        if (
            !Number.isInteger(chatId) ||
            chatId <= 0
        ) {
            return res.status(400).json({
                error: "Invalid chat ID"
            });
        }

        if (
            !message_text ||
            !message_text.trim()
        ) {
            return res.status(400).json({
                error: "Message is required"
            });
        }

        db.query(
            `
            SELECT id
            FROM team_inbox_chats
            WHERE id = ?
            AND user_id = ?
            `,
            [
                chatId,
                userId
            ],
            (chatErr, chatResults) => {

                if (chatErr) {
                    return res.status(500).json({
                        error:
                            chatErr.message
                    });
                }

                if (
                    chatResults.length === 0
                ) {
                    return res.status(404).json({
                        error:
                            "Chat not found"
                    });
                }

                db.query(
                    `
                    INSERT INTO team_inbox_messages
                    (
                        chat_id,
                        sender_type,
                        sender_name,
                        message_text,
                        message_status,
                        sent_at
                    )
                    VALUES (?, ?, ?, ?, ?, NOW())
                    `,
                    [
                        chatId,
                        sender_type ||
                            "AGENT",
                        sender_name ||
                            "Team Inbox Agent",
                        message_text.trim(),
                        message_status ||
                            "SENT"
                    ],
                    (messageErr, result) => {

                        if (messageErr) {
                            console.error(
                                "Team Inbox message POST error:",
                                messageErr
                            );

                            return res.status(500).json({
                                error:
                                    messageErr.message
                            });
                        }

                        db.query(
                            `
                            UPDATE team_inbox_chats
                            SET
                                last_message = ?,
                                last_message_at = NOW(),
                                unread_count = 0
                            WHERE id = ?
                            AND user_id = ?
                            `,
                            [
                                message_text.trim(),
                                chatId,
                                userId
                            ],
                            (updateErr) => {

                                if (updateErr) {
                                    console.error(
                                        "Team Inbox chat update error:",
                                        updateErr
                                    );

                                    return res.status(500).json({
                                        error:
                                            updateErr.message
                                    });
                                }

                                res.status(201).json({
                                    message:
                                        "Team Inbox message stored successfully",
                                    message_id:
                                        result.insertId,
                                    chat_id:
                                        chatId,
                                    status:
                                        message_status ||
                                        "SENT"
                                });
                            }
                        );
                    }
                );
            }
        );
    }
);


// =====================================================
// TEAM INBOX - ASSIGN / UNASSIGN CHAT
// =====================================================

app.put(
    "/api/team-inbox/chats/:chatId/assign",
    (req, res) => {

        const userId =
            getTeamInboxUserId(req);

        const chatId =
            Number(req.params.chatId);

        const {
            assigned_agent_id
        } = req.body;

        if (
            !Number.isInteger(chatId) ||
            chatId <= 0
        ) {
            return res.status(400).json({
                error: "Invalid chat ID"
            });
        }

        /*
         * NULL means unassign.
         */
        const agentId =
            assigned_agent_id === null ||
            assigned_agent_id === undefined ||
            assigned_agent_id === "" ||
            assigned_agent_id === 0 ||
            assigned_agent_id === "0"
                ? null
                : Number(assigned_agent_id);

        /*
         * If assigning, make sure the agent belongs
         * to the same user.
         */
        if (agentId !== null) {

            if (
                !Number.isInteger(agentId) ||
                agentId <= 0
            ) {
                return res.status(400).json({
                    error: "Invalid agent ID"
                });
            }

            db.query(
                `
                    SELECT id
                    FROM team_inbox_agents
                    WHERE id = ?
                    AND user_id = ?
                    LIMIT 1
                `,
                [
                    agentId,
                    userId
                ],
                (agentErr, agentRows) => {

                    if (agentErr) {

                        return res.status(500).json({
                            error:
                                agentErr.message
                        });
                    }

                    if (
                        agentRows.length === 0
                    ) {

                        return res.status(404).json({
                            error:
                                "Agent not found"
                        });
                    }

                    updateChatAssignment();
                }
            );

        } else {

            updateChatAssignment();
        }

        function updateChatAssignment() {

            db.query(
                `
                    UPDATE team_inbox_chats

                    SET
                        assigned_agent_id = ?,
                        updated_at = CURRENT_TIMESTAMP

                    WHERE id = ?
                    AND user_id = ?
                `,
                [
                    agentId,
                    chatId,
                    userId
                ],
                (err, result) => {

                    if (err) {

                        console.error(
                            "Team Inbox assignment error:",
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
                                "Chat not found"
                        });
                    }

                    /*
                     * Keep the old assigned_chats column
                     * synchronized too, although the UI now
                     * calculates the real value dynamically.
                     */
                    db.query(
                        `
                            UPDATE team_inbox_agents a

                            SET
                                assigned_chats = (
                                    SELECT COUNT(*)
                                    FROM team_inbox_chats c
                                    WHERE c.assigned_agent_id = a.id
                                    AND c.user_id = a.user_id
                                )

                            WHERE a.user_id = ?
                        `,
                        [userId],
                        (countErr) => {

                            if (countErr) {

                                console.error(
                                    "Agent count update error:",
                                    countErr
                                );
                            }

                            res.json({
                                message:
                                    agentId === null
                                        ? "Chat unassigned successfully"
                                        : "Chat assigned successfully",

                                chat_id:
                                    chatId,

                                assigned_agent_id:
                                    agentId
                            });
                        }
                    );
                }
            );
        }
    }
);


// =====================================================
// TEAM INBOX - MARK CHAT READ
// =====================================================

app.put(
    "/api/team-inbox/chats/:chatId/read",
    (req, res) => {

        const userId =
            getTeamInboxUserId(req);

        const chatId =
            Number(req.params.chatId);

        if (
            !Number.isInteger(chatId) ||
            chatId <= 0
        ) {
            return res.status(400).json({
                error: "Invalid chat ID"
            });
        }

        db.query(
            `
            UPDATE team_inbox_chats
            SET unread_count = 0
            WHERE id = ?
            AND user_id = ?
            `,
            [
                chatId,
                userId
            ],
            (err, result) => {

                if (err) {
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
                            "Chat not found"
                    });
                }

                res.json({
                    message:
                        "Chat marked as read"
                });
            }
        );
    }
);



// =====================================================
// USER MANAGEMENT
// =====================================================

// GET ALL USERS
app.get("/api/users", (req, res) => {
    db.query(
        `
        SELECT
            id,
            name,
            email,
            company_name,
            status,
            created_at
        FROM users
        ORDER BY id DESC
        `,
        (err, results) => {

            if (err) {
                console.error(
                    "User Management GET error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(results);
        }
    );
});


// GET SINGLE USER
app.get("/api/users/:id", (req, res) => {

    const userId =
        Number(req.params.id);

    if (
        !Number.isInteger(userId) ||
        userId <= 0
    ) {
        return res.status(400).json({
            error: "Invalid user ID"
        });
    }

    db.query(
        `
        SELECT
            id,
            name,
            email,
            company_name,
            status,
            created_at
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId],
        (err, results) => {

            if (err) {
                console.error(
                    "User Management single GET error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    error: "User not found"
                });
            }

            res.json(results[0]);
        }
    );
});


// CREATE USER
app.post("/api/users", (req, res) => {

    const {
        name,
        email,
        password,
        company_name,
        status
    } = req.body;

    const cleanName =
        String(name || "").trim();

    const cleanEmail =
        String(email || "").trim();

    const cleanPassword =
        String(password || "");

    const cleanCompany =
        String(company_name || "").trim();

    const cleanStatus =
        String(
            status || "ACTIVE"
        ).toUpperCase();

    if (!cleanName) {
        return res.status(400).json({
            error: "Name is required"
        });
    }

    if (!cleanEmail) {
        return res.status(400).json({
            error: "Email is required"
        });
    }

    if (!cleanPassword) {
        return res.status(400).json({
            error: "Password is required"
        });
    }

    if (cleanPassword.length < 6) {
        return res.status(400).json({
            error:
                "Password must contain at least 6 characters"
        });
    }

    if (
        !["ACTIVE", "INACTIVE"]
            .includes(cleanStatus)
    ) {
        return res.status(400).json({
            error: "Invalid status"
        });
    }

    db.query(
        `
        SELECT id
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
        [cleanEmail],
        (checkErr, existing) => {

            if (checkErr) {
                console.error(
                    "User email check error:",
                    checkErr
                );

                return res.status(500).json({
                    error: checkErr.message
                });
            }

            if (existing.length > 0) {
                return res.status(409).json({
                    error:
                        "A user with this email already exists"
                });
            }

            db.query(
                `
                INSERT INTO users
                (
                    name,
                    email,
                    password,
                    company_name,
                    status
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    cleanName,
                    cleanEmail,
                    cleanPassword,
                    cleanCompany || null,
                    cleanStatus
                ],
                (err, result) => {

                    if (err) {
                        console.error(
                            "User Management POST error:",
                            err
                        );

                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.status(201).json({
                        message:
                            "User created successfully",
                        id:
                            result.insertId
                    });
                }
            );
        }
    );
});


// UPDATE USER
app.put("/api/users/:id", (req, res) => {

    const userId =
        Number(req.params.id);

    if (
        !Number.isInteger(userId) ||
        userId <= 0
    ) {
        return res.status(400).json({
            error: "Invalid user ID"
        });
    }

    const {
        name,
        email,
        password,
        company_name,
        status
    } = req.body;

    const cleanName =
        String(name || "").trim();

    const cleanEmail =
        String(email || "").trim();

    const cleanCompany =
        String(company_name || "").trim();

    const cleanStatus =
        String(
            status || "ACTIVE"
        ).toUpperCase();

    if (!cleanName) {
        return res.status(400).json({
            error: "Name is required"
        });
    }

    if (!cleanEmail) {
        return res.status(400).json({
            error: "Email is required"
        });
    }

    if (
        !["ACTIVE", "INACTIVE"]
            .includes(cleanStatus)
    ) {
        return res.status(400).json({
            error: "Invalid status"
        });
    }

    if (
        password !== undefined &&
        password !== null &&
        String(password).length > 0 &&
        String(password).length < 6
    ) {
        return res.status(400).json({
            error:
                "Password must contain at least 6 characters"
        });
    }

    db.query(
        `
        SELECT id
        FROM users
        WHERE email = ?
        AND id <> ?
        LIMIT 1
        `,
        [
            cleanEmail,
            userId
        ],
        (checkErr, existing) => {

            if (checkErr) {
                return res.status(500).json({
                    error:
                        checkErr.message
                });
            }

            if (existing.length > 0) {
                return res.status(409).json({
                    error:
                        "Another user already uses this email"
                });
            }

            let query;
            let params;

            if (
                password !== undefined &&
                password !== null &&
                String(password).length > 0
            ) {

                query = `
                    UPDATE users
                    SET
                        name = ?,
                        email = ?,
                        password = ?,
                        company_name = ?,
                        status = ?
                    WHERE id = ?
                `;

                params = [
                    cleanName,
                    cleanEmail,
                    String(password),
                    cleanCompany || null,
                    cleanStatus,
                    userId
                ];

            } else {

                query = `
                    UPDATE users
                    SET
                        name = ?,
                        email = ?,
                        company_name = ?,
                        status = ?
                    WHERE id = ?
                `;

                params = [
                    cleanName,
                    cleanEmail,
                    cleanCompany || null,
                    cleanStatus,
                    userId
                ];
            }

            db.query(
                query,
                params,
                (err, result) => {

                    if (err) {
                        console.error(
                            "User Management PUT error:",
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
                                "User not found"
                        });
                    }

                    res.json({
                        message:
                            "User updated successfully"
                    });
                }
            );
        }
    );
});


// ============================================================
// ADDRESS BOOK APIs
// ============================================================

// GET ALL CONTACTS
app.get("/api/address-book/contacts", (req, res) => {
  const userId = 1;

  const sql = `
    SELECT
      id,
      user_id,
      name,
      phone_number,
      email,
      company_name,
      status,
      created_at,
      updated_at
    FROM address_book_contacts
    WHERE user_id = ?
    ORDER BY updated_at DESC, id DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error(
        "❌ Address Book GET error:",
        err
      );

      return res.status(500).json({
        error: "Failed to load contacts",
        details: err.message,
      });
    }

    res.json(results);
  });
});


// ============================================================
// ADD CONTACT
// ============================================================

app.post("/api/address-book/contacts", (req, res) => {
  const userId = 1;

  const {
    name,
    phone_number,
    email,
    company_name,
    status,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      error: "Name is required",
    });
  }

  if (!phone_number || !phone_number.trim()) {
    return res.status(400).json({
      error: "Phone number is required",
    });
  }

  const sql = `
    INSERT INTO address_book_contacts
    (
      user_id,
      name,
      phone_number,
      email,
      company_name,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      userId,
      name.trim(),
      phone_number.trim(),
      email ? email.trim() : null,
      company_name
        ? company_name.trim()
        : null,
      status || "ACTIVE",
    ],
    (err, result) => {
      if (err) {
        console.error(
          "❌ Address Book INSERT error:",
          err
        );

        return res.status(500).json({
          error: "Failed to add contact",
          details: err.message,
        });
      }

      res.status(201).json({
        message: "Contact added successfully",
        id: result.insertId,
      });
    }
  );
});


// ============================================================
// UPDATE CONTACT
// ============================================================

app.put(
  "/api/address-book/contacts/:id",
  (req, res) => {
    const userId = 1;
    const contactId = req.params.id;

    const {
      name,
      phone_number,
      email,
      company_name,
      status,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Name is required",
      });
    }

    if (
      !phone_number ||
      !phone_number.trim()
    ) {
      return res.status(400).json({
        error: "Phone number is required",
      });
    }

    const sql = `
      UPDATE address_book_contacts
      SET
        name = ?,
        phone_number = ?,
        email = ?,
        company_name = ?,
        status = ?
      WHERE id = ?
        AND user_id = ?
    `;

    db.query(
      sql,
      [
        name.trim(),
        phone_number.trim(),
        email ? email.trim() : null,
        company_name
          ? company_name.trim()
          : null,
        status || "ACTIVE",
        contactId,
        userId,
      ],
      (err, result) => {
        if (err) {
          console.error(
            "❌ Address Book UPDATE error:",
            err
          );

          return res.status(500).json({
            error: "Failed to update contact",
            details: err.message,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            error: "Contact not found",
          });
        }

        res.json({
          message:
            "Contact updated successfully",
        });
      }
    );
  }
);


// ============================================================
// DELETE CONTACT
// ============================================================

app.delete(
  "/api/address-book/contacts/:id",
  (req, res) => {
    const userId = 1;
    const contactId = req.params.id;

    const sql = `
      DELETE FROM address_book_contacts
      WHERE id = ?
        AND user_id = ?
    `;

    db.query(
      sql,
      [contactId, userId],
      (err, result) => {
        if (err) {
          console.error(
            "❌ Address Book DELETE error:",
            err
          );

          return res.status(500).json({
            error: "Failed to delete contact",
            details: err.message,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            error: "Contact not found",
          });
        }

        res.json({
          message:
            "Contact deleted successfully",
        });
      }
    );
  }
);

// ============================================================
// COMMERCE APIs
// ============================================================

// GET WALLET + TRANSACTIONS
app.get("/api/commerce", (req, res) => {
  const userId = 1;

  const walletSql = `
    SELECT
      id,
      user_id,
      balance,
      currency,
      updated_at
    FROM wallets
    WHERE user_id = ?
    LIMIT 1
  `;

  const transactionSql = `
    SELECT
      id,
      user_id,
      type,
      amount,
      currency,
      description,
      status,
      created_at
    FROM commerce_transactions
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
  `;

  db.query(
    walletSql,
    [userId],
    (walletErr, walletResults) => {
      if (walletErr) {
        console.error(
          "❌ Commerce wallet GET error:",
          walletErr
        );

        return res.status(500).json({
          error: "Failed to load wallet",
          details: walletErr.message,
        });
      }

      db.query(
        transactionSql,
        [userId],
        (transactionErr, transactionResults) => {
          if (transactionErr) {
            console.error(
              "❌ Commerce transactions GET error:",
              transactionErr
            );

            return res.status(500).json({
              error: "Failed to load transactions",
              details: transactionErr.message,
            });
          }

          res.json({
            wallet:
              walletResults.length > 0
                ? walletResults[0]
                : null,

            transactions:
              transactionResults || [],
          });
        }
      );
    }
  );
});


// ============================================================
// ADD MONEY
// ============================================================

app.post(
  "/api/commerce/add-money",
  (req, res) => {
    const userId = 1;

    const {
      amount,
      description,
    } = req.body;

    const numericAmount =
      Number(amount);

    // ------------------------------
    // VALIDATION
    // ------------------------------

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        error:
          "Amount must be greater than zero.",
      });
    }

    if (numericAmount > 1000000) {
      return res.status(400).json({
        error:
          "Maximum top-up amount is ₹10,00,000.",
      });
    }

    // ------------------------------
    // START TRANSACTION
    // ------------------------------

    db.beginTransaction(
      (transactionStartError) => {
        if (transactionStartError) {
          console.error(
            "❌ Commerce transaction start error:",
            transactionStartError
          );

          return res.status(500).json({
            error:
              "Unable to start wallet transaction.",
          });
        }

        // --------------------------
        // LOCK WALLET
        // --------------------------

        const walletSql = `
          SELECT
            id,
            balance,
            currency
          FROM wallets
          WHERE user_id = ?
          LIMIT 1
          FOR UPDATE
        `;

        db.query(
          walletSql,
          [userId],
          (walletError, walletResults) => {
            if (walletError) {
              return db.rollback(() => {
                console.error(
                  "❌ Commerce wallet lock error:",
                  walletError
                );

                res.status(500).json({
                  error:
                    "Unable to access wallet.",
                  details:
                    walletError.message,
                });
              });
            }

            if (
              !walletResults ||
              walletResults.length === 0
            ) {
              return db.rollback(() => {
                res.status(404).json({
                  error:
                    "Wallet not found for this user.",
                });
              });
            }

            const wallet =
              walletResults[0];

            const newBalance =
              Number(wallet.balance) +
              numericAmount;

            // ------------------------
            // UPDATE BALANCE
            // ------------------------

            const updateWalletSql = `
              UPDATE wallets
              SET balance = ?
              WHERE id = ?
                AND user_id = ?
            `;

            db.query(
              updateWalletSql,
              [
                newBalance,
                wallet.id,
                userId,
              ],
              (updateError) => {
                if (updateError) {
                  return db.rollback(() => {
                    console.error(
                      "❌ Commerce wallet update error:",
                      updateError
                    );

                    res.status(500).json({
                      error:
                        "Unable to update wallet.",
                      details:
                        updateError.message,
                    });
                  });
                }

                // ----------------------
                // INSERT TRANSACTION
                // ----------------------

                const transactionSql = `
                  INSERT INTO commerce_transactions
                  (
                    user_id,
                    type,
                    amount,
                    currency,
                    description,
                    status
                  )
                  VALUES (?, ?, ?, ?, ?, ?)
                `;

                db.query(
                  transactionSql,
                  [
                    userId,
                    "CREDIT",
                    numericAmount,
                    wallet.currency ||
                      "INR",
                    description &&
                    String(
                      description
                    ).trim()
                      ? String(
                          description
                        ).trim()
                      : "Wallet top-up",
                    "SUCCESS",
                  ],
                  (
                    insertError,
                    insertResult
                  ) => {
                    if (insertError) {
                      return db.rollback(
                        () => {
                          console.error(
                            "❌ Commerce transaction insert error:",
                            insertError
                          );

                          res
                            .status(500)
                            .json({
                              error:
                                "Unable to create transaction.",
                              details:
                                insertError.message,
                            });
                        }
                      );
                    }

                    // ----------------
                    // COMMIT
                    // ----------------

                    db.commit(
                      (commitError) => {
                        if (commitError) {
                          return db.rollback(
                            () => {
                              console.error(
                                "❌ Commerce commit error:",
                                commitError
                              );

                              res
                                .status(500)
                                .json({
                                  error:
                                    "Unable to complete wallet transaction.",
                                  details:
                                    commitError.message,
                                });
                            }
                          );
                        }

                        res.status(201).json({
                          message:
                            "Money added successfully.",

                          transactionId:
                            insertResult
                              .insertId,

                          newBalance:
                            newBalance,

                          currency:
                            wallet.currency ||
                            "INR",
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  }
);

// ============================================================
// USE MONEY / DEBIT WALLET
// ============================================================

app.post(
  "/api/commerce/use-money",
  (req, res) => {
    const userId = 1;

    const {
      amount,
      description,
    } = req.body;

    const numericAmount = Number(amount);

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        error:
          "Amount must be greater than zero.",
      });
    }

    if (numericAmount > 1000000) {
      return res.status(400).json({
        error:
          "Maximum transaction amount is ₹10,00,000.",
      });
    }

    // --------------------------------------------------------
    // START DATABASE TRANSACTION
    // --------------------------------------------------------

    db.beginTransaction(
      (transactionStartError) => {
        if (transactionStartError) {
          console.error(
            "❌ Commerce debit transaction start error:",
            transactionStartError
          );

          return res.status(500).json({
            error:
              "Unable to start wallet transaction.",
          });
        }

        // ----------------------------------------------------
        // LOCK WALLET
        // ----------------------------------------------------

        const walletSql = `
          SELECT
            id,
            balance,
            currency
          FROM wallets
          WHERE user_id = ?
          LIMIT 1
          FOR UPDATE
        `;

        db.query(
          walletSql,
          [userId],
          (walletError, walletResults) => {
            if (walletError) {
              return db.rollback(() => {
                console.error(
                  "❌ Commerce debit wallet error:",
                  walletError
                );

                res.status(500).json({
                  error:
                    "Unable to access wallet.",
                  details:
                    walletError.message,
                });
              });
            }

            if (
              !walletResults ||
              walletResults.length === 0
            ) {
              return db.rollback(() => {
                res.status(404).json({
                  error:
                    "Wallet not found for this user.",
                });
              });
            }

            const wallet =
              walletResults[0];

            const currentBalance =
              Number(wallet.balance || 0);

            // ------------------------------------------------
            // CHECK SUFFICIENT BALANCE
            // ------------------------------------------------

            if (
              numericAmount >
              currentBalance
            ) {
              return db.rollback(() => {
                res.status(400).json({
                  error:
                    `Insufficient wallet balance. Available balance is ₹${currentBalance.toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}.`,
                });
              });
            }

            const newBalance =
              currentBalance -
              numericAmount;

            // ------------------------------------------------
            // UPDATE WALLET
            // ------------------------------------------------

            const updateWalletSql = `
              UPDATE wallets
              SET balance = ?
              WHERE id = ?
                AND user_id = ?
            `;

            db.query(
              updateWalletSql,
              [
                newBalance,
                wallet.id,
                userId,
              ],
              (updateError) => {
                if (updateError) {
                  return db.rollback(() => {
                    console.error(
                      "❌ Commerce debit wallet update error:",
                      updateError
                    );

                    res.status(500).json({
                      error:
                        "Unable to update wallet.",
                      details:
                        updateError.message,
                    });
                  });
                }

                // --------------------------------------------
                // INSERT DEBIT TRANSACTION
                // --------------------------------------------

                const transactionSql = `
                  INSERT INTO commerce_transactions
                  (
                    user_id,
                    type,
                    amount,
                    currency,
                    description,
                    status
                  )
                  VALUES (?, ?, ?, ?, ?, ?)
                `;

                db.query(
                  transactionSql,
                  [
                    userId,
                    "DEBIT",
                    numericAmount,
                    wallet.currency ||
                      "INR",
                    description &&
                    String(
                      description
                    ).trim()
                      ? String(
                          description
                        ).trim()
                      : "Wallet usage",
                    "SUCCESS",
                  ],
                  (
                    insertError,
                    insertResult
                  ) => {
                    if (insertError) {
                      return db.rollback(
                        () => {
                          console.error(
                            "❌ Commerce debit transaction insert error:",
                            insertError
                          );

                          res
                            .status(500)
                            .json({
                              error:
                                "Unable to create debit transaction.",
                              details:
                                insertError.message,
                            });
                        }
                      );
                    }

                    // ----------------------------------------
                    // COMMIT
                    // ----------------------------------------

                    db.commit(
                      (commitError) => {
                        if (commitError) {
                          return db.rollback(
                            () => {
                              console.error(
                                "❌ Commerce debit commit error:",
                                commitError
                              );

                              res
                                .status(500)
                                .json({
                                  error:
                                    "Unable to complete wallet debit.",
                                  details:
                                    commitError.message,
                                });
                            }
                          );
                        }

                        res.status(201).json({
                          message:
                            "Money used successfully.",

                          transactionId:
                            insertResult.insertId,

                          newBalance:
                            newBalance,

                          currency:
                            wallet.currency ||
                            "INR",
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  }
);

// =====================================================
// SMS SCHEDULED CAMPAIGN WORKER
// =====================================================

function processScheduledSmsCampaigns() {

    const campaignQuery = `
        SELECT
            c.id,
            c.user_id,
            c.campaign_name,
            c.sender_id,
            c.template_id,
            c.scheduled_at,
            c.scheduled_message
        FROM sms_campaigns c
        WHERE c.status = 'SCHEDULED'
        AND c.scheduled_at <= NOW()
        ORDER BY c.scheduled_at ASC
    `;

    db.query(
        campaignQuery,
        (err, campaigns) => {

            if (err) {
                console.error(
                    "Scheduled SMS campaign lookup error:",
                    err
                );
                return;
            }

            if (!campaigns || campaigns.length === 0) {
                return;
            }

            campaigns.forEach((campaign) => {

                console.log(
                    `Processing scheduled SMS campaign #${campaign.id}: ${campaign.campaign_name}`
                );

                // -----------------------------------------
                // GET RECIPIENTS
                // -----------------------------------------

                db.query(
                    `
                    SELECT
                        id,
                        phone_number,
                        recipient_name
                    FROM sms_campaign_recipients
                    WHERE campaign_id = ?
                    AND status = 'SCHEDULED'
                    `,
                    [campaign.id],
                    (recipientErr, recipients) => {

                        if (recipientErr) {
                            console.error(
                                "Scheduled SMS recipient lookup error:",
                                recipientErr
                            );
                            return;
                        }

                        if (!recipients || recipients.length === 0) {

                            db.query(
                                `
                                UPDATE sms_campaigns
                                SET status = 'SENT'
                                WHERE id = ?
                                `,
                                [campaign.id]
                            );

                            return;
                        }

                        let processed = 0;
                        let failed = false;

                        recipients.forEach(
                            (recipient) => {

                                const message =
                                    campaign.scheduled_message || "";

                                // -----------------------------------------
                                // CREATE SMS MESSAGE
                                // -----------------------------------------

                                db.query(
                                    `
                                    INSERT INTO sms_messages
                                    (
                                        user_id,
                                        sender_id,
                                        phone_number,
                                        message,
                                        status,
                                        campaign_name
                                    )
                                    VALUES (?, ?, ?, ?, ?, ?)
                                    `,
                                    [
                                        campaign.user_id || 1,
                                        campaign.sender_id,
                                        recipient.phone_number,
                                        message,
                                        "SENT",
                                        campaign.campaign_name
                                    ],
                                    (
                                        messageErr,
                                        messageResult
                                    ) => {

                                        if (messageErr) {

                                            console.error(
                                                "Scheduled SMS message insert error:",
                                                messageErr
                                            );

                                            failed = true;
                                            processed++;

                                            finishScheduledCampaign();

                                            return;
                                        }

                                        const providerMessageId =
                                            `DEMO-MSG-${messageResult.insertId}`;

                                        // -----------------------------------------
                                        // DELIVERY LOG
                                        // -----------------------------------------

                                        db.query(
                                            `
                                            INSERT INTO sms_delivery_logs
                                            (
                                                campaign_id,
                                                recipient_id,
                                                phone_number,
                                                provider_message_id,
                                                status
                                            )
                                            VALUES (?, ?, ?, ?, ?)
                                            `,
                                            [
                                                campaign.id,
                                                recipient.id,
                                                recipient.phone_number,
                                                providerMessageId,
                                                "SENT"
                                            ],
                                            (logErr) => {

                                                if (logErr) {

                                                    console.error(
                                                        "Scheduled SMS delivery log error:",
                                                        logErr
                                                    );

                                                    failed = true;
                                                }

                                                // -----------------------------------------
                                                // UPDATE RECIPIENT
                                                // -----------------------------------------

                                                db.query(
                                                    `
                                                    UPDATE sms_campaign_recipients
                                                    SET status = ?
                                                    WHERE id = ?
                                                    `,
                                                    [
                                                        logErr
                                                            ? "FAILED"
                                                            : "SENT",
                                                        recipient.id
                                                    ],
                                                    (recipientUpdateErr) => {

                                                        if (
                                                            recipientUpdateErr
                                                        ) {

                                                            console.error(
                                                                "Scheduled SMS recipient update error:",
                                                                recipientUpdateErr
                                                            );

                                                            failed = true;
                                                        }

                                                        processed++;

                                                        finishScheduledCampaign();
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );

                            }
                        );

                        function finishScheduledCampaign() {

                            if (
                                processed !==
                                recipients.length
                            ) {
                                return;
                            }

                            const finalStatus =
                                failed
                                    ? "FAILED"
                                    : "SENT";

                            db.query(
                                `
                                UPDATE sms_campaigns
                                SET status = ?
                                WHERE id = ?
                                `,
                                [
                                    finalStatus,
                                    campaign.id
                                ],
                                (campaignUpdateErr) => {

                                    if (campaignUpdateErr) {

                                        console.error(
                                            "Scheduled SMS campaign update error:",
                                            campaignUpdateErr
                                        );

                                        return;
                                    }

                                    console.log(
                                        `Scheduled SMS campaign #${campaign.id} completed with status ${finalStatus}`
                                    );
                                }
                            );
                        }

                    }
                );

            });

        }
    );
}


// =====================================================
// RUN SMS SCHEDULER EVERY 30 SECONDS
// =====================================================

setInterval(
    processScheduledSmsCampaigns,
    30 * 1000
);

// Run once when backend starts
processScheduledSmsCampaigns();


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {

    console.log(
        `Backend running on http://localhost:${PORT}`
    );

});
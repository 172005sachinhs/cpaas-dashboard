const express = require("express");
const router = express.Router();
const db = require("./db");

// =====================================================
// SMS SENDER IDs
// =====================================================

// GET ALL SMS SENDER IDs
router.get("/api/sms/sender-ids", (req, res) => {

    const query = `
        SELECT
            id,
            user_id,
            sender_id,
            sender_type,
            purpose,
            status,
            created_at
        FROM sms_sender_ids
        ORDER BY id DESC
    `;

    db.query(query, (err, results) => {

        if (err) {
            console.error(
                "SMS sender IDs query error:",
                err
            );

            return res.status(500).json({
                error: err.message
            });
        }

        res.json(results);

    });

});


// GET SINGLE SMS SENDER ID
router.get("/api/sms/sender-ids/:id", (req, res) => {

    const senderId = req.params.id;

    const query = `
        SELECT
            id,
            user_id,
            sender_id,
            sender_type,
            purpose,
            status,
            created_at
        FROM sms_sender_ids
        WHERE id = ?
    `;

    db.query(
        query,
        [senderId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    error: "SMS sender ID not found"
                });
            }

            res.json({
                message:
                    "SMS sender ID retrieved successfully",

                sender_id:
                    results[0]
            });

        }
    );

});


// ADD SMS SENDER ID
router.post("/api/sms/sender-ids", (req, res) => {

    const {
        user_id,
        sender_id,
        sender_type,
        purpose,
        status
    } = req.body;

    if (!sender_id) {
        return res.status(400).json({
            error: "sender_id is required"
        });
    }

    const query = `
        INSERT INTO sms_sender_ids
        (
            user_id,
            sender_id,
            sender_type,
            purpose,
            status
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        query,
        [
            user_id || 1,
            sender_id.trim().toUpperCase(),
            sender_type || "ALPHABETICAL",
            purpose || "SERVICE",
            status || "ACTIVE"
        ],
        (err, result) => {

            if (err) {
                console.error(
                    "SMS sender ID insert error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({

                message:
                    "SMS sender ID created successfully",

                id:
                    result.insertId,

                sender_id:
                    sender_id.trim().toUpperCase(),

                sender_type:
                    sender_type || "ALPHABETICAL",

                purpose:
                    purpose || "SERVICE",

                status:
                    status || "ACTIVE"

            });

        }
    );

});

// UPDATE SMS SENDER ID
router.put("/api/sms/sender-ids/:id", (req, res) => {

    const senderId = req.params.id;

    const {
        sender_id,
        sender_type,
        purpose,
        status
    } = req.body;

    if (
        !sender_id &&
        !sender_type &&
        !purpose &&
        !status
    ) {
        return res.status(400).json({
            error:
                "At least one Sender ID field is required"
        });
    }

    const query = `
        UPDATE sms_sender_ids
        SET
            sender_id = COALESCE(?, sender_id),
            sender_type = COALESCE(?, sender_type),
            purpose = COALESCE(?, purpose),
            status = COALESCE(?, status)
        WHERE id = ?
    `;

    const params = [
        sender_id
            ? sender_id.trim().toUpperCase()
            : null,
        sender_type || null,
        purpose || null,
        status || null,
        senderId
    ];

    db.query(
        query,
        params,
        (err, result) => {

            if (err) {

                console.error(
                    "SMS sender ID update error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });

            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        "SMS sender ID not found"
                });

            }

            res.json({

                message:
                    "SMS sender ID updated successfully",

                id:
                    senderId

            });

        }
    );

});




// DELETE SMS SENDER ID
router.delete("/api/sms/sender-ids/:id", (req, res) => {

    const senderId = req.params.id;

    const query = `
        DELETE FROM sms_sender_ids
        WHERE id = ?
    `;

    db.query(
        query,
        [senderId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error:
                        "SMS sender ID not found"
                });
            }

            res.json({

                message:
                    "SMS sender ID deleted successfully",

                id:
                    senderId

            });

        }
    );

});


// =====================================================
// SMS TEMPLATES
// =====================================================

// GET ALL SMS TEMPLATES
router.get("/api/sms/templates", (req, res) => {

    const query = `
        SELECT
            id,
            user_id,
            sender_id,
            template_name,
            template_type,
            template_content,
            status,
            created_at
        FROM sms_templates
        ORDER BY id DESC
    `;

    db.query(query, (err, results) => {

        if (err) {
            console.error(
                "SMS templates query error:",
                err
            );

            return res.status(500).json({
                error: err.message
            });
        }

        res.json(results);

    });

});


// GET SINGLE SMS TEMPLATE
router.get("/api/sms/templates/:id", (req, res) => {

    const templateId = req.params.id;

    const query = `
        SELECT
            id,
            user_id,
            sender_id,
            template_name,
            template_type,
            template_content,
            status,
            created_at
        FROM sms_templates
        WHERE id = ?
    `;

    db.query(
        query,
        [templateId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    error:
                        "SMS template not found"
                });
            }

            res.json({

                message:
                    "SMS template retrieved successfully",

                template:
                    results[0]

            });

        }
    );

});


// ADD SMS TEMPLATE
router.post("/api/sms/templates", (req, res) => {

    const {
        user_id,
        sender_id,
        template_name,
        template_type,
        template_content,
        status
    } = req.body;

    if (!template_name) {
        return res.status(400).json({
            error:
                "template_name is required"
        });
    }

    if (!template_content) {
        return res.status(400).json({
            error:
                "template_content is required"
        });
    }

    if (!sender_id) {
    return res.status(400).json({
        error:
            "sender_id is required"
    });
}

    const query = `
        INSERT INTO sms_templates
        (
            user_id,
            sender_id,
            template_name,
            template_type,
            template_content,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        query,
        [
            user_id || null,
            sender_id,
            template_name,
            template_type || "TEXT",
            template_content,
            status || "PENDING"
        ],
        (err, result) => {

            if (err) {
                console.error(
                    "SMS template insert error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({

                message:
                    "SMS template created successfully",

                id:
                    result.insertId,

                template_name:
                    template_name,

                status:
                    status || "PENDING"

            });

        }
    );

});


// UPDATE SMS TEMPLATE
router.put("/api/sms/templates/:id", (req, res) => {

    const templateId = req.params.id;

    const {
        template_name,
        template_type,
        template_content,
        status
    } = req.body;

    if (
        !template_name &&
        !template_type &&
        !template_content &&
        !status
    ) {
        return res.status(400).json({
            error:
                "At least one template field is required"
        });
    }

    const query = `
        UPDATE sms_templates
        SET
            template_name =
                COALESCE(?, template_name),

            template_type =
                COALESCE(?, template_type),

            template_content =
                COALESCE(?, template_content),

            status =
                COALESCE(?, status)

        WHERE id = ?
    `;

    db.query(
        query,
        [
            template_name || null,
            template_type || null,
            template_content || null,
            status || null,
            templateId
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error:
                        "SMS template not found"
                });
            }

            res.json({

                message:
                    "SMS template updated successfully",

                id:
                    templateId

            });

        }
    );

});


// DELETE SMS TEMPLATE
router.delete("/api/sms/templates/:id", (req, res) => {

    const templateId = req.params.id;

    const query = `
        DELETE FROM sms_templates
        WHERE id = ?
    `;

    db.query(
        query,
        [templateId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error:
                        "SMS template not found"
                });
            }

            res.json({

                message:
                    "SMS template deleted successfully",

                id:
                    templateId

            });

        }
    );

});


// =====================================================
// SMS DELIVERY LOGS
// =====================================================

// GET ALL SMS DELIVERY LOGS
router.get("/api/sms/delivery-logs", (req, res) => {

    const query = `
        SELECT
            id,
            campaign_id,
            recipient_id,
            phone_number,
            provider_message_id,
            status,
            delivered_at,
            failure_reason,
            created_at
        FROM sms_delivery_logs
        ORDER BY id DESC
    `;

    db.query(query, (err, results) => {

        if (err) {
            console.error(
                "SMS delivery logs query error:",
                err
            );

            return res.status(500).json({
                error: err.message
            });
        }

        res.json(results);

    });

});


// GET DELIVERY LOG BY PROVIDER MESSAGE ID
router.get(
    "/api/sms/delivery-logs/:provider_message_id",
    (req, res) => {

        const providerMessageId =
            req.params.provider_message_id;

        const query = `
            SELECT
                id,
                campaign_id,
                recipient_id,
                phone_number,
                provider_message_id,
                status,
                delivered_at,
                failure_reason,
                created_at
            FROM sms_delivery_logs
            WHERE provider_message_id = ?
        `;

        db.query(
            query,
            [providerMessageId],
            (err, results) => {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (results.length === 0) {
                    return res.status(404).json({
                        error:
                            "SMS delivery log not found"
                    });
                }

                res.json({

                    message:
                        "SMS delivery log retrieved successfully",

                    delivery:
                        results[0]

                });

            }
        );

    }
);


// =====================================================
// SMS MESSAGE HISTORY
// =====================================================

// GET ALL SMS MESSAGES
router.get("/api/sms/messages", (req, res) => {

    const query = `
        SELECT
            id,
            user_id,
            sender_id,
            phone_number,
            message,
            status,
            campaign_name,
            created_at
        FROM sms_messages
        ORDER BY id DESC
    `;

    db.query(query, (err, results) => {

        if (err) {
            console.error(
                "SMS messages query error:",
                err
            );

            return res.status(500).json({
                error: err.message
            });
        }

        res.json(results);

    });

});


// GET SINGLE SMS MESSAGE
router.get("/api/sms/messages/:id", (req, res) => {

    const messageId = req.params.id;

    const query = `
        SELECT
            id,
            user_id,
            sender_id,
            phone_number,
            message,
            status,
            campaign_name,
            created_at
        FROM sms_messages
        WHERE id = ?
    `;

    db.query(
        query,
        [messageId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    error:
                        "SMS message not found"
                });
            }

            res.json({

                message:
                    "SMS message retrieved successfully",

                sms:
                    results[0]

            });

        }
    );

});


// =====================================================
// CREATE SMS CAMPAIGN + AUTOMATIC CLICK TRACKING
// =====================================================

router.post("/api/sms/send", (req, res) => {

    const {
        user_id,
        sender_id,
        template_id,
        campaign_name,
        phone_numbers,
        message
    } = req.body;

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!sender_id) {
        return res.status(400).json({
            error: "sender_id is required"
        });
    }

    if (!campaign_name) {
        return res.status(400).json({
            error: "campaign_name is required"
        });
    }

    if (!message) {
        return res.status(400).json({
            error: "message is required"
        });
    }

    if (
        !Array.isArray(phone_numbers) ||
        phone_numbers.length === 0
    ) {
        return res.status(400).json({
            error: "At least one phone number is required"
        });
    }

    // -----------------------------------------
    // CREATE CAMPAIGN
    // -----------------------------------------

    const campaignQuery = `
        INSERT INTO sms_campaigns
        (
            user_id,
            sender_id,
            template_id,
            campaign_name,
            gateway,
            status,
            total_recipients
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        campaignQuery,
        [
            user_id || 1,
            sender_id,
            template_id || null,
            campaign_name,
            "DEMO",
            "QUEUED",
            phone_numbers.length
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "SMS campaign creation error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            const campaignId = result.insertId;

            // -----------------------------------------
            // PROCESS EACH RECIPIENT ONE BY ONE
            // -----------------------------------------

            const processRecipient = (index) => {

                // -----------------------------------------
                // ALL RECIPIENTS PROCESSED
                // -----------------------------------------

                if (index >= phone_numbers.length) {

                    return res.status(201).json({

                        success: true,

                        message:
                            "SMS campaign created successfully",

                        campaign_id:
                            campaignId,

                        campaign_name:
                            campaign_name,

                        total_recipients:
                            phone_numbers.length,

                        status:
                            "QUEUED",

                        provider_connected:
                            false,

                        click_tracking:
                            true

                    });
                }

                const phone =
                    String(phone_numbers[index]).trim();

                // -----------------------------------------
                // INSERT RECIPIENT
                // -----------------------------------------

                const recipientQuery = `
                    INSERT INTO sms_campaign_recipients
                    (
                        campaign_id,
                        phone_number,
                        recipient_name,
                        status
                    )
                    VALUES (?, ?, ?, ?)
                `;

                db.query(
                    recipientQuery,
                    [
                        campaignId,
                        phone,
                        null,
                        "PENDING"
                    ],
                    (recipientErr, recipientResult) => {

                        if (recipientErr) {

                            console.error(
                                "SMS recipient insert error:",
                                recipientErr
                            );

                            return res.status(500).json({
                                error:
                                    recipientErr.message
                            });
                        }

                        const recipientId =
                            recipientResult.insertId;

                        // -----------------------------------------
                        // FIND URLs IN MESSAGE
                        // -----------------------------------------

                        const urlRegex =
                            /https?:\/\/[^\s]+/gi;

                        const urls =
                            message.match(urlRegex) || [];

                        // Remove duplicate URLs
                        const uniqueUrls =
                            [...new Set(urls)];

                        // -----------------------------------------
                        // NO URL
                        // -----------------------------------------

                        if (uniqueUrls.length === 0) {

                            return insertSmsMessage(
                                recipientId,
                                phone,
                                message,
                                () => {
                                    processRecipient(
                                        index + 1
                                    );
                                }
                            );
                        }

                        // -----------------------------------------
                        // CREATE TRACKING LINKS
                        // -----------------------------------------

                        let processedCount = 0;

                        let finalMessage = message;

                        const processUrl = (urlIndex) => {

                            // All URLs processed
                            if (
                                urlIndex >=
                                uniqueUrls.length
                            ) {

                                return insertSmsMessage(
                                    recipientId,
                                    phone,
                                    finalMessage,
                                    () => {
                                        processRecipient(
                                            index + 1
                                        );
                                    }
                                );
                            }

                            const originalUrl =
                                uniqueUrls[urlIndex];

                            // -----------------------------------------
                            // CREATE CLICK RECORD
                            // -----------------------------------------

                            const clickInsertQuery = `
                                INSERT INTO sms_clicks
                                (
                                    campaign_id,
                                    recipient_id,
                                    phone_number,
                                    original_url
                                )
                                VALUES (?, ?, ?, ?)
                            `;

                            db.query(
                                clickInsertQuery,
                                [
                                    campaignId,
                                    recipientId,
                                    phone,
                                    originalUrl
                                ],
                                (clickErr, clickResult) => {

                                    if (clickErr) {

                                        console.error(
                                            "SMS click record creation error:",
                                            clickErr
                                        );

                                        return res.status(500).json({
                                            error:
                                                clickErr.message
                                        });
                                    }

                                    const clickId =
                                        clickResult.insertId;

                                    // -----------------------------------------
                                    // CREATE TRACKING URL
                                    // -----------------------------------------

                                    const trackingUrl =
                                        `${req.protocol}://${req.get("host")}/api/sms/track/${clickId}`;

                                    // -----------------------------------------
                                    // SAVE TRACKING URL
                                    // -----------------------------------------

                                    const clickUpdateQuery = `
                                        UPDATE sms_clicks
                                        SET tracking_url = ?
                                        WHERE id = ?
                                    `;

                                    db.query(
                                        clickUpdateQuery,
                                        [
                                            trackingUrl,
                                            clickId
                                        ],
                                        (clickUpdateErr) => {

                                            if (
                                                clickUpdateErr
                                            ) {

                                                console.error(
                                                    "SMS tracking URL update error:",
                                                    clickUpdateErr
                                                );

                                                return res.status(
                                                    500
                                                ).json({
                                                    error:
                                                        clickUpdateErr.message
                                                });
                                            }

                                            // -----------------------------------------
                                            // REPLACE ORIGINAL URL
                                            // -----------------------------------------

                                            finalMessage =
                                                finalMessage.replace(
                                                    originalUrl,
                                                    trackingUrl
                                                );

                                            processedCount++;

                                            processUrl(
                                                urlIndex + 1
                                            );

                                        }
                                    );

                                }
                            );
                        };

                        processUrl(0);

                    }
                );

            };

           // -----------------------------------------
// INSERT SMS MESSAGE + DELIVERY LOG
// -----------------------------------------

function insertSmsMessage(
    recipientId,
    phone,
    finalMessage,
    callback
) {

    const messageQuery = `
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
    `;

    db.query(
        messageQuery,
        [
            user_id || 1,
            sender_id,
            phone,
            finalMessage,
            "QUEUED",
            campaign_name
        ],
        (messageErr, messageResult) => {

            if (messageErr) {

                console.error(
                    "SMS message insert error:",
                    messageErr
                );

                return res.status(500).json({
                    error:
                        messageErr.message
                });
            }

            // -----------------------------------------
            // CREATE DEMO PROVIDER MESSAGE ID
            // -----------------------------------------

            const providerMessageId =
                `DEMO-MSG-${messageResult.insertId}`;

            // -----------------------------------------
            // INSERT DELIVERY LOG
            // -----------------------------------------

            const deliveryLogQuery = `
                INSERT INTO sms_delivery_logs
                (
                    campaign_id,
                    recipient_id,
                    phone_number,
                    provider_message_id,
                    status
                )
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                deliveryLogQuery,
                [
                    campaignId,
                    recipientId,
                    phone,
                    providerMessageId,
                    "PENDING"
                ],
                (logErr) => {

                    if (logErr) {

                        console.error(
                            "SMS delivery log insert error:",
                            logErr
                        );

                        return res.status(500).json({
                            error:
                                logErr.message
                        });
                    }

                    // -----------------------------------------
                    // CONTINUE CAMPAIGN PROCESSING
                    // -----------------------------------------

                    callback();

                }
            );

        }
    );

}
            // -----------------------------------------
            // START PROCESSING
            // -----------------------------------------

            processRecipient(0);

        }
    );

});

// =====================================================
// SMS CLICK REPORT
// =====================================================

// GET ALL SMS CLICKS
router.get("/api/sms/clicks", (req, res) => {

    const query = `
        SELECT
            id,
            campaign_id,
            recipient_id,
            phone_number,
            original_url,
            tracking_url,
            clicked_at,
            ip_address,
            user_agent,
            created_at
        FROM sms_clicks
        ORDER BY id DESC
    `;

    db.query(query, (err, results) => {

        if (err) {

            console.error(
                "SMS clicks query error:",
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
// SMS CLICK TRACKING
// =====================================================

router.get("/api/sms/track/:trackingId", (req, res) => {

    const trackingId = req.params.trackingId;

    if (!trackingId) {
        return res.status(400).send("Invalid tracking ID");
    }

    const query = `
        SELECT
            id,
            campaign_id,
            recipient_id,
            phone_number,
            original_url
        FROM sms_clicks
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        query,
        [trackingId],
        (err, results) => {

            if (err) {
                console.error(
                    "SMS click tracking lookup error:",
                    err
                );

                return res.status(500).send(
                    "Unable to process click"
                );
            }

            if (results.length === 0) {
                return res.status(404).send(
                    "Tracking link not found"
                );
            }

            const click = results[0];

            const updateQuery = `
                UPDATE sms_clicks
                SET
                    clicked_at = NOW(),
                    ip_address = ?,
                    user_agent = ?
                WHERE id = ?
            `;

            const ipAddress =
                req.headers["x-forwarded-for"] ||
                req.socket.remoteAddress ||
                null;

            const userAgent =
                req.headers["user-agent"] ||
                null;

            db.query(
                updateQuery,
                [
                    ipAddress,
                    userAgent,
                    click.id
                ],
                (updateErr) => {

                    if (updateErr) {

                        console.error(
                            "SMS click update error:",
                            updateErr
                        );

                        return res.status(500).send(
                            "Unable to record click"
                        );
                    }

                    // Redirect the user to the original URL
                    return res.redirect(
                        click.original_url
                    );

                }
            );

        }
    );

});

// =====================================================
// CREATE SMS TRACKING LINK
// =====================================================

router.post("/api/sms/clicks/create", (req, res) => {

    const {
        campaign_id,
        recipient_id,
        phone_number,
        original_url
    } = req.body;

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!original_url) {
        return res.status(400).json({
            error: "original_url is required"
        });
    }

    // -----------------------------------------
    // FIRST CREATE THE CLICK RECORD
    // -----------------------------------------

    const insertQuery = `
        INSERT INTO sms_clicks
        (
            campaign_id,
            recipient_id,
            phone_number,
            original_url
        )
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        insertQuery,
        [
            campaign_id || null,
            recipient_id || null,
            phone_number || null,
            original_url
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "SMS click record creation error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            const clickId = result.insertId;

            // -----------------------------------------
            // CREATE TRACKING URL
            // -----------------------------------------

            const trackingUrl =
                `${req.protocol}://${req.get("host")}/api/sms/track/${clickId}`;

            // -----------------------------------------
            // SAVE TRACKING URL
            // -----------------------------------------

            const updateQuery = `
                UPDATE sms_clicks
                SET tracking_url = ?
                WHERE id = ?
            `;

            db.query(
                updateQuery,
                [
                    trackingUrl,
                    clickId
                ],
                (updateErr) => {

                    if (updateErr) {

                        console.error(
                            "SMS tracking URL update error:",
                            updateErr
                        );

                        return res.status(500).json({
                            error: updateErr.message
                        });
                    }

                    return res.status(201).json({

                        success: true,

                        click_id: clickId,

                        original_url:
                            original_url,

                        tracking_url:
                            trackingUrl

                    });

                }
            );

        }
    );

});


// =====================================================
// SMS DELIVERY STATUS UPDATE
// =====================================================

router.put(
    "/api/sms/delivery-status",
    (req, res) => {

        const {
            provider_message_id,
            status,
            failure_reason
        } = req.body;

        if (!provider_message_id) {
            return res.status(400).json({
                error:
                    "provider_message_id is required"
            });
        }

        if (!status) {
            return res.status(400).json({
                error:
                    "status is required"
            });
        }

        const allowedStatuses = [
            "PENDING",
            "SENT",
            "DELIVERED",
            "FAILED"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({

                error:
                    "Invalid status",

                allowed_statuses:
                    allowedStatuses

            });
        }

        let query;
        let params;

        if (status === "DELIVERED") {

            query = `
                UPDATE sms_delivery_logs
                SET
                    status = ?,
                    delivered_at = NOW(),
                    failure_reason = NULL
                WHERE provider_message_id = ?
            `;

            params = [
                status,
                provider_message_id
            ];

        } else if (status === "FAILED") {

            query = `
                UPDATE sms_delivery_logs
                SET
                    status = ?,
                    failure_reason = ?,
                    delivered_at = NULL
                WHERE provider_message_id = ?
            `;

            params = [
                status,
                failure_reason ||
                    "SMS delivery failed",
                provider_message_id
            ];

        } else {

            query = `
                UPDATE sms_delivery_logs
                SET
                    status = ?
                WHERE provider_message_id = ?
            `;

            params = [
                status,
                provider_message_id
            ];

        }

        db.query(
            query,
            params,
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        error:
                            "SMS delivery log not found"
                    });
                }

                res.json({

                    message:
                        "SMS delivery status updated successfully",

                    provider_message_id:
                        provider_message_id,

                    status:
                        status

                });

            }
        );

    }
);


// =====================================================
// SCHEDULE SMS CAMPAIGN
// =====================================================

router.post("/api/sms/schedule", (req, res) => {

    const {
        user_id,
        sender_id,
        template_id,
        campaign_name,
        phone_numbers,
        message,
        scheduled_at
    } = req.body;

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!sender_id) {
        return res.status(400).json({
            error: "sender_id is required"
        });
    }

    if (!campaign_name || !campaign_name.trim()) {
        return res.status(400).json({
            error: "campaign_name is required"
        });
    }

    if (!message || !message.trim()) {
        return res.status(400).json({
            error: "message is required"
        });
    }

    if (
        !Array.isArray(phone_numbers) ||
        phone_numbers.length === 0
    ) {
        return res.status(400).json({
            error: "At least one phone number is required"
        });
    }

    if (!scheduled_at) {
        return res.status(400).json({
            error: "scheduled_at is required"
        });
    }

    // -----------------------------------------
    // VALIDATE SCHEDULED DATE/TIME
    // -----------------------------------------

    const scheduledDate = new Date(scheduled_at);

    if (Number.isNaN(scheduledDate.getTime())) {
        return res.status(400).json({
            error: "Invalid scheduled_at date/time"
        });
    }

    if (scheduledDate <= new Date()) {
        return res.status(400).json({
            error: "Scheduled time must be in the future"
        });
    }

    // -----------------------------------------
    // CREATE SCHEDULED CAMPAIGN
    // -----------------------------------------

    const campaignQuery = `
        INSERT INTO sms_campaigns
        (
            user_id,
            sender_id,
            template_id,
            campaign_name,
            gateway,
            status,
            scheduled_at,
            scheduled_message,
            total_recipients
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        campaignQuery,
        [
            user_id || 1,
            sender_id,
            template_id || null,
            campaign_name.trim(),
            "DEMO",
            "SCHEDULED",
            scheduled_at,
            message.trim(),
            phone_numbers.length
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "SMS scheduled campaign creation error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            const campaignId = result.insertId;

            // -----------------------------------------
            // ADD RECIPIENTS
            // -----------------------------------------

            const recipientQuery = `
                INSERT INTO sms_campaign_recipients
                (
                    campaign_id,
                    phone_number,
                    recipient_name,
                    status
                )
                VALUES (?, ?, ?, ?)
            `;

            let processed = 0;

            const processRecipient = (index) => {

                if (index >= phone_numbers.length) {

                    return res.status(201).json({
                        success: true,
                        message:
                            "SMS campaign scheduled successfully",
                        campaign_id: campaignId,
                        campaign_name:
                            campaign_name.trim(),
                        total_recipients:
                            phone_numbers.length,
                        scheduled_at:
                            scheduled_at,
                        status:
                            "SCHEDULED"
                    });
                }

                const phone =
                    String(phone_numbers[index]).trim();

                db.query(
                    recipientQuery,
                    [
                        campaignId,
                        phone,
                        null,
                        "SCHEDULED"
                    ],
                    (recipientErr) => {

                        if (recipientErr) {

                            console.error(
                                "Scheduled SMS recipient creation error:",
                                recipientErr
                            );

                            return res.status(500).json({
                                error:
                                    recipientErr.message
                            });
                        }

                        processed++;

                        processRecipient(
                            index + 1
                        );
                    }
                );
            };

            processRecipient(0);
        }
    );
});


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
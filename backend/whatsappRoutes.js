const express = require("express");
const router = express.Router();
const db = require("./db");


const twilio = require("twilio");

const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_WHATSAPP_FROM =
    process.env.TWILIO_WHATSAPP_FROM;


// =====================================================
// GET ALL WHATSAPP TEMPLATES
// =====================================================

router.get("/api/whatsapp/templates", (req, res) => {

    const query = `
        SELECT
            id,
            user_id,
            whatsapp_number_id,
            template_name,
            category,
            template_type,
            template_content,
            status,
            created_at
        FROM whatsapp_templates
        ORDER BY id DESC
    `;

    db.query(query, (err, results) => {

        if (err) {
            console.error(
                "WhatsApp templates query error:",
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
// GET SINGLE WHATSAPP TEMPLATE
// =====================================================

router.get("/api/whatsapp/templates/:id", (req, res) => {

    const templateId = req.params.id;

    const query = `
        SELECT
            id,
            user_id,
            whatsapp_number_id,
            template_name,
            category,
            template_type,
            template_content,
            status,
            created_at
        FROM whatsapp_templates
        WHERE id = ?
    `;

    db.query(
        query,
        [templateId],
        (err, results) => {

            if (err) {
                console.error(
                    "WhatsApp template query error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    error: "WhatsApp template not found"
                });
            }

            res.json({
                message:
                    "WhatsApp template retrieved successfully",

                template:
                    results[0]
            });

        }
    );

});

// =====================================================
// ADD WHATSAPP TEMPLATE
// =====================================================

router.post("/api/whatsapp/templates", (req, res) => {

    const {
        user_id,
        whatsapp_number_id,
        template_name,
        category,
        template_type,
        template_content,
        status
    } = req.body;

    // =========================================
    // VALIDATION
    // =========================================

    if (!whatsapp_number_id) {
        return res.status(400).json({
            error: "Please select a WhatsApp number."
        });
    }

    if (!template_name || !template_name.trim()) {
        return res.status(400).json({
            error: "Template name is required."
        });
    }

    if (!template_content || !template_content.trim()) {
        return res.status(400).json({
            error: "Template content is required."
        });
    }

    // =========================================
    // INSERT
    // =========================================

    const query = `
        INSERT INTO whatsapp_templates
        (
            user_id,
            whatsapp_number_id,
            template_name,
            category,
            template_type,
            template_content,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        query,
        [
            user_id || 1,
            whatsapp_number_id,
            template_name.trim(),
            category || "MARKETING",
            template_type || "CUSTOM",
            template_content.trim(),
            status || "PENDING"
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "WhatsApp template insert error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message: "WhatsApp template created successfully",
                id: result.insertId
            });
        }
    );
});


// =====================================================
// GET WHATSAPP NUMBERS
// =====================================================

router.get("/api/whatsapp/numbers", (req, res) => {

    const query = `
        SELECT
            id,
            phone_number
        FROM whatsapp_numbers
        WHERE user_id = ?
        ORDER BY id ASC
    `;

    db.query(query, [1], (err, results) => {

        if (err) {
            console.error(
                "WhatsApp numbers fetch error:",
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
// GET ALL WHATSAPP RECIPIENTS
// =====================================================

router.get("/api/whatsapp/recipients", (req, res) => {

    const query = `
        SELECT
            r.id,
            r.campaign_id,
            r.phone_number,
            r.recipient_name,
            r.status,
            r.created_at,
            c.campaign_name
        FROM whatsapp_campaign_recipients r
        LEFT JOIN whatsapp_campaigns c
            ON r.campaign_id = c.id
        ORDER BY r.id DESC
    `;

    db.query(query, (err, results) => {

        if (err) {
            console.error(
                "WhatsApp recipients query error:",
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
// ADD WHATSAPP RECIPIENT
// =====================================================

router.post("/api/whatsapp/recipients", (req, res) => {

    const {
        campaign_id,
        recipient_name,
        phone_number
    } = req.body;

    // =========================================
    // VALIDATE NAME
    // =========================================

    if (!recipient_name || !recipient_name.trim()) {
        return res.status(400).json({
            error: "Recipient name is required"
        });
    }

    // =========================================
    // VALIDATE PHONE NUMBER
    // =========================================

    if (!phone_number || !phone_number.trim()) {
        return res.status(400).json({
            error: "Phone number is required"
        });
    }

    const cleanedPhoneNumber =
        phone_number.trim().replace(/\s+/g, "");

    // Supports numbers such as:
    // +919876543210
    // 919876543210
    // 9876543210

    const phoneRegex = /^\+?[0-9]{10,15}$/;

    if (!phoneRegex.test(cleanedPhoneNumber)) {
        return res.status(400).json({
            error:
                "Invalid phone number. Use 10 to 15 digits."
        });
    }

    // =========================================
    // VALIDATE CAMPAIGN
    // =========================================

    if (!campaign_id) {
        return res.status(400).json({
            error: "Campaign ID is required"
        });
    }

    // =========================================
    // GET CAMPAIGN
    // =========================================

    const campaignQuery = `
        SELECT
            id,
            campaign_name,
            status,
            total_recipients
        FROM whatsapp_campaigns
        WHERE id = ?
    `;

    db.query(
        campaignQuery,
        [campaign_id],
        (err, campaignResults) => {

            if (err) {
                console.error(
                    "WhatsApp campaign lookup error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            if (campaignResults.length === 0) {
                return res.status(404).json({
                    error:
                        "WhatsApp campaign not found"
                });
            }

            const campaign =
                campaignResults[0];

            // =========================================
            // PREVENT ADDING TO SENT CAMPAIGN
            // =========================================

            if (campaign.status === "SENT") {
                return res.status(400).json({
                    error:
                        "Cannot add a recipient to a campaign that has already been sent"
                });
            }

            // =========================================
            // CHECK DUPLICATE IN SAME CAMPAIGN
            // =========================================

            const duplicateQuery = `
                SELECT
                    id
                FROM whatsapp_campaign_recipients
                WHERE campaign_id = ?
                AND phone_number = ?
                LIMIT 1
            `;

            db.query(
                duplicateQuery,
                [
                    campaign_id,
                    cleanedPhoneNumber
                ],
                (duplicateErr, duplicateResults) => {

                    if (duplicateErr) {
                        return res.status(500).json({
                            error:
                                duplicateErr.message
                        });
                    }

                    if (duplicateResults.length > 0) {
                        return res.status(409).json({
                            error:
                                "This phone number already exists in the selected campaign"
                        });
                    }

                    // =========================================
                    // INSERT RECIPIENT
                    // =========================================

                    const insertQuery = `
                        INSERT INTO whatsapp_campaign_recipients
                        (
                            campaign_id,
                            phone_number,
                            recipient_name,
                            status
                        )
                        VALUES (?, ?, ?, ?)
                    `;

                    db.query(
                        insertQuery,
                        [
                            campaign_id,
                            cleanedPhoneNumber,
                            recipient_name.trim(),
                            "PENDING"
                        ],
                        (insertErr, insertResult) => {

                            if (insertErr) {
                                console.error(
                                    "WhatsApp recipient insert error:",
                                    insertErr
                                );

                                return res.status(500).json({
                                    error:
                                        insertErr.message
                                });
                            }

                            // =========================================
                            // UPDATE CAMPAIGN COUNT
                            // =========================================

                            const updateCampaignQuery = `
                                UPDATE whatsapp_campaigns
                                SET total_recipients = (
                                    SELECT COUNT(*)
                                    FROM whatsapp_campaign_recipients
                                    WHERE campaign_id = ?
                                )
                                WHERE id = ?
                            `;

                            db.query(
                                updateCampaignQuery,
                                [
                                    campaign_id,
                                    campaign_id
                                ],
                                (updateErr) => {

                                    if (updateErr) {
                                        console.error(
                                            "Campaign recipient count update error:",
                                            updateErr
                                        );

                                        return res.status(500).json({
                                            error:
                                                updateErr.message
                                        });
                                    }

                                    // =========================================
                                    // FINAL RESPONSE
                                    // =========================================

                                    res.status(201).json({

                                        message:
                                            "WhatsApp recipient added successfully",

                                        recipient: {
                                            id:
                                                insertResult.insertId,

                                            campaign_id:
                                                Number(campaign_id),

                                            campaign_name:
                                                campaign.campaign_name,

                                            recipient_name:
                                                recipient_name.trim(),

                                            phone_number:
                                                cleanedPhoneNumber,

                                            status:
                                                "PENDING"
                                        }

                                    });

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});


// =====================================================
// GET ALL WHATSAPP CAMPAIGNS
// =====================================================

router.get("/api/whatsapp/campaigns", (req, res) => {

    const query = `
        SELECT
            id,
            user_id,
            whatsapp_number_id,
            template_id,
            campaign_name,
            status,
            total_recipients,
            created_at
        FROM whatsapp_campaigns
        ORDER BY id DESC
    `;

    db.query(query, (err, results) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(results);

    });

});

// =====================================================
// CREATE WHATSAPP CAMPAIGN
// =====================================================

router.post("/api/whatsapp/campaigns", (req, res) => {

    const {
        campaign_name,
        template_id
    } = req.body;

    // =========================================
    // VALIDATE CAMPAIGN NAME
    // =========================================

    if (!campaign_name || !campaign_name.trim()) {
        return res.status(400).json({
            error: "Campaign name is required"
        });
    }

    // =========================================
    // VALIDATE TEMPLATE
    // =========================================

    if (!template_id) {
        return res.status(400).json({
            error: "Template ID is required"
        });
    }

    // =========================================
    // CHECK TEMPLATE
    // =========================================

    const templateQuery = `
        SELECT
            id,
            user_id,
            whatsapp_number_id
        FROM whatsapp_templates
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        templateQuery,
        [template_id],
        (templateErr, templateResults) => {

            if (templateErr) {
                console.error(
                    "WhatsApp template lookup error:",
                    templateErr
                );

                return res.status(500).json({
                    error: templateErr.message
                });
            }

            if (templateResults.length === 0) {
                return res.status(404).json({
                    error: "WhatsApp template not found"
                });
            }

            const template = templateResults[0];

            // =========================================
            // CREATE DRAFT CAMPAIGN
            // =========================================

            const insertQuery = `
                INSERT INTO whatsapp_campaigns
                (
                    user_id,
                    whatsapp_number_id,
                    template_id,
                    campaign_name,
                    status,
                    total_recipients
                )
                VALUES (?, ?, ?, ?, 'DRAFT', 0)
            `;

            db.query(
                insertQuery,
                [
                    template.user_id,
                    template.whatsapp_number_id,
                    template.id,
                    campaign_name.trim()
                ],
                (insertErr, result) => {

                    if (insertErr) {
                        console.error(
                            "WhatsApp campaign creation error:",
                            insertErr
                        );

                        return res.status(500).json({
                            error: insertErr.message
                        });
                    }

                    // =========================================
                    // RETURN CREATED CAMPAIGN
                    // =========================================

                    const getQuery = `
                        SELECT
                            id,
                            user_id,
                            whatsapp_number_id,
                            template_id,
                            campaign_name,
                            status,
                            total_recipients,
                            created_at
                        FROM whatsapp_campaigns
                        WHERE id = ?
                    `;

                    db.query(
                        getQuery,
                        [result.insertId],
                        (getErr, campaignResults) => {

                            if (getErr) {
                                return res.status(500).json({
                                    error: getErr.message
                                });
                            }

                            return res.status(201).json({

                                message:
                                    "WhatsApp campaign created successfully",

                                campaign:
                                    campaignResults[0]

                            });

                        }
                    );

                }
            );

        }
    );

});


// =====================================================
// GET WHATSAPP CAMPAIGN
// =====================================================

router.get("/api/whatsapp/campaigns/:id", (req, res) => {

    const campaignId = req.params.id;

    const campaignQuery = `
        SELECT
            id,
            user_id,
            whatsapp_number_id,
            template_id,
            campaign_name,
            status,
            total_recipients,
            created_at
        FROM whatsapp_campaigns
        WHERE id = ?
    `;

    db.query(
        campaignQuery,
        [campaignId],
        (err, campaignResults) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (campaignResults.length === 0) {
                return res.status(404).json({
                    error:
                        "WhatsApp campaign not found"
                });
            }

            const campaign =
                campaignResults[0];

            const recipientQuery = `
                SELECT
                    id,
                    campaign_id,
                    phone_number,
                    recipient_name,
                    status,
                    created_at
                FROM whatsapp_campaign_recipients
                WHERE campaign_id = ?
                ORDER BY id ASC
            `;

            db.query(
                recipientQuery,
                [campaignId],
                (err, recipientResults) => {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.json({

                        message:
                            "WhatsApp campaign retrieved successfully",

                        campaign:
                            campaign,

                        recipients:
                            recipientResults,

                        total_recipients:
                            recipientResults.length

                    });

                }
            );

        }
    );

});


// =====================================================
// POST: SEND WHATSAPP CAMPAIGN THROUGH TWILIO
// =====================================================

router.post("/api/whatsapp/send", (req, res) => {

    const { campaign_id } = req.body;

    if (!campaign_id) {
        return res.status(400).json({
            error: "campaign_id is required"
        });
    }

    const campaignQuery = `
        SELECT
            id,
            user_id,
            whatsapp_number_id,
            template_id,
            campaign_name,
            status,
            total_recipients
        FROM whatsapp_campaigns
        WHERE id = ?
    `;

    db.query(
        campaignQuery,
        [campaign_id],
        (err, campaignResults) => {

            if (err) {
                console.error(
                    "WhatsApp campaign query error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            if (campaignResults.length === 0) {
                return res.status(404).json({
                    error: "WhatsApp campaign not found"
                });
            }

            const campaign = campaignResults[0];

            if (campaign.status === "SENT") {
                return res.status(400).json({
                    error:
                        "WhatsApp campaign has already been sent"
                });
            }

            const recipientQuery = `
                SELECT
                    id,
                    campaign_id,
                    phone_number,
                    recipient_name,
                    status
                FROM whatsapp_campaign_recipients
                WHERE campaign_id = ?
                ORDER BY id ASC
            `;

            db.query(
                recipientQuery,
                [campaign_id],
                (err, recipients) => {

                    if (err) {
                        console.error(
                            "WhatsApp recipients query error:",
                            err
                        );

                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    if (recipients.length === 0) {
                        return res.status(400).json({
                            error:
                                "No recipients found for this campaign"
                        });
                    }

                    let completed = 0;
                    let failed = 0;
                    let processed = 0;

                    recipients.forEach((recipient) => {

                        const toNumber =
                            recipient.phone_number.startsWith("+")
                                ? recipient.phone_number
                                : `+${recipient.phone_number}`;

                        twilioClient.messages
                            .create({
                                from: TWILIO_WHATSAPP_FROM,
                                to: `whatsapp:${toNumber}`,
                                contentSid:
                                    process.env.TWILIO_WHATSAPP_CONTENT_SID
                            })
                            .then((message) => {

                                console.log(
                                    "Twilio WhatsApp message sent:",
                                    message.sid
                                );

                                const providerMessageId =
                                    message.sid;

                                const insertLogQuery = `
                                    INSERT INTO whatsapp_delivery_logs
                                    (
                                        campaign_id,
                                        recipient_id,
                                        phone_number,
                                        status,
                                        provider_message_id
                                    )
                                    VALUES (?, ?, ?, ?, ?)
                                `;

                                db.query(
                                    insertLogQuery,
                                    [
                                        campaign_id,
                                        recipient.id,
                                        recipient.phone_number,
                                        "SENT",
                                        providerMessageId
                                    ],
                                    (logErr) => {

                                        processed++;

                                        if (logErr) {

                                            console.error(
                                                "WhatsApp delivery log insert error:",
                                                logErr
                                            );

                                            failed++;

                                            checkCompletion();

                                            return;
                                        }

                                        const updateRecipientQuery = `
                                            UPDATE whatsapp_campaign_recipients
                                            SET status = 'SENT'
                                            WHERE id = ?
                                        `;

                                        db.query(
                                            updateRecipientQuery,
                                            [recipient.id],
                                            (updateErr) => {

                                                if (updateErr) {

                                                    console.error(
                                                        "WhatsApp recipient status update error:",
                                                        updateErr
                                                    );

                                                    failed++;

                                                } else {

                                                    completed++;

                                                }

                                                checkCompletion();
                                            }
                                        );
                                    }
                                );
                            })
                            .catch((twilioError) => {

                                console.error(
                                    "Twilio WhatsApp send error:",
                                    twilioError.message
                                );

                                processed++;
                                failed++;

                                checkCompletion();
                            });

                    });

                    function checkCompletion() {

                        if (
                            processed !==
                            recipients.length
                        ) {
                            return;
                        }

                        const finalStatus =
                            completed > 0
                                ? "SENT"
                                : "FAILED";

                        const updateCampaignQuery = `
                            UPDATE whatsapp_campaigns
                            SET
                                status = ?,
                                total_recipients = ?
                            WHERE id = ?
                        `;

                        db.query(
                            updateCampaignQuery,
                            [
                                finalStatus,
                                recipients.length,
                                campaign_id
                            ],
                            (updateErr) => {

                                if (updateErr) {

                                    console.error(
                                        "WhatsApp campaign update error:",
                                        updateErr
                                    );

                                    return res.status(500).json({
                                        error:
                                            updateErr.message
                                    });
                                }

                                res.json({

                                    message:
                                        "WhatsApp campaign processed successfully",

                                    campaign_id:
                                        campaign_id,

                                    campaign_name:
                                        campaign.campaign_name,

                                    total_recipients:
                                        recipients.length,

                                    sent:
                                        completed,

                                    failed:
                                        failed,

                                    status:
                                        finalStatus

                                });

                            }
                        );

                    }

                }
            );

        }
    );

});


// =====================================================
// UPDATE WHATSAPP DELIVERY STATUS
// =====================================================

router.put(
    "/api/whatsapp/delivery-status",
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
            "SENT",
            "DELIVERED",
            "READ",
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

        const findLogQuery = `
            SELECT
                id,
                campaign_id,
                recipient_id,
                phone_number,
                provider_message_id,
                status
            FROM whatsapp_delivery_logs
            WHERE provider_message_id = ?
        `;

        db.query(
            findLogQuery,
            [provider_message_id],
            (err, results) => {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (results.length === 0) {
                    return res.status(404).json({
                        error:
                            "Delivery log not found"
                    });
                }

                const deliveryLog =
                    results[0];

                let updateLogQuery;
                let updateLogParams;

                if (status === "DELIVERED") {

                    updateLogQuery = `
                        UPDATE whatsapp_delivery_logs
                        SET
                            status = ?,
                            delivered_at = NOW(),
                            failure_reason = NULL
                        WHERE provider_message_id = ?
                    `;

                    updateLogParams = [
                        status,
                        provider_message_id
                    ];

                } else if (status === "FAILED") {

                    updateLogQuery = `
                        UPDATE whatsapp_delivery_logs
                        SET
                            status = ?,
                            failure_reason = ?,
                            delivered_at = NULL
                        WHERE provider_message_id = ?
                    `;

                    updateLogParams = [
                        status,
                        failure_reason ||
                            "Message delivery failed",
                        provider_message_id
                    ];

                } else {

                    updateLogQuery = `
                        UPDATE whatsapp_delivery_logs
                        SET
                            status = ?
                        WHERE provider_message_id = ?
                    `;

                    updateLogParams = [
                        status,
                        provider_message_id
                    ];

                }

                db.query(
                    updateLogQuery,
                    updateLogParams,
                    (updateErr) => {

                        if (updateErr) {
                            return res.status(500).json({
                                error:
                                    updateErr.message
                            });
                        }

                        const updateRecipientQuery = `
                            UPDATE whatsapp_campaign_recipients
                            SET status = ?
                            WHERE id = ?
                        `;

                        db.query(
                            updateRecipientQuery,
                            [
                                status,
                                deliveryLog.recipient_id
                            ],
                            (recipientErr) => {

                                if (recipientErr) {
                                    return res.status(500).json({
                                        error:
                                            recipientErr.message
                                    });
                                }

                                res.json({

                                    message:
                                        "WhatsApp delivery status updated successfully",

                                    provider_message_id:
                                        provider_message_id,

                                    recipient_id:
                                        deliveryLog.recipient_id,

                                    phone_number:
                                        deliveryLog.phone_number,

                                    old_status:
                                        deliveryLog.status,

                                    new_status:
                                        status,

                                    delivered_at:
                                        status === "DELIVERED"
                                            ? new Date()
                                            : null,

                                    failure_reason:
                                        status === "FAILED"
                                            ? (
                                                failure_reason ||
                                                "Message delivery failed"
                                            )
                                            : null

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
// ADD RECIPIENTS TO WHATSAPP CAMPAIGN
// =====================================================

router.post("/api/whatsapp/campaigns/:id/recipients", (req, res) => {

    const campaignId = req.params.id;
    const { recipients } = req.body;

    // =========================================
    // VALIDATE INPUT
    // =========================================

    if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
            error: "At least one recipient is required"
        });
    }

    // =========================================
    // CHECK CAMPAIGN
    // =========================================

    const campaignQuery = `
        SELECT
            id,
            campaign_name,
            status
        FROM whatsapp_campaigns
        WHERE id = ?
    `;

    db.query(
        campaignQuery,
        [campaignId],
        (err, campaignResults) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (campaignResults.length === 0) {
                return res.status(404).json({
                    error: "WhatsApp campaign not found"
                });
            }

            const campaign = campaignResults[0];

            // =========================================
            // ONLY DRAFT CAMPAIGNS CAN BE MODIFIED
            // =========================================

            if (campaign.status !== "DRAFT") {
                return res.status(400).json({
                    error: "Recipients can only be added to a DRAFT campaign"
                });
            }

            // =========================================
            // ADD RECIPIENTS ONE BY ONE
            // =========================================

            let completed = 0;
            let skipped = 0;
            let processed = 0;

            recipients.forEach((recipient) => {

                const recipientId = recipient.id;

                // Check whether recipient already exists
                // in this campaign

                const checkQuery = `
                    SELECT id
                    FROM whatsapp_campaign_recipients
                    WHERE campaign_id = ?
                    AND phone_number = ?
                `;

                db.query(
                    checkQuery,
                    [
                        campaignId,
                        recipient.phone_number
                    ],
                    (checkErr, existingResults) => {

                        if (checkErr) {
                            return res.status(500).json({
                                error: checkErr.message
                            });
                        }

                        // =========================================
                        // DUPLICATE RECIPIENT
                        // =========================================

                        if (existingResults.length > 0) {

                            skipped++;
                            processed++;

                            finish();

                            return;
                        }

                        // =========================================
                        // INSERT RECIPIENT
                        // =========================================

                        const insertQuery = `
                            INSERT INTO whatsapp_campaign_recipients
                            (
                                campaign_id,
                                phone_number,
                                recipient_name,
                                status
                            )
                            VALUES (?, ?, ?, 'PENDING')
                        `;

                        db.query(
                            insertQuery,
                            [
                                campaignId,
                                recipient.phone_number,
                                recipient.recipient_name
                            ],
                            (insertErr) => {

                                if (insertErr) {
                                    return res.status(500).json({
                                        error: insertErr.message
                                    });
                                }

                                completed++;
                                processed++;

                                finish();

                            }
                        );

                    }
                );

            });

            // =========================================
            // FINISH PROCESSING
            // =========================================

            function finish() {

                if (processed !== recipients.length) {
                    return;
                }

                // =========================================
                // UPDATE TOTAL RECIPIENTS
                // =========================================

                const countQuery = `
                    SELECT COUNT(*) AS total
                    FROM whatsapp_campaign_recipients
                    WHERE campaign_id = ?
                `;

                db.query(
                    countQuery,
                    [campaignId],
                    (countErr, countResults) => {

                        if (countErr) {
                            return res.status(500).json({
                                error: countErr.message
                            });
                        }

                        const totalRecipients =
                            countResults[0].total;

                        const updateCampaignQuery = `
                            UPDATE whatsapp_campaigns
                            SET total_recipients = ?
                            WHERE id = ?
                        `;

                        db.query(
                            updateCampaignQuery,
                            [
                                totalRecipients,
                                campaignId
                            ],
                            (updateErr) => {

                                if (updateErr) {
                                    return res.status(500).json({
                                        error: updateErr.message
                                    });
                                }

                                res.json({

                                    message:
                                        "Recipients added to campaign successfully",

                                    campaign_id:
                                        campaignId,

                                    added:
                                        completed,

                                    skipped:
                                        skipped,

                                    total_recipients:
                                        totalRecipients

                                });

                            }
                        );

                    }
                );

            }

        }
    );

});

// =====================================================
// ADD NEW RECIPIENT TO WHATSAPP CAMPAIGN
// =====================================================

router.post("/api/whatsapp/campaigns/:id/add-recipient", (req, res) => {

    const campaignId = req.params.id;

    const {
        recipient_name,
        phone_number
    } = req.body;

    // =========================================
    // VALIDATE INPUT
    // =========================================

    if (!recipient_name || !recipient_name.trim()) {
        return res.status(400).json({
            error: "Recipient name is required"
        });
    }

    if (!phone_number || !phone_number.trim()) {
        return res.status(400).json({
            error: "Phone number is required"
        });
    }

    // =========================================
    // CHECK CAMPAIGN
    // =========================================

    const campaignQuery = `
        SELECT
            id,
            campaign_name,
            status
        FROM whatsapp_campaigns
        WHERE id = ?
    `;

    db.query(
        campaignQuery,
        [campaignId],
        (err, campaignResults) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (campaignResults.length === 0) {
                return res.status(404).json({
                    error: "WhatsApp campaign not found"
                });
            }

            const campaign = campaignResults[0];

            // =========================================
            // ONLY DRAFT CAMPAIGNS
            // =========================================

            if (campaign.status !== "DRAFT") {
                return res.status(400).json({
                    error:
                        "Recipients can only be added to a DRAFT campaign"
                });
            }

            // =========================================
            // CHECK DUPLICATE NUMBER
            // =========================================

            const duplicateQuery = `
                SELECT
                    id,
                    recipient_name
                FROM whatsapp_campaign_recipients
                WHERE campaign_id = ?
                AND phone_number = ?
            `;

            db.query(
                duplicateQuery,
                [
                    campaignId,
                    phone_number.trim()
                ],
                (duplicateErr, duplicateResults) => {

                    if (duplicateErr) {
                        return res.status(500).json({
                            error: duplicateErr.message
                        });
                    }

                    if (duplicateResults.length > 0) {
                        return res.status(400).json({
                            error:
                                "This phone number is already added to this campaign"
                        });
                    }

                    // =========================================
                    // INSERT NEW RECIPIENT
                    // =========================================

                    const insertQuery = `
                        INSERT INTO whatsapp_campaign_recipients
                        (
                            campaign_id,
                            phone_number,
                            recipient_name,
                            status
                        )
                        VALUES (?, ?, ?, 'PENDING')
                    `;

                    db.query(
                        insertQuery,
                        [
                            campaignId,
                            phone_number.trim(),
                            recipient_name.trim()
                        ],
                        (insertErr, insertResult) => {

                            if (insertErr) {
                                return res.status(500).json({
                                    error: insertErr.message
                                });
                            }

                            // =========================================
                            // UPDATE TOTAL RECIPIENTS
                            // =========================================

                            const countQuery = `
                                SELECT COUNT(*) AS total
                                FROM whatsapp_campaign_recipients
                                WHERE campaign_id = ?
                            `;

                            db.query(
                                countQuery,
                                [campaignId],
                                (countErr, countResults) => {

                                    if (countErr) {
                                        return res.status(500).json({
                                            error: countErr.message
                                        });
                                    }

                                    const totalRecipients =
                                        countResults[0].total;

                                    const updateCampaignQuery = `
                                        UPDATE whatsapp_campaigns
                                        SET total_recipients = ?
                                        WHERE id = ?
                                    `;

                                    db.query(
                                        updateCampaignQuery,
                                        [
                                            totalRecipients,
                                            campaignId
                                        ],
                                        (updateErr) => {

                                            if (updateErr) {
                                                return res.status(500).json({
                                                    error:
                                                        updateErr.message
                                                });
                                            }

                                            // =========================================
                                            // SUCCESS
                                            // =========================================

                                            res.json({

                                                message:
                                                    "Recipient added successfully",

                                                recipient: {
                                                    id:
                                                        insertResult.insertId,

                                                    campaign_id:
                                                        Number(campaignId),

                                                    recipient_name:
                                                        recipient_name.trim(),

                                                    phone_number:
                                                        phone_number.trim(),

                                                    status:
                                                        "PENDING"
                                                },

                                                total_recipients:
                                                    totalRecipients

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

});


// =====================================================
// AUTOMATIC TWILIO WHATSAPP STATUS SYNC
// =====================================================

async function syncTwilioWhatsAppStatuses() {
    const query = `
        SELECT
            id,
            campaign_id,
            recipient_id,
            provider_message_id,
            status
        FROM whatsapp_delivery_logs
        WHERE provider_message_id LIKE 'MM%'
        AND status NOT IN ('READ', 'FAILED')
        ORDER BY id DESC
        LIMIT 50
    `;

    db.query(query, async (err, logs) => {
        if (err) {
            console.error(
                "Twilio status sync database error:",
                err.message
            );
            return;
        }

        for (const log of logs) {
            try {
                const message = await twilioClient
                    .messages(log.provider_message_id)
                    .fetch();

                let newStatus = null;

                // Twilio status → CPaaS status
                if (message.status === "read") {
                    newStatus = "READ";
                } else if (message.status === "delivered") {
                    newStatus = "DELIVERED";
                } else if (
                    message.status === "failed" ||
                    message.status === "undelivered"
                ) {
                    newStatus = "FAILED";
                } else if (
                    message.status === "sent" ||
                    message.status === "queued" ||
                    message.status === "sending"
                ) {
                    newStatus = "SENT";
                }

                if (!newStatus || newStatus === log.status) {
                    continue;
                }

                let updateQuery;
                let updateParams;

                if (newStatus === "DELIVERED") {
                    updateQuery = `
                        UPDATE whatsapp_delivery_logs
                        SET
                            status = ?,
                            delivered_at = NOW(),
                            failure_reason = NULL
                        WHERE provider_message_id = ?
                    `;

                    updateParams = [
                        newStatus,
                        log.provider_message_id
                    ];

                } else if (newStatus === "FAILED") {
                    updateQuery = `
                        UPDATE whatsapp_delivery_logs
                        SET
                            status = ?,
                            failure_reason = ?
                        WHERE provider_message_id = ?
                    `;

                    updateParams = [
                        newStatus,
                        message.errorMessage ||
                            "Message delivery failed",
                        log.provider_message_id
                    ];

                } else {
                    updateQuery = `
                        UPDATE whatsapp_delivery_logs
                        SET status = ?
                        WHERE provider_message_id = ?
                    `;

                    updateParams = [
                        newStatus,
                        log.provider_message_id
                    ];
                }

                db.query(
                    updateQuery,
                    updateParams,
                    (updateErr) => {
                        if (updateErr) {
                            console.error(
                                "Twilio status update error:",
                                updateErr.message
                            );
                            return;
                        }

                        console.log(
                            `WhatsApp status updated: ${log.provider_message_id} → ${newStatus}`
                        );
                    }
                );

                // Update recipient status too
                db.query(
                    `
                        UPDATE whatsapp_campaign_recipients
                        SET status = ?
                        WHERE id = ?
                    `,
                    [
                        newStatus,
                        log.recipient_id
                    ],
                    (recipientErr) => {
                        if (recipientErr) {
                            console.error(
                                "Recipient status sync error:",
                                recipientErr.message
                            );
                        }
                    }
                );

            } catch (twilioError) {
                console.error(
                    `Twilio status fetch error for ${log.provider_message_id}:`,
                    twilioError.message
                );
            }
        }
    });
}


// Run once when backend starts
syncTwilioWhatsAppStatuses();


// Run automatically every 30 seconds
setInterval(
    syncTwilioWhatsAppStatuses,
    30 * 1000
);



// =====================================================
// TWILIO MESSAGE STATUS
//

router.get("/api/whatsapp/message-status/:sid", async (req, res) => {
    try {
        const message = await twilioClient
            .messages(req.params.sid)
            .fetch();

        res.json({
            sid: message.sid,
            status: message.status,
            to: message.to,
            from: message.from,
            errorCode: message.errorCode,
            errorMessage: message.errorMessage
        });

    } catch (error) {
        console.error(
            "Twilio message status error:",
            error.message
        );

        res.status(500).json({
            error: error.message
        });
    }
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
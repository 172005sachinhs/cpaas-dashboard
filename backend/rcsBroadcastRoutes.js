const express = require("express");
const router = express.Router();
const db = require("./db");

// =====================================================
// RCS BROADCAST ROUTES
// =====================================================
// Uses:
//   rcs_broadcasts
//   rcs_broadcast_recipients
//   rcs_sender_ids
//   rcs_templates
//
// IMPORTANT:
// This module is separate from rcsRoutes.js so the
// existing RCS Sender ID and Template APIs are untouched.
// =====================================================


// =====================================================
// HELPER: NORMALIZE PHONE NUMBER
// =====================================================

function normalizePhoneNumber(value) {
    if (value === undefined || value === null) {
        return null;
    }

    let phone = String(value).trim();

    if (!phone) {
        return null;
    }

    // Remove spaces, hyphens, brackets, etc.
    phone = phone.replace(/[^\d+]/g, "");

    // Convert 00xxxxxxxxxx to +xxxxxxxxxx
    if (phone.startsWith("00")) {
        phone = "+" + phone.substring(2);
    }

    // If number doesn't start with +, assume India
    if (!phone.startsWith("+")) {
        phone = "+91" + phone;
    }

    return phone;
}


// =====================================================
// HELPER: PARSE RECIPIENTS
// =====================================================

function parseRecipients(input) {

    if (!input) {
        return [];
    }

    let values = [];

    // Array
    if (Array.isArray(input)) {
        values = input;
    }

    // String
    else if (typeof input === "string") {

        values = input
            .split(/[\n,;]+/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    const uniqueNumbers = [];

    const seen = new Set();

    values.forEach((item) => {

        let phone = null;
        let name = null;

        // Object:
        // {
        //   phone_number: "+919876543210",
        //   recipient_name: "Sachin"
        // }
        if (
            typeof item === "object" &&
            item !== null
        ) {

            phone = normalizePhoneNumber(
                item.phone_number ||
                item.phone ||
                item.number
            );

            name =
                item.recipient_name ||
                item.name ||
                null;
        }

        else {
            phone = normalizePhoneNumber(item);
        }

        if (!phone) {
            return;
        }

        if (seen.has(phone)) {
            return;
        }

        seen.add(phone);

        uniqueNumbers.push({
            phone_number: phone,
            recipient_name: name
        });
    });

    return uniqueNumbers;
}


// =====================================================
// GET ALL RCS SENDERS FOR BROADCAST
// =====================================================

router.get(
    "/api/rcs/broadcasts/options/senders",
    (req, res) => {

        const query = `
            SELECT
                id,
                user_id,
                brand_name,
                bot_id,
                status,
                created_at
            FROM rcs_sender_ids
            ORDER BY id DESC
        `;

        db.query(query, (err, results) => {

            if (err) {

                console.error(
                    "RCS broadcast sender query error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(results);
        });
    }
);


// =====================================================
// GET ALL RCS TEMPLATES FOR BROADCAST
// =====================================================

router.get(
    "/api/rcs/broadcasts/options/templates",
    (req, res) => {

        const query = `
            SELECT
                id,
                user_id,
                bot_id,
                bot_message_type,
                template_name,
                template_type,
                message_text,
                url_preview,
                card_title,
                card_description,
                media_url,
                button_text,
                button_url,
                carousel_cards,
                status,
                created_at,
                updated_at
            FROM rcs_templates
            ORDER BY id DESC
        `;

        db.query(query, (err, results) => {

            if (err) {

                console.error(
                    "RCS broadcast template query error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            const templates = results.map(
                (template) => {

                    let carouselCards =
                        template.carousel_cards;

                    if (
                        carouselCards &&
                        typeof carouselCards === "string"
                    ) {

                        try {
                            carouselCards =
                                JSON.parse(
                                    carouselCards
                                );
                        }
                        catch (error) {

                            console.error(
                                "Carousel JSON parse error:",
                                error
                            );
                        }
                    }

                    return {
                        ...template,
                        carousel_cards:
                            carouselCards
                    };
                }
            );

            res.json(templates);
        });
    }
);


// =====================================================
// GET ALL BROADCASTS
// =====================================================

router.get(
    "/api/rcs/broadcasts",
    (req, res) => {

        const query = `
            SELECT
                b.id,
                b.user_id,
                b.bot_id,
                b.template_id,
                b.broadcast_name,
                b.gateway,
                b.total_recipients,
                b.sent_count,
                b.delivered_count,
                b.failed_count,
                b.status,
                b.scheduled_at,
                b.created_at,
                b.updated_at,

                s.brand_name,
                s.bot_id AS sender_bot_id,

                t.template_name,
                t.template_type

            FROM rcs_broadcasts b

            LEFT JOIN rcs_sender_ids s
                ON b.bot_id = s.bot_id

            LEFT JOIN rcs_templates t
                ON b.template_id = t.id

            ORDER BY b.id DESC
        `;

        db.query(query, (err, results) => {

            if (err) {

                console.error(
                    "RCS broadcasts query error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(results);
        });
    }
);


// =====================================================
// GET SINGLE BROADCAST
// =====================================================

router.get(
    "/api/rcs/broadcasts/:id",
    (req, res) => {

        const broadcastId = req.params.id;

        const campaignQuery = `
            SELECT
                b.*,

                s.brand_name,
                s.bot_id AS sender_bot_id,
                s.status AS sender_status,

                t.template_name,
                t.template_type,
                t.message_text,
                t.url_preview,
                t.card_title,
                t.card_description,
                t.media_url,
                t.button_text,
                t.button_url,
                t.carousel_cards,
                t.status AS template_status

            FROM rcs_broadcasts b

            LEFT JOIN rcs_sender_ids s
                ON b.bot_id = s.bot_id

            LEFT JOIN rcs_templates t
                ON b.template_id = t.id

            WHERE b.id = ?
        `;

        db.query(
            campaignQuery,
            [broadcastId],
            (err, campaignResults) => {

                if (err) {

                    console.error(
                        "RCS broadcast fetch error:",
                        err
                    );

                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (campaignResults.length === 0) {

                    return res.status(404).json({
                        error:
                            "RCS broadcast not found"
                    });
                }

                const campaign =
                    campaignResults[0];

                let carouselCards =
                    campaign.carousel_cards;

                if (
                    carouselCards &&
                    typeof carouselCards === "string"
                ) {

                    try {
                        carouselCards =
                            JSON.parse(
                                carouselCards
                            );
                    }
                    catch (error) {
                        console.error(
                            "Carousel JSON parse error:",
                            error
                        );
                    }
                }

                campaign.carousel_cards =
                    carouselCards;

                const recipientQuery = `
                    SELECT
                        id,
                        broadcast_id,
                        phone_number,
                        recipient_name,
                        status,
                        error_message,
                        sent_at,
                        delivered_at,
                        created_at

                    FROM rcs_broadcast_recipients

                    WHERE broadcast_id = ?

                    ORDER BY id ASC
                `;

                db.query(
                    recipientQuery,
                    [broadcastId],
                    (recipientErr, recipients) => {

                        if (recipientErr) {

                            console.error(
                                "RCS broadcast recipients fetch error:",
                                recipientErr
                            );

                            return res.status(500).json({
                                error:
                                    recipientErr.message
                            });
                        }

                        res.json({
                            broadcast: campaign,
                            recipients: recipients
                        });
                    }
                );
            }
        );
    }
);


// =====================================================
// CREATE BROADCAST
// =====================================================

router.post(
    "/api/rcs/broadcasts",
    (req, res) => {

        console.log("========== RCS BROADCAST REQUEST ==========");
        console.log(JSON.stringify(req.body, null, 2));
        console.log("==========================================");




        const {
            user_id,
            bot_id,
            template_id,
            broadcast_name,
            gateway,
            recipients,
            phone_numbers,
            scheduled_at
        } = req.body;


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!bot_id) {

            return res.status(400).json({
                error:
                    "bot_id is required"
            });
        }

        if (!template_id) {

            return res.status(400).json({
                error:
                    "template_id is required"
            });
        }

        if (!broadcast_name) {

            return res.status(400).json({
                error:
                    "broadcast_name is required"
            });
        }


        // -------------------------------------------------
        // PARSE RECIPIENTS
        // -------------------------------------------------

        const recipientInput = Array.isArray(phone_numbers)
    ? phone_numbers
    : recipients;

console.log("RCS recipient input:", recipientInput);

const parsedRecipients =
    parseRecipients(recipientInput);

    console.log("========== PARSED RECIPIENTS ==========");
    console.log(parsedRecipients);
    console.log("COUNT:", parsedRecipients.length);
    console.log("=======================================");

console.log(
    "RCS parsed recipients:",
    parsedRecipients
);


        if (parsedRecipients.length === 0) {

            return res.status(400).json({
                error:
                    "At least one valid recipient is required"
            });
        }


        // -------------------------------------------------
        // VERIFY SENDER
        // -------------------------------------------------

        db.query(
            `
            SELECT
                id,
                brand_name,
                bot_id,
                status

            FROM rcs_sender_ids

            WHERE bot_id = ?

            LIMIT 1
            `,
            [bot_id],
            (senderErr, senderResults) => {

                if (senderErr) {

                    console.error(
                        "RCS sender verification error:",
                        senderErr
                    );

                    return res.status(500).json({
                        error:
                            senderErr.message
                    });
                }

                if (senderResults.length === 0) {

                    return res.status(400).json({
                        error:
                            "Selected RCS sender was not found"
                    });
                }


                // -------------------------------------------------
                // VERIFY TEMPLATE
                // -------------------------------------------------

                db.query(
                    `
                    SELECT
                        id,
                        bot_id,
                        template_name,
                        template_type,
                        status

                    FROM rcs_templates

                    WHERE id = ?

                    LIMIT 1
                    `,
                    [template_id],
                    (templateErr, templateResults) => {

                        if (templateErr) {

                            console.error(
                                "RCS template verification error:",
                                templateErr
                            );

                            return res.status(500).json({
                                error:
                                    templateErr.message
                            });
                        }

                        if (
                            templateResults.length === 0
                        ) {

                            return res.status(400).json({
                                error:
                                    "Selected RCS template was not found"
                            });
                        }

                        const template =
                            templateResults[0];


                        // -------------------------------------------------
                        // CHECK TEMPLATE / BOT MATCH
                        // -------------------------------------------------

                        if (
                            template.bot_id &&
                            String(template.bot_id) !==
                            String(bot_id)
                        ) {

                            return res.status(400).json({
                                error:
                                    "Selected template does not belong to the selected sender"
                            });
                        }


                        // -------------------------------------------------
                        // CREATE BROADCAST
                        // -------------------------------------------------

                        const insertQuery = `
                            INSERT INTO rcs_broadcasts
                            (
                                user_id,
                                bot_id,
                                template_id,
                                broadcast_name,
                                gateway,
                                total_recipients,
                                sent_count,
                                delivered_count,
                                failed_count,
                                status,
                                scheduled_at
                            )
                            VALUES
                            (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)
                        `;

                        const initialStatus =
                            scheduled_at
                                ? "SCHEDULED"
                                : "DRAFT";


                        db.query(
                            insertQuery,
                            [
                                user_id || 1,
                                bot_id,
                                template_id,
                                broadcast_name,
                                gateway || null,
                                parsedRecipients.length,
                                initialStatus,
                                scheduled_at || null
                            ],
                            (insertErr, result) => {

                                if (insertErr) {

                                    console.error(
                                        "RCS broadcast insert error:",
                                        insertErr
                                    );

                                    return res.status(500).json({
                                        error:
                                            insertErr.message
                                    });
                                }

                                const broadcastId =
                                    result.insertId;


                                // -------------------------------------------------
                                // INSERT RECIPIENTS
                                // -------------------------------------------------

                                let completed = 0;
                                let failed = false;

                                parsedRecipients.forEach(
                                    (recipient) => {

                                        db.query(
                                            `
                                            INSERT INTO rcs_broadcast_recipients
                                            (
                                                broadcast_id,
                                                phone_number,
                                                recipient_name,
                                                status
                                            )
                                            VALUES (?, ?, ?, 'PENDING')
                                            `,
                                            [
                                                broadcastId,
                                                recipient.phone_number,
                                                recipient.recipient_name
                                            ],
                                            (recipientErr) => {

                                                if (
                                                    recipientErr &&
                                                    !failed
                                                ) {

                                                    failed = true;

                                                    console.error(
                                                        "RCS recipient insert error:",
                                                        recipientErr
                                                    );

                                                    return res.status(500).json({
                                                        error:
                                                            recipientErr.message
                                                    });
                                                }

                                                completed++;

                                                if (
                                                    completed ===
                                                    parsedRecipients.length &&
                                                    !failed
                                                ) {

                                                    res.status(201).json({

                                                        message:
                                                            scheduled_at
                                                                ? "RCS broadcast scheduled successfully"
                                                                : "RCS broadcast created successfully",

                                                        broadcast_id:
                                                            broadcastId,

                                                        broadcast_name:
                                                            broadcast_name,

                                                        bot_id:
                                                            bot_id,

                                                        template_id:
                                                            template_id,

                                                        total_recipients:
                                                            parsedRecipients.length,

                                                        status:
                                                            initialStatus
                                                    });
                                                }
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
// ADD RECIPIENTS TO EXISTING BROADCAST
// =====================================================

router.post(
    "/api/rcs/broadcasts/:id/recipients",
    (req, res) => {

        const broadcastId =
            req.params.id;

        const parsedRecipients =
            parseRecipients(
                req.body.recipients
            );

        if (parsedRecipients.length === 0) {

            return res.status(400).json({
                error:
                    "At least one valid recipient is required"
            });
        }


        db.query(
            `
            SELECT id
            FROM rcs_broadcasts
            WHERE id = ?
            `,
            [broadcastId],
            (broadcastErr, broadcastResults) => {

                if (broadcastErr) {

                    return res.status(500).json({
                        error:
                            broadcastErr.message
                    });
                }

                if (broadcastResults.length === 0) {

                    return res.status(404).json({
                        error:
                            "RCS broadcast not found"
                    });
                }


                let completed = 0;
                let inserted = 0;
                let failed = false;

                parsedRecipients.forEach(
                    (recipient) => {

                        db.query(
                            `
                            INSERT INTO rcs_broadcast_recipients
                            (
                                broadcast_id,
                                phone_number,
                                recipient_name,
                                status
                            )
                            SELECT ?, ?, ?, 'PENDING'
                            WHERE NOT EXISTS
                            (
                                SELECT 1
                                FROM rcs_broadcast_recipients
                                WHERE broadcast_id = ?
                                AND phone_number = ?
                            )
                            `,
                            [
                                broadcastId,
                                recipient.phone_number,
                                recipient.recipient_name,
                                broadcastId,
                                recipient.phone_number
                            ],
                            (err, result) => {

                                if (err && !failed) {

                                    failed = true;

                                    return res.status(500).json({
                                        error:
                                            err.message
                                    });
                                }

                                if (result) {
                                    inserted +=
                                        result.affectedRows;
                                }

                                completed++;

                                if (
                                    completed ===
                                    parsedRecipients.length &&
                                    !failed
                                ) {

                                    db.query(
                                        `
                                        UPDATE rcs_broadcasts
                                        SET total_recipients =
                                            (
                                                SELECT COUNT(*)
                                                FROM rcs_broadcast_recipients
                                                WHERE broadcast_id = ?
                                            )
                                        WHERE id = ?
                                        `,
                                        [
                                            broadcastId,
                                            broadcastId
                                        ],
                                        (updateErr) => {

                                            if (updateErr) {

                                                return res.status(500).json({
                                                    error:
                                                        updateErr.message
                                                });
                                            }

                                            res.json({
                                                message:
                                                    "Recipients added successfully",
                                                broadcast_id:
                                                    broadcastId,
                                                added:
                                                    inserted
                                            });
                                        }
                                    );
                                }
                            }
                        );
                    }
                );
            }
        );
    }
);


// =====================================================
// GET BROADCAST RECIPIENTS
// =====================================================

router.get(
    "/api/rcs/broadcasts/:id/recipients",
    (req, res) => {

        const broadcastId =
            req.params.id;

        db.query(
            `
            SELECT
                id,
                broadcast_id,
                phone_number,
                recipient_name,
                status,
                error_message,
                sent_at,
                delivered_at,
                created_at

            FROM rcs_broadcast_recipients

            WHERE broadcast_id = ?

            ORDER BY id ASC
            `,
            [broadcastId],
            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        error:
                            err.message
                    });
                }

                res.json(results);
            }
        );
    }
);


// =====================================================
// SEND BROADCAST
// =====================================================

router.post(
    "/api/rcs/broadcasts/:id/send",
    (req, res) => {

        const broadcastId =
            req.params.id;


        // -------------------------------------------------
        // GET BROADCAST
        // -------------------------------------------------

        db.query(
            `
            SELECT
                b.*,

                s.brand_name,
                s.status AS sender_status,

                t.template_name,
                t.status AS template_status

            FROM rcs_broadcasts b

            LEFT JOIN rcs_sender_ids s
                ON b.bot_id = s.bot_id

            LEFT JOIN rcs_templates t
                ON b.template_id = t.id

            WHERE b.id = ?
            `,
            [broadcastId],
            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        error:
                            err.message
                    });
                }

                if (results.length === 0) {

                    return res.status(404).json({
                        error:
                            "RCS broadcast not found"
                    });
                }

                const broadcast =
                    results[0];


                // -------------------------------------------------
                // VALIDATION
                // -------------------------------------------------

                if (
                    broadcast.status ===
                    "SENT"
                ) {

                    return res.status(400).json({
                        error:
                            "Broadcast has already been sent"
                    });
                }


                if (
                    broadcast.sender_status &&
                    broadcast.sender_status !==
                    "ACTIVE" &&
                    broadcast.sender_status !==
                    "APPROVED"
                ) {

                    return res.status(400).json({
                        error:
                            "Selected RCS sender is not active"
                    });
                }


                if (
                    broadcast.template_status &&
                    broadcast.template_status !==
                    "APPROVED" &&
                    broadcast.template_status !==
                    "ACTIVE"
                ) {

                    return res.status(400).json({
                        error:
                            "Selected RCS template is not approved"
                    });
                }


                // -------------------------------------------------
                // GET RECIPIENTS
                // -------------------------------------------------

                db.query(
                    `
                    SELECT
                        id,
                        phone_number,
                        recipient_name,
                        status

                    FROM rcs_broadcast_recipients

                    WHERE broadcast_id = ?
                    AND status != 'SENT'
                    `,
                    [broadcastId],
                    (recipientErr, recipients) => {

                        if (recipientErr) {

                            return res.status(500).json({
                                error:
                                    recipientErr.message
                            });
                        }


                        if (
                            recipients.length === 0
                        ) {

                            return res.status(400).json({
                                error:
                                    "No pending recipients found"
                            });
                        }


                        // -------------------------------------------------
                        // MARK BROADCAST PROCESSING
                        // -------------------------------------------------

                        db.query(
                            `
                            UPDATE rcs_broadcasts
                            SET
                                status = 'SENDING'
                            WHERE id = ?
                            `,
                            [broadcastId],
                            (statusErr) => {

                                if (statusErr) {

                                    return res.status(500).json({
                                        error:
                                            statusErr.message
                                    });
                                }


                                let completed = 0;
                                let failedCount = 0;


                                recipients.forEach(
                                    (recipient) => {

                                        // -------------------------------------------------
                                        // CURRENT PROJECT MODE:
                                        // DATABASE SIMULATION
                                        //
                                        // This marks the recipient SENT.
                                        // A real RCS provider API can later
                                        // replace this section.
                                        // -------------------------------------------------

                                        db.query(
                                            `
                                            UPDATE rcs_broadcast_recipients

                                            SET
                                                status = 'SENT',
                                                sent_at = NOW(),
                                                error_message = NULL

                                            WHERE id = ?
                                            `,
                                            [recipient.id],
                                            (updateErr) => {

                                                if (
                                                    updateErr
                                                ) {

                                                    failedCount++;
                                                }

                                                completed++;


                                                if (
                                                    completed ===
                                                    recipients.length
                                                ) {

                                                    const sentCount =
                                                        recipients.length -
                                                        failedCount;


                                                    db.query(
                                                        `
                                                        UPDATE rcs_broadcasts

                                                        SET
                                                            status = ?,
                                                            sent_count = ?,
                                                            failed_count = ?,
                                                            total_recipients =
                                                                (
                                                                    SELECT COUNT(*)
                                                                    FROM rcs_broadcast_recipients
                                                                    WHERE broadcast_id = ?
                                                                )

                                                        WHERE id = ?
                                                        `,
                                                        [
                                                            failedCount > 0
                                                                ? "PARTIAL"
                                                                : "SENT",

                                                            sentCount,

                                                            failedCount,

                                                            broadcastId,

                                                            broadcastId
                                                        ],
                                                        (finalErr) => {

                                                            if (
                                                                finalErr
                                                            ) {

                                                                return res.status(500).json({
                                                                    error:
                                                                        finalErr.message
                                                                });
                                                            }


                                                            res.json({

                                                                message:
                                                                    failedCount > 0
                                                                        ? "RCS broadcast completed with some failures"
                                                                        : "RCS broadcast sent successfully",

                                                                broadcast_id:
                                                                    broadcastId,

                                                                broadcast_name:
                                                                    broadcast.broadcast_name,

                                                                total_recipients:
                                                                    recipients.length,

                                                                sent:
                                                                    sentCount,

                                                                failed:
                                                                    failedCount,

                                                                status:
                                                                    failedCount > 0
                                                                        ? "PARTIAL"
                                                                        : "SENT"
                                                            });
                                                        }
                                                    );
                                                }
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
// SCHEDULE BROADCAST
// =====================================================

router.post(
    "/api/rcs/broadcasts/:id/schedule",
    (req, res) => {

        const broadcastId =
            req.params.id;

        const {
            scheduled_at
        } = req.body;


        if (!scheduled_at) {

            return res.status(400).json({
                error:
                    "scheduled_at is required"
            });
        }


        db.query(
            `
            SELECT id, status
            FROM rcs_broadcasts
            WHERE id = ?
            `,
            [broadcastId],
            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        error:
                            err.message
                    });
                }

                if (results.length === 0) {

                    return res.status(404).json({
                        error:
                            "RCS broadcast not found"
                    });
                }


                if (
                    results[0].status ===
                    "SENT"
                ) {

                    return res.status(400).json({
                        error:
                            "Sent broadcast cannot be scheduled"
                    });
                }


                db.query(
                    `
                    UPDATE rcs_broadcasts

                    SET
                        scheduled_at = ?,
                        status = 'SCHEDULED'

                    WHERE id = ?
                    `,
                    [
                        scheduled_at,
                        broadcastId
                    ],
                    (updateErr) => {

                        if (updateErr) {

                            return res.status(500).json({
                                error:
                                    updateErr.message
                            });
                        }

                        res.json({

                            message:
                                "RCS broadcast scheduled successfully",

                            broadcast_id:
                                broadcastId,

                            scheduled_at:
                                scheduled_at,

                            status:
                                "SCHEDULED"
                        });
                    }
                );
            }
        );
    }
);


// =====================================================
// CANCEL SCHEDULE
// =====================================================

router.post(
    "/api/rcs/broadcasts/:id/cancel",
    (req, res) => {

        const broadcastId =
            req.params.id;

        db.query(
            `
            UPDATE rcs_broadcasts

            SET
                status = 'DRAFT',
                scheduled_at = NULL

            WHERE id = ?

            AND status = 'SCHEDULED'
            `,
            [broadcastId],
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
                            "Scheduled broadcast not found"
                    });
                }

                res.json({

                    message:
                        "Broadcast schedule cancelled",

                    broadcast_id:
                        broadcastId,

                    status:
                        "DRAFT"
                });
            }
        );
    }
);


// =====================================================
// UPDATE BROADCAST
// =====================================================

router.put(
    "/api/rcs/broadcasts/:id",
    (req, res) => {

        const broadcastId =
            req.params.id;

        const {
            broadcast_name,
            gateway,
            bot_id,
            template_id
        } = req.body;


        if (
            !broadcast_name &&
            !gateway &&
            !bot_id &&
            !template_id
        ) {

            return res.status(400).json({
                error:
                    "At least one field is required"
            });
        }


        const query = `
            UPDATE rcs_broadcasts

            SET
                broadcast_name =
                    COALESCE(?, broadcast_name),

                gateway =
                    COALESCE(?, gateway),

                bot_id =
                    COALESCE(?, bot_id),

                template_id =
                    COALESCE(?, template_id)

            WHERE id = ?
        `;


        db.query(
            query,
            [
                broadcast_name || null,
                gateway || null,
                bot_id || null,
                template_id || null,
                broadcastId
            ],
            (err, result) => {

                if (err) {

                    console.error(
                        "RCS broadcast update error:",
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
                            "RCS broadcast not found"
                    });
                }


                res.json({

                    message:
                        "RCS broadcast updated successfully",

                    broadcast_id:
                        broadcastId
                });
            }
        );
    }
);


// =====================================================
// DELETE BROADCAST
// =====================================================

router.delete(
    "/api/rcs/broadcasts/:id",
    (req, res) => {

        const broadcastId =
            req.params.id;


        db.query(
            `
            DELETE FROM rcs_broadcasts
            WHERE id = ?
            `,
            [broadcastId],
            (err, result) => {

                if (err) {

                    console.error(
                        "RCS broadcast delete error:",
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
                            "RCS broadcast not found"
                    });
                }


                res.json({

                    message:
                        "RCS broadcast deleted successfully",

                    broadcast_id:
                        broadcastId
                });
            }
        );
    }
);


// =====================================================
// BROADCAST REPORT
// =====================================================

router.get(
    "/api/rcs/broadcasts/:id/report",
    (req, res) => {

        const broadcastId =
            req.params.id;


        db.query(
            `
            SELECT

                b.id AS broadcast_id,
                b.broadcast_name,
                b.status,

                COUNT(r.id) AS total_recipients,

                SUM(
                    CASE
                        WHEN r.status = 'SENT'
                        THEN 1
                        ELSE 0
                    END
                ) AS sent,

                SUM(
                    CASE
                        WHEN r.status = 'DELIVERED'
                        THEN 1
                        ELSE 0
                    END
                ) AS delivered,

                SUM(
                    CASE
                        WHEN r.status = 'FAILED'
                        THEN 1
                        ELSE 0
                    END
                ) AS failed,

                SUM(
                    CASE
                        WHEN r.status = 'PENDING'
                        THEN 1
                        ELSE 0
                    END
                ) AS pending

            FROM rcs_broadcasts b

            LEFT JOIN rcs_broadcast_recipients r
                ON b.id = r.broadcast_id

            WHERE b.id = ?

            GROUP BY
                b.id,
                b.broadcast_name,
                b.status
            `,
            [broadcastId],
            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        error:
                            err.message
                    });
                }


                if (
                    results.length === 0
                ) {

                    return res.status(404).json({
                        error:
                            "RCS broadcast report not found"
                    });
                }


                const report =
                    results[0];


                res.json({

                    broadcast_id:
                        report.broadcast_id,

                    broadcast_name:
                        report.broadcast_name,

                    status:
                        report.status,

                    total_recipients:
                        Number(
                            report.total_recipients || 0
                        ),

                    sent:
                        Number(
                            report.sent || 0
                        ),

                    delivered:
                        Number(
                            report.delivered || 0
                        ),

                    failed:
                        Number(
                            report.failed || 0
                        ),

                    pending:
                        Number(
                            report.pending || 0
                        )
                });
            }
        );
    }
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;
const express = require("express");

const router = express.Router();

const db = require("./db");

// =====================================================
// GET ALL RCS SENDER IDS
// =====================================================

router.get("/api/rcs/sender-ids", (req, res) => {
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
                "RCS sender IDs query error:",
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
// ADD RCS SENDER ID / BOT
// =====================================================

router.post("/api/rcs/sender-ids", (req, res) => {
    const {
        user_id,
        brand_name,
        bot_id,
        status
    } = req.body;

    if (!brand_name) {
        return res.status(400).json({
            error: "brand_name is required"
        });
    }

    if (!bot_id) {
        return res.status(400).json({
            error: "bot_id is required"
        });
    }

    const query = `
        INSERT INTO rcs_sender_ids
        (
            user_id,
            brand_name,
            bot_id,
            status
        )
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        query,
        [
            user_id || 1,
            brand_name,
            bot_id,
            status || "APPROVED"
        ],
        (err, result) => {
            if (err) {
                console.error(
                    "RCS sender ID insert error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message:
                    "RCS sender ID created successfully",
                id:
                    result.insertId,
                brand_name:
                    brand_name,
                bot_id:
                    bot_id,
                status:
                    status || "APPROVED"
            });
        }
    );
});


// =====================================================
// UPDATE RCS SENDER ID / BOT
// =====================================================

router.put("/api/rcs/sender-ids/:id", (req, res) => {
    const senderId = req.params.id;

    const {
        brand_name,
        bot_id,
        status
    } = req.body;

    if (!brand_name && !bot_id && !status) {
        return res.status(400).json({
            error:
                "brand_name, bot_id or status is required"
        });
    }

    const query = `
        UPDATE rcs_sender_ids
        SET
            brand_name = COALESCE(?, brand_name),
            bot_id = COALESCE(?, bot_id),
            status = COALESCE(?, status)
        WHERE id = ?
    `;

    db.query(
        query,
        [
            brand_name || null,
            bot_id || null,
            status || null,
            senderId
        ],
        (err, result) => {
            if (err) {
                console.error(
                    "RCS sender ID update error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error:
                        "RCS sender ID not found"
                });
            }

            res.json({
                message:
                    "RCS sender ID updated successfully",
                id:
                    senderId
            });
        }
    );
});


// =====================================================
// DELETE RCS SENDER ID / BOT
// =====================================================

router.delete("/api/rcs/sender-ids/:id", (req, res) => {
    const senderId = req.params.id;

    const query = `
        DELETE FROM rcs_sender_ids
        WHERE id = ?
    `;

    db.query(
        query,
        [senderId],
        (err, result) => {
            if (err) {
                console.error(
                    "RCS sender ID delete error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error:
                        "RCS sender ID not found"
                });
            }

            res.json({
                message:
                    "RCS sender ID deleted successfully",
                id:
                    senderId
            });
        }
    );
});


// =====================================================
// RCS TEMPLATES
// =====================================================

// =====================================================
// GET ALL RCS TEMPLATES
// =====================================================

router.get("/api/rcs/templates", (req, res) => {

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
                "RCS templates query error:",
                err
            );

            return res.status(500).json({
                error: err.message
            });
        }

        const templates = results.map((template) => {

            let carouselCards =
                template.carousel_cards;

            if (
                carouselCards &&
                typeof carouselCards === "string"
            ) {
                try {
                    carouselCards =
                        JSON.parse(carouselCards);
                } catch (parseError) {
                    console.error(
                        "Carousel JSON parse error:",
                        parseError
                    );
                }
            }

            return {
                ...template,
                carousel_cards:
                    carouselCards
            };
        });

        res.json(templates);
    });
});


// =====================================================
// ADD RCS TEMPLATE
// =====================================================

router.post("/api/rcs/templates", (req, res) => {

    const {
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
        status
    } = req.body;

    if (!bot_id) {
        return res.status(400).json({
            error: "bot_id is required"
        });
    }

    if (!bot_message_type) {
        return res.status(400).json({
            error: "bot_message_type is required"
        });
    }

    if (!template_name) {
        return res.status(400).json({
            error: "template_name is required"
        });
    }

    if (!template_type) {
        return res.status(400).json({
            error: "template_type is required"
        });
    }

    let carouselCardsValue = null;

    if (
        carousel_cards !== undefined &&
        carousel_cards !== null &&
        carousel_cards !== ""
    ) {

        if (typeof carousel_cards === "string") {
            carouselCardsValue = carousel_cards;
        } else {
            try {
                carouselCardsValue =
                    JSON.stringify(carousel_cards);
            } catch (jsonError) {
                return res.status(400).json({
                    error:
                        "Invalid carousel_cards data"
                });
            }
        }
    }

    const query = `
        INSERT INTO rcs_templates
        (
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
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        query,
        [
            user_id || 1,
            bot_id,
            bot_message_type,
            template_name,
            template_type,
            message_text || null,
            url_preview || null,
            card_title || null,
            card_description || null,
            media_url || null,
            button_text || null,
            button_url || null,
            carouselCardsValue,
            status || "PENDING"
        ],
        (err, result) => {

            if (err) {
                console.error(
                    "RCS template insert error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message:
                    "RCS template created successfully",
                id:
                    result.insertId
            });
        }
    );
});


// =====================================================
// UPDATE RCS TEMPLATE
// =====================================================

router.put("/api/rcs/templates/:id", (req, res) => {

    const templateId = req.params.id;

    const {
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
        status
    } = req.body;

    let carouselCardsValue = null;

    if (
        carousel_cards !== undefined &&
        carousel_cards !== null &&
        carousel_cards !== ""
    ) {

        if (typeof carousel_cards === "string") {

            carouselCardsValue =
                carousel_cards;

        } else {

            try {

                carouselCardsValue =
                    JSON.stringify(carousel_cards);

            } catch (jsonError) {

                return res.status(400).json({
                    error:
                        "Invalid carousel_cards data"
                });
            }
        }
    }

    const query = `
        UPDATE rcs_templates
        SET
            bot_id = COALESCE(?, bot_id),
            bot_message_type = COALESCE(?, bot_message_type),
            template_name = COALESCE(?, template_name),
            template_type = COALESCE(?, template_type),
            message_text = COALESCE(?, message_text),
            url_preview = COALESCE(?, url_preview),
            card_title = COALESCE(?, card_title),
            card_description = COALESCE(?, card_description),
            media_url = COALESCE(?, media_url),
            button_text = COALESCE(?, button_text),
            button_url = COALESCE(?, button_url),
            carousel_cards = COALESCE(?, carousel_cards),
            status = COALESCE(?, status)
        WHERE id = ?
    `;

    db.query(
        query,
        [
            bot_id || null,
            bot_message_type || null,
            template_name || null,
            template_type || null,
            message_text || null,
            url_preview || null,
            card_title || null,
            card_description || null,
            media_url || null,
            button_text || null,
            button_url || null,
            carouselCardsValue,
            status || null,
            templateId
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "RCS template update error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        "RCS template not found"
                });
            }

            res.json({
                message:
                    "RCS template updated successfully",
                id:
                    templateId
            });
        }
    );
});


// =====================================================
// DELETE RCS TEMPLATE
// =====================================================

router.delete("/api/rcs/templates/:id", (req, res) => {

    const templateId = req.params.id;

    const query = `
        DELETE FROM rcs_templates
        WHERE id = ?
    `;

    db.query(
        query,
        [templateId],
        (err, result) => {

            if (err) {

                console.error(
                    "RCS template delete error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        "RCS template not found"
                });
            }

            res.json({
                message:
                    "RCS template deleted successfully",
                id:
                    templateId
            });
        }
    );
});


// =====================================================
// RCS CONTACTS
// =====================================================

// GET CONTACTS FOR RCS BROADCAST
// Uses the existing whatsapp_numbers table.
// READ ONLY - does not modify WhatsApp data.
// =====================================================

router.get("/api/rcs/contacts", (req, res) => {
    const userId = Number(req.query.user_id) || 1;

    const query = `
        SELECT
            id,
            user_id,
            phone_number,
            business_name,
            meta_business_id,
            status,
            created_at
        FROM whatsapp_numbers
        WHERE user_id = ?
        ORDER BY id DESC
    `;

    db.query(
        query,
        [userId],
        (err, results) => {
            if (err) {
                console.error(
                    "RCS contacts query error:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Unable to load RCS contacts",
                    details: err.message
                });
            }

            res.json(results);
        }
    );
});


// =====================================================
// RCS CAMPAIGN REPORT - READ ONLY
// Uses the existing RCS broadcast/template/sender/user tables.
// =====================================================

router.get("/api/rcs/reports", (req, res) => {
    const userId = Number(req.query.user_id) || 1;

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

            COALESCE(
                u.name,
                CONCAT('User ', b.user_id)
            ) AS user_name,

            COALESCE(
                s.brand_name,
                '-'
            ) AS brand_name,

            COALESCE(
                t.template_name,
                '-'
            ) AS template_name,

            COALESCE(
                t.template_type,
                '-'
            ) AS template_type,

            COALESCE(
                t.bot_message_type,
                '-'
            ) AS bot_message_type,

            COALESCE(
                t.status,
                '-'
            ) AS template_status,

            CONCAT(
                'RCS-',
                b.id
            ) AS message_id,

            LOWER(
                REPLACE(
                    COALESCE(
                        t.template_type,
                        '-'
                    ),
                    '_',
                    ' '
                )
            ) AS category,

            'RCS-COMPOSE' AS report_type,

            ROUND(
                COALESCE(
                    b.total_recipients,
                    0
                ) * 0.200,
                3
            ) AS total_cost

        FROM rcs_broadcasts b

        LEFT JOIN users u
            ON u.id = b.user_id

        LEFT JOIN rcs_sender_ids s
            ON s.bot_id = b.bot_id

        LEFT JOIN rcs_templates t
            ON t.id = b.template_id

        WHERE b.user_id = ?

        ORDER BY b.id DESC
    `;

    db.query(
        query,
        [userId],
        (err, results) => {

            if (err) {

                console.error(
                    "RCS campaign report query error:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Unable to load RCS campaign report",
                    details:
                        err.message
                });
            }

            res.json(results);
        }
    );
});


// =====================================================
// RCS NUMBER LOGS
// =====================================================

router.get(
    "/api/rcs/reports/number-logs",
    (req, res) => {

        const userId =
            Number(req.query.user_id) || 1;

        const query = `
            SELECT
                r.id,
                r.broadcast_id,
                r.phone_number,
                r.recipient_name,
                r.status,
                r.error_message,
                r.sent_at,
                r.delivered_at,
                r.created_at,

                b.broadcast_name,
                b.bot_id,
                b.gateway,
                b.template_id

            FROM rcs_broadcast_recipients r

            INNER JOIN rcs_broadcasts b
                ON b.id = r.broadcast_id

            WHERE b.user_id = ?

            ORDER BY r.id DESC
        `;

        db.query(
            query,
            [userId],
            (err, results) => {

                if (err) {

                    console.error(
                        "RCS number logs query error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Unable to load RCS number logs",
                        details:
                            err.message
                    });
                }

                res.json(results);
            }
        );
    }
);


// =====================================================
// RCS CAMPAIGN STATUS / RECIPIENT DETAILS
// =====================================================

router.get(
    "/api/rcs/reports/:broadcastId/recipients",
    (req, res) => {

        const userId =
            Number(req.query.user_id) || 1;

        const broadcastId =
            Number(req.params.broadcastId);

        if (
            !Number.isInteger(
                broadcastId
            ) ||
            broadcastId <= 0
        ) {

            return res.status(400).json({
                error:
                    "Invalid broadcast ID"
            });
        }

        const query = `
            SELECT
                r.id,
                r.broadcast_id,
                r.phone_number,
                r.recipient_name,
                r.status,
                r.error_message,
                r.sent_at,
                r.delivered_at,
                r.created_at

            FROM rcs_broadcast_recipients r

            INNER JOIN rcs_broadcasts b
                ON b.id = r.broadcast_id

            WHERE
                r.broadcast_id = ?
                AND b.user_id = ?

            ORDER BY r.id ASC
        `;

        db.query(
            query,
            [
                broadcastId,
                userId
            ],
            (err, results) => {

                if (err) {

                    console.error(
                        "RCS campaign recipient report error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Unable to load campaign recipients",
                        details:
                            err.message
                    });
                }

                res.json(results);
            }
        );
    }
);


// =====================================================
// RCS INBOUND MESSAGE
// Reads inbound RCS messages from the dedicated
// rcs_inbound_messages table.
// READ ONLY - does not modify any existing RCS data.
// =====================================================

router.get(
    "/api/rcs/reports/inbound",
    (req, res) => {

        const userId =
            Number(req.query.user_id) || 1;

        const query = `
            SELECT
                id,
                user_id,
                phone_number,
                sender_id,
                message,
                message_id,
                status,
                received_at,
                created_at
            FROM rcs_inbound_messages
            WHERE user_id = ?
            ORDER BY id DESC
        `;

        db.query(
            query,
            [userId],
            (err, results) => {

                if (err) {

                    console.error(
                        "RCS inbound messages query error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Unable to load RCS inbound messages",
                        details:
                            err.message
                    });
                }

                res.json(results);
            }
        );
    }
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
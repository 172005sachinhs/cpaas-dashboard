const express = require("express");
const crypto = require("crypto");

const router = express.Router();
const db = require("./db");

// =====================================================
// DEVELOPER - API KEY ROUTES
// =====================================================

// =====================================================
// GET ALL API KEYS
// =====================================================
router.get("/api/developer/api-keys", (req, res) => {
    const userId = Number(req.query.user_id || 1);

    const query = `
        SELECT
            k.id,
            k.user_id,
            k.key_name,
            k.api_key,
            k.allowed_ips,
            k.status,
            k.created_at,
            COALESCE(
                u.name,
                CONCAT('User ', k.user_id)
            ) AS user_name
        FROM api_keys k
        LEFT JOIN users u
            ON u.id = k.user_id
        WHERE k.user_id = ?
        ORDER BY k.id DESC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("API key list error:", err);

            return res.status(500).json({
                error: err.message
            });
        }

        res.json(results);
    });
});


// =====================================================
// CREATE API KEY
// =====================================================
router.post("/api/developer/api-keys", (req, res) => {
    const userId = Number(req.body.user_id || 1);
    const keyName = String(
        req.body.key_name || ""
    ).trim();

    const allowedIps = String(
        req.body.allowed_ips || ""
    ).trim();

    const status = String(
        req.body.status || "ACTIVE"
    ).toUpperCase();

    // -----------------------------
    // VALIDATION
    // -----------------------------
    if (!keyName) {
        return res.status(400).json({
            error: "Key name is required"
        });
    }

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
        return res.status(400).json({
            error: "Invalid status"
        });
    }

    // -----------------------------
    // GENERATE API KEY
    // -----------------------------
    const apiKey = crypto
        .randomBytes(24)
        .toString("base64url");

    // -----------------------------
    // INSERT
    // -----------------------------
    const query = `
        INSERT INTO api_keys
        (
            user_id,
            key_name,
            api_key,
            allowed_ips,
            status
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        query,
        [
            userId,
            keyName,
            apiKey,
            allowedIps || null,
            status
        ],
        (err, result) => {
            if (err) {
                console.error(
                    "API key create error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message:
                    "API key created successfully",

                id: result.insertId,

                api_key: apiKey
            });
        }
    );
});


// =====================================================
// UPDATE API KEY
// =====================================================
router.put(
    "/api/developer/api-keys/:id",
    (req, res) => {

        const id = Number(req.params.id);

        const userId = Number(
            req.body.user_id || 1
        );

        const keyName = String(
            req.body.key_name || ""
        ).trim();

        const allowedIps = String(
            req.body.allowed_ips || ""
        ).trim();

        const status = String(
            req.body.status || "ACTIVE"
        ).toUpperCase();

        // -----------------------------
        // VALIDATE ID
        // -----------------------------
        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            return res.status(400).json({
                error: "Invalid API key ID"
            });
        }

        // -----------------------------
        // VALIDATE NAME
        // -----------------------------
        if (!keyName) {
            return res.status(400).json({
                error: "Key name is required"
            });
        }

        // -----------------------------
        // VALIDATE STATUS
        // -----------------------------
        if (
            !["ACTIVE", "INACTIVE"]
                .includes(status)
        ) {
            return res.status(400).json({
                error: "Invalid status"
            });
        }

        // -----------------------------
        // UPDATE
        // -----------------------------
        const query = `
            UPDATE api_keys
            SET
                key_name = ?,
                allowed_ips = ?,
                status = ?
            WHERE id = ?
            AND user_id = ?
        `;

        db.query(
            query,
            [
                keyName,
                allowedIps || null,
                status,
                id,
                userId
            ],
            (err, result) => {

                if (err) {
                    console.error(
                        "API key update error:",
                        err
                    );

                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (
                    result.affectedRows === 0
                ) {
                    return res.status(404).json({
                        error:
                            "API key not found"
                    });
                }

                res.json({
                    message:
                        "API key updated successfully"
                });
            }
        );
    }
);


// =====================================================
// DELETE API KEY
// =====================================================
router.delete(
    "/api/developer/api-keys/:id",
    (req, res) => {

        const id = Number(req.params.id);

        const userId = Number(
            req.query.user_id || 1
        );

        // -----------------------------
        // VALIDATE ID
        // -----------------------------
        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            return res.status(400).json({
                error: "Invalid API key ID"
            });
        }

        // -----------------------------
        // DELETE
        // -----------------------------
        const query = `
            DELETE FROM api_keys
            WHERE id = ?
            AND user_id = ?
        `;

        db.query(
            query,
            [id, userId],
            (err, result) => {

                if (err) {
                    console.error(
                        "API key delete error:",
                        err
                    );

                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (
                    result.affectedRows === 0
                ) {
                    return res.status(404).json({
                        error:
                            "API key not found"
                    });
                }

                res.json({
                    message:
                        "API key deleted successfully"
                });
            }
        );
    }
);


// =====================================================
// EXPORT
// =====================================================
module.exports = router;
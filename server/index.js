import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";

import { pool } from "./db.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const jwtSecret = process.env.JWT_SECRET;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    exposedHeaders: ["X-Session-Token"],
  }),
);
app.use(express.json());

const toUser = (row) => ({
  uid: String(row.id),
  email: row.email,
  fullName: row.nama || row.email,
  isAdmin:
    Boolean(process.env.ADMIN_EMAIL) &&
    row.email?.trim().toLowerCase() ===
      process.env.ADMIN_EMAIL.trim().toLowerCase(),
});

const createToken = (user) =>
  jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "2h" });

const authenticate = (request, response, next) => {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!token) {
    return response.status(401).json({ message: "Authentication required." });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    if (payload.exp - payload.iat > 2 * 60 * 60) {
      return response.status(401).json({ message: "Invalid session token." });
    }

    request.userId = payload.userId;
    response.set("X-Session-Token", createToken({ id: payload.userId }));
    return next();
  } catch {
    return response.status(401).json({ message: "Invalid or expired token." });
  }
};

const validateCredentials = (email, password) => {
  if (!email || !password || password.length < 6) {
    return "Email and password (minimum 6 characters) are required.";
  }

  return null;
};

const archiveCompletedMonths = async () => {
  await pool.execute(
    `INSERT IGNORE INTO monthly_financial_reports
      (user_id, period_start, income_total, expense_total, balance_total,
       transaction_count, closed_at)
     SELECT user_id, DATE_FORMAT(transaction_date, '%Y-%m-01'),
       SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END),
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END),
       SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) -
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END),
      COUNT(*), LAST_DAY(MIN(transaction_date))
     FROM transactions
     WHERE transaction_date < DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')
     GROUP BY user_id, DATE_FORMAT(transaction_date, '%Y-%m-01')`,
  );
};

const getCurrentPeriod = async (connection) => {
  const [rows] = await connection.execute(
    "SELECT DATE_FORMAT(CURRENT_DATE(), '%Y-%m') AS period",
  );
  return rows[0].period;
};

const isCurrentPeriod = (date, currentPeriod) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date || "") && date.slice(0, 7) === currentPeriod;

const lowStockThreshold = Number(process.env.LOW_STOCK_THRESHOLD || 5);

const ensureNotificationDeliveryLogTable = async () => {
  await pool.execute(`CREATE TABLE IF NOT EXISTS notification_delivery_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    notification_type VARCHAR(100) NOT NULL,
    period CHAR(7) NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_notification_delivery_period (notification_type, period)
  )`);
};

const sendMonthlyWhatsAppReminder = async () => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  if (!accessToken || !phoneNumberId || !adminPhone) return;

  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  if (now.getDate() < lastDay - 2) return;

  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const notificationType = "monthly_transaction_review";
  const [existing] = await pool.execute(
    "SELECT id FROM notification_delivery_logs WHERE notification_type = ? AND period = ? LIMIT 1",
    [notificationType, period],
  );
  if (existing.length) return;

  const message = templateName
    ? {
        messaging_product: "whatsapp",
        to: adminPhone.replace(/\D/g, ""),
        type: "template",
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "id" },
        },
      }
    : {
        messaging_product: "whatsapp",
        to: adminPhone.replace(/\D/g, ""),
        type: "text",
        text: {
          body: `FinanceFlow: Periksa kembali kegiatan transaksi bulan ${period}. Pergantian bulan tinggal ${lastDay - now.getDate()} hari.`,
        },
      };

  const whatsappResponse = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (!whatsappResponse.ok) {
    throw new Error(`WhatsApp API returned HTTP ${whatsappResponse.status}`);
  }

  await pool.execute(
    "INSERT INTO notification_delivery_logs (notification_type, period) VALUES (?, ?)",
    [notificationType, period],
  );
};

app.post("/api/auth/register", async (request, response) => {
  const { email, password, fullName } = request.body;
  const validationError = validateCredentials(email, password);

  if (validationError) {
    return response.status(400).json({ message: validationError });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    const normalizedFullName = fullName?.trim() || normalizedEmail;
    const [result] = await pool.execute(
      "INSERT INTO users (email, nama, password_hash) VALUES (?, ?, ?)",
      [normalizedEmail, normalizedFullName, passwordHash],
    );
    const user = {
      id: result.insertId,
      email: normalizedEmail,
      nama: normalizedFullName,
    };

    return response
      .status(201)
      .json({ user: toUser(user), token: createToken(user) });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return response.status(409).json({
        message: "Email is already registered.",
        code: "email-already-in-use",
      });
    }

    console.error(error);
    return response.status(500).json({ message: "Unable to create account." });
  }
});

app.post("/api/auth/login", async (request, response) => {
  const { email, password } = request.body;

  try {
    const [rows] = await pool.execute(
      "SELECT id, email, nama, password_hash FROM users WHERE email = ? LIMIT 1",
      [email?.trim().toLowerCase()],
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password || "", user.password_hash))) {
      return response.status(401).json({
        message: "Email or password is incorrect.",
        code: "invalid-credential",
      });
    }

    return response.json({ user: toUser(user), token: createToken(user) });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: "Unable to sign in." });
  }
});

app.get("/api/auth/me", authenticate, async (request, response) => {
  const [rows] = await pool.execute(
    "SELECT id, email, nama FROM users WHERE id = ? LIMIT 1",
    [request.userId],
  );
  const user = rows[0];

  if (!user) {
    return response.status(401).json({ message: "User no longer exists." });
  }

  return response.json({ user: toUser(user) });
});

app.put("/api/auth/profile", authenticate, async (request, response) => {
  const { email, fullName, currentPassword, newPassword } = request.body;
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedFullName = fullName?.trim();

  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return response.status(400).json({ message: "Alamat email tidak valid." });
  }

  if (
    !normalizedFullName ||
    normalizedFullName.length < 2 ||
    normalizedFullName.length > 100
  ) {
    return response.status(400).json({
      message: "Nama pengguna harus terdiri dari 2 sampai 100 karakter.",
    });
  }

  if (newPassword && newPassword.length < 6) {
    return response.status(400).json({
      message: "Kata sandi baru minimal harus 6 karakter.",
    });
  }

  if (newPassword && !currentPassword) {
    return response.status(400).json({
      message: "Masukkan kata sandi saat ini untuk menggantinya.",
    });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id, email, nama, password_hash FROM users WHERE id = ? LIMIT 1",
      [request.userId],
    );
    const user = rows[0];
    if (!user) {
      return response
        .status(404)
        .json({ message: "Pengguna tidak ditemukan." });
    }

    if (
      newPassword &&
      !(await bcrypt.compare(currentPassword, user.password_hash))
    ) {
      return response
        .status(401)
        .json({ message: "Kata sandi saat ini salah." });
    }

    const passwordHash = newPassword
      ? await bcrypt.hash(newPassword, 12)
      : user.password_hash;
    await pool.execute(
      "UPDATE users SET email = ?, nama = ?, password_hash = ? WHERE id = ?",
      [normalizedEmail, normalizedFullName, passwordHash, request.userId],
    );

    return response.json({
      user: toUser({
        id: user.id,
        email: normalizedEmail,
        nama: normalizedFullName,
      }),
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return response.status(409).json({ message: "Email sudah digunakan." });
    }
    console.error("Profile update error:", error);
    return response.status(500).json({ message: "Profil gagal diperbarui." });
  }
});

app.post("/api/auth/activity", authenticate, (_request, response) => {
  return response.sendStatus(204);
});

app.get("/api/users", authenticate, async (_request, response) => {
  try {
    const [users] = await pool.execute(
      `SELECT id AS uid, email, COALESCE(NULLIF(nama, ''), email) AS fullName
       FROM users ORDER BY nama ASC, email ASC`,
    );
    return response.json({
      users: users.map((user) => ({ ...user, uid: String(user.uid) })),
    });
  } catch (error) {
    console.error("Users list error:", error);
    return response
      .status(500)
      .json({ message: "Daftar pengguna gagal dimuat." });
  }
});

app.get("/api/notifications", authenticate, async (request, response) => {
  try {
    const [lowStockItems, operationalTransactions] = await Promise.all([
      pool.execute(
        `SELECT item_name AS itemName, stock
         FROM inventory
         WHERE category <> 'Jasa' AND stock <= ?
         ORDER BY stock ASC, item_name ASC`,
        [lowStockThreshold],
      ),
      pool.execute(
        `SELECT id, DATE_FORMAT(created_at, '%H:%i') AS time,
          description, category_detail AS categoryDetail, amount
         FROM transactions
         WHERE user_id = ? AND type = 'expense'
           AND category IN ('Operasional', 'Operasional Toko', 'Lain-lain')
           AND transaction_date = CURRENT_DATE() AND amount > 100000
         ORDER BY created_at DESC`,
        [request.userId],
      ),
    ]);

    const notifications = [
      ...lowStockItems[0].map((item) => ({
        id: `low-stock-${item.itemName}`,
        type: "low_stock",
        title: "Stok barang hampir habis",
        message: `${item.itemName}: tersisa ${item.stock} barang.`,
        itemName: item.itemName,
        stock: Number(item.stock),
      })),
      ...operationalTransactions[0].map((transaction) => ({
        id: `operational-${transaction.id}`,
        type: "operational_expense",
        title: "Pengeluaran operasional di atas Rp100.000",
        message: `${transaction.description}${transaction.categoryDetail ? ` — ${transaction.categoryDetail}` : ""}`,
        time: transaction.time,
        amount: Number(transaction.amount),
        transactionDetail:
          transaction.categoryDetail || transaction.description,
      })),
    ];

    return response.json({ notifications, lowStockThreshold });
  } catch (error) {
    console.error("Notifications error:", error);
    return response.status(500).json({ message: "Notifikasi gagal dimuat." });
  }
});

app.post("/api/auth/activity", authenticate, (_request, response) => {
  return response.sendStatus(204);
});

app.get("/api/inventory", authenticate, async (request, response) => {
  const [items] = await pool.execute(
    `SELECT id, item_code AS item_id, item_name, category, stock, price
     FROM inventory ORDER BY item_name ASC`,
  );
  return response.json({ items });
});

app.get(
  "/api/inventory-financial-transactions",
  authenticate,
  async (request, response) => {
    const [transactions] = await pool.execute(
      `SELECT id, transaction_id AS transactionId,
        inventory_item_id AS inventoryItemId,
        DATE_FORMAT(transaction_date, '%Y-%m-%d') AS date,
        item_name AS itemName, quantity, amount
       FROM inventory_financial_transactions
       WHERE user_id = ? ORDER BY transaction_date DESC, id DESC`,
      [request.userId],
    );

    return response.json({ transactions });
  },
);

app.post("/api/inventory", authenticate, async (request, response) => {
  const { itemCode, itemName, category, stock, price } = request.body;
  const isService = category?.trim() === "Jasa";
  const normalizedStock = isService ? 0 : Number(stock);
  const normalizedPrice = isService ? 0 : Number(price);

  if (
    !itemCode?.trim() ||
    !itemName?.trim() ||
    !category?.trim() ||
    (!isService &&
      (!Number.isInteger(normalizedStock) || normalizedStock < 0)) ||
    (!isService && (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0))
  ) {
    return response
      .status(400)
      .json({ message: "Invalid inventory item data." });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO inventory (item_code, item_name, category, stock, price)
       VALUES (?, ?, ?, ?, ?)`,
      [
        itemCode.trim(),
        itemName.trim(),
        category.trim(),
        normalizedStock,
        normalizedPrice,
      ],
    );

    return response.status(201).json({ id: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return response.status(409).json({
        message: "Kode barang sudah digunakan.",
        code: "inventory-item-code-already-exists",
      });
    }

    console.error(error);
    return response
      .status(500)
      .json({ message: "Unable to create inventory item." });
  }
});

app.put("/api/inventory/:id", authenticate, async (request, response) => {
  const { itemCode, itemName, category, stock, price } = request.body;
  const isService = category?.trim() === "Jasa";
  const normalizedStock = isService ? 0 : Number(stock);
  const normalizedPrice = isService ? 0 : Number(price);

  if (
    !/^\d+$/.test(request.params.id) ||
    !itemCode?.trim() ||
    !itemName?.trim() ||
    !category?.trim() ||
    (!isService &&
      (!Number.isInteger(normalizedStock) || normalizedStock < 0)) ||
    (!isService && (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0))
  ) {
    return response
      .status(400)
      .json({ message: "Invalid inventory item data." });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE inventory
       SET item_code = ?, item_name = ?, category = ?, stock = ?, price = ?
       WHERE id = ?`,
      [
        itemCode.trim(),
        itemName.trim(),
        category.trim(),
        normalizedStock,
        normalizedPrice,
        request.params.id,
      ],
    );

    if (!result.affectedRows) {
      return response
        .status(404)
        .json({ message: "Inventory item not found." });
    }

    return response.sendStatus(204);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return response.status(409).json({
        message: "Kode barang sudah digunakan.",
        code: "inventory-item-code-already-exists",
      });
    }

    console.error(error);
    return response
      .status(500)
      .json({ message: "Unable to update inventory item." });
  }
});

app.get("/api/transactions", authenticate, async (request, response) => {
  const requestedLimit = Number.parseInt(request.query.limit, 10);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 50)
    : null;
  const limitClause = limit === null ? "" : " LIMIT ?";
  const parameters =
    limit === null ? [request.userId] : [request.userId, limit];
  const [transactions] = await pool.execute(
    `SELECT id, user_id AS userId, DATE_FORMAT(transaction_date, '%Y-%m-%d') AS date,
      description, category, category_detail AS categoryDetail,
      inventory_item_id AS inventoryItemId, quantity, type,
      payment_method AS paymentMethod, amount,
      created_at AS createdAt, updated_at AS updatedAt
     FROM transactions WHERE user_id = ?
     ORDER BY transaction_date DESC, id DESC${limitClause}`,
    parameters,
  );

  return response.json({ transactions });
});

app.get(
  "/api/transactions/daily-handler-income",
  authenticate,
  async (request, response) => {
    try {
      const targetDate =
        typeof request.query?.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(request.query.date)
          ? request.query.date
          : null;

      const dateCondition = targetDate
        ? "transaction_date = ?"
        : "transaction_date = CURRENT_DATE()";
      const parameters = targetDate
        ? [request.userId, targetDate]
        : [request.userId];

      const query = `SELECT
          description AS handlerName,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
          COALESCE(SUM(CASE WHEN type = 'income' AND payment_method = 'cash' THEN amount ELSE 0 END), 0) AS cashIncome,
          COALESCE(SUM(CASE WHEN type = 'income' AND payment_method = 'qris' THEN amount ELSE 0 END), 0) AS qrisIncome,
          SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END) AS incomeTransactionCount,
          SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END) AS expenseTransactionCount,
          COUNT(*) AS transactionCount
        FROM transactions
        WHERE user_id = ?
          AND ${dateCondition}
          AND type = 'income'
        GROUP BY description
        HAVING income > 0
        ORDER BY income DESC, handlerName ASC`;

      const [handlers] = await pool.execute(query, parameters);

      return response.json({
        handlers,
        date: targetDate || new Date().toISOString().slice(0, 10),
      });
    } catch (error) {
      console.error("Daily handler finance error:", error);
      return response
        .status(500)
        .json({ message: "Ringkasan keuangan petugas gagal dimuat." });
    }
  },
);

app.get("/api/monthly-reports", authenticate, async (request, response) => {
  const [reports] = await pool.execute(
    `SELECT DATE_FORMAT(period_start, '%Y-%m') AS period,
       income_total AS income, expense_total AS expense,
       balance_total AS balance, transaction_count AS transactionCount,
       closed_at AS closedAt
     FROM monthly_financial_reports
     WHERE user_id = ? ORDER BY period_start DESC`,
    [request.userId],
  );

  return response.json({ reports });
});

const getMonthlyInventoryMetrics = async (userId, period) => {
  const [rows] = await pool.execute(
    `SELECT
      COALESCE(SUM(CASE
        WHEN category = 'Restock' AND type = 'expense' THEN amount
        ELSE 0
      END), 0) AS restockExpense,
      COALESCE(SUM(CASE
        WHEN category = 'Restock' AND type = 'expense' THEN quantity
        ELSE 0
      END), 0) AS restockQuantity,
      SUM(CASE WHEN category = 'Restock' AND type = 'expense' THEN 1 ELSE 0 END)
        AS restockTransactionCount,
      COALESCE(SUM(CASE
        WHEN category = 'Barang' AND type = 'income' THEN amount
        ELSE 0
      END), 0) AS itemIncome,
      COALESCE(SUM(CASE
        WHEN category = 'Barang' AND type = 'income' THEN quantity
        ELSE 0
      END), 0) AS itemIncomeQuantity,
      SUM(CASE WHEN category = 'Barang' AND type = 'income' THEN 1 ELSE 0 END)
        AS itemIncomeTransactionCount
     FROM transactions
     WHERE user_id = ? AND transaction_date >= ?
       AND transaction_date < DATE_ADD(?, INTERVAL 1 MONTH)`,
    [userId, `${period}-01`, `${period}-01`],
  );

  return rows[0];
};

app.get(
  "/api/ai/monthly-inventory-analysis",
  authenticate,
  async (request, response) => {
    const { period } = request.query;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period || "")) {
      return response
        .status(400)
        .json({ message: "Periode analisis barang tidak valid." });
    }

    try {
      const analysis = await getMonthlyInventoryMetrics(request.userId, period);
      return response.json({ period, analysis });
    } catch (error) {
      console.error("Monthly inventory analysis error:", error);
      return response
        .status(500)
        .json({ message: "Analisis pemasukan dan modal barang gagal dimuat." });
    }
  },
);

app.post(
  "/api/ai/monthly-inventory-recommendations",
  authenticate,
  async (request, response) => {
    const { period } = request.body;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period || "")) {
      return response
        .status(400)
        .json({ message: "Periode rekomendasi barang tidak valid." });
    }

    if (!process.env.GROQ_API) {
      return response.status(503).json({
        message: "Konfigurasi GROQ_API belum tersedia di server.",
      });
    }

    try {
      const inventoryMetrics = await getMonthlyInventoryMetrics(
        request.userId,
        period,
      );
      const groqResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "Anda adalah konsultan usaha kecil yang memberi rekomendasi praktis dalam Bahasa Indonesia berdasarkan data transaksi yang diberikan saja. Data membandingkan biaya restok bulan terpilih dengan pemasukan penjualan barang bulan yang sama; ini bukan HPP barang terjual dan bukan laba bersih karena stok awal/akhir dan biaya lain tidak tersedia. Jangan menyimpulkan kenaikan HPP akan menutup kekurangan. Jika membahas harga, bedakan HPP (biaya pokok aktual) dari harga jual: sarankan validasi dan pembaruan HPP berdasarkan biaya per unit yang benar, lalu evaluasi harga jual dan margin sebelum penyesuaian. Berikan aksi relevan seperti audit biaya per unit, evaluasi harga jual secara bertahap, fokus pada barang dengan perputaran/margin yang baik bila datanya mendukung, mengendalikan restok, serta promosi yang terukur. Jangan mengarang nilai, penyebab, produk, atau persentase. Jika tidak ada data modal restok, nyatakan keterbatasan dan jangan beri saran perubahan harga yang seolah berbasis data. Kembalikan JSON valid dengan bentuk {headline:string, summary:string, recommendations:[{title:string,action:string,priority:'tinggi'|'menengah'|'rendah'}], caveat:string}. Berikan 2-4 rekomendasi singkat dan dapat dilakukan.",
              },
              {
                role: "user",
                content: JSON.stringify({
                  selectedPeriod: period,
                  inventoryMetrics,
                  difference:
                    Number(inventoryMetrics.itemIncome || 0) -
                    Number(inventoryMetrics.restockExpense || 0),
                }),
              },
            ],
          }),
          signal: AbortSignal.timeout(60_000),
        },
      );
      const completion = await groqResponse.json().catch(() => ({}));

      if (!groqResponse.ok) {
        console.error(
          "Groq inventory recommendations request failed:",
          groqResponse.status,
        );
        return response.status(502).json({
          message:
            "Layanan rekomendasi AI sedang tidak tersedia. Coba kembali.",
        });
      }

      let analysis;
      try {
        analysis = JSON.parse(completion.choices?.[0]?.message?.content);
      } catch {
        return response.status(502).json({
          message: "AI mengembalikan format rekomendasi yang tidak valid.",
        });
      }

      if (
        typeof analysis.headline !== "string" ||
        typeof analysis.summary !== "string" ||
        !Array.isArray(analysis.recommendations) ||
        typeof analysis.caveat !== "string"
      ) {
        return response.status(502).json({
          message: "AI mengembalikan rekomendasi yang tidak lengkap.",
        });
      }

      return response.json({ period, analysis });
    } catch (error) {
      console.error("Monthly inventory recommendations error:", error);
      return response.status(502).json({
        message:
          "Rekomendasi AI gagal dibuat. Periksa koneksi lalu coba kembali.",
      });
    }
  },
);

app.post(
  "/api/ai/monthly-analysis",
  authenticate,
  async (request, response) => {
    const { period } = request.body;
    if (!/^\d{4}-\d{2}$/.test(period || "")) {
      return response
        .status(400)
        .json({ message: "Periode laporan tidak valid." });
    }

    if (!process.env.GROQ_API) {
      return response.status(503).json({
        message: "Konfigurasi GROQ_API belum tersedia di server.",
      });
    }

    try {
      const [reports] = await pool.execute(
        `SELECT DATE_FORMAT(period_start, '%Y-%m') AS period,
          income_total AS income, expense_total AS expense,
          balance_total AS balance, transaction_count AS transactionCount
         FROM monthly_financial_reports
         WHERE user_id = ? AND period_start <= ?
         ORDER BY period_start DESC LIMIT 6`,
        [request.userId, `${period}-01`],
      );
      const selectedReport = reports.find((report) => report.period === period);

      if (!selectedReport) {
        return response.status(404).json({
          message: "Laporan bulanan untuk periode tersebut tidak ditemukan.",
        });
      }

      const monthlyData = reports.reverse();
      const groqResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "Anda adalah business assistant yang menganalisis laporan keuangan bulanan usaha kecil dalam Bahasa Indonesia. Gunakan hanya angka yang diberikan, jangan mengarang penyebab atau fakta. Bandingkan dengan bulan sebelumnya hanya bila datanya tersedia. Berikan JSON valid dengan bentuk: {headline:string, health:'sehat'|'perlu_diperhatikan'|'kritis', summary:string, insights:[{title:string,evidence:string,meaning:string,tone:'positive'|'caution'|'negative'}], recommendations:[{title:string,action:string,priority:'tinggi'|'menengah'|'rendah'}], outlook:string, limitations:string[]}. Buat 2-4 insight dan 2-4 rekomendasi yang spesifik dan dapat dilakukan.",
              },
              {
                role: "user",
                content: JSON.stringify({
                  selectedPeriod: period,
                  selectedReport,
                  recentMonthlyReports: monthlyData,
                }),
              },
            ],
          }),
          signal: AbortSignal.timeout(60_000),
        },
      );
      const completion = await groqResponse.json().catch(() => ({}));

      if (!groqResponse.ok) {
        console.error("Groq analysis request failed:", groqResponse.status);
        return response.status(502).json({
          message: "Layanan analisis AI sedang tidak tersedia. Coba kembali.",
        });
      }

      const content = completion.choices?.[0]?.message?.content;
      let analysis;
      try {
        analysis = JSON.parse(content);
      } catch {
        return response.status(502).json({
          message: "AI mengembalikan format analisis yang tidak valid.",
        });
      }

      if (
        typeof analysis.headline !== "string" ||
        typeof analysis.summary !== "string" ||
        !Array.isArray(analysis.insights) ||
        !Array.isArray(analysis.recommendations)
      ) {
        return response.status(502).json({
          message: "AI mengembalikan format analisis yang tidak lengkap.",
        });
      }

      return response.json({ period, analysis });
    } catch (error) {
      console.error("Monthly AI analysis error:", error.message);
      return response.status(502).json({
        message:
          "Analisis gagal dijalankan. Periksa koneksi lalu coba kembali.",
      });
    }
  },
);

app.post("/api/monthly-reports", authenticate, async (request, response) => {
  const { income, expense } = request.body;
  const normalizedIncome = Number(income);
  const normalizedExpense = Number(expense);

  if (
    income === undefined ||
    income === null ||
    income === "" ||
    expense === undefined ||
    expense === null ||
    expense === "" ||
    !Number.isFinite(normalizedIncome) ||
    normalizedIncome < 0 ||
    !Number.isFinite(normalizedExpense) ||
    normalizedExpense < 0
  ) {
    return response
      .status(400)
      .json({ message: "Invalid monthly report data." });
  }

  const connection = await pool.getConnection();

  try {
    const currentPeriod = await getCurrentPeriod(connection);
    const periodStart = `${currentPeriod}-01`;
    const [dateRows] = await connection.execute(
      `SELECT CURRENT_DATE() = LAST_DAY(CURRENT_DATE()) AS isMonthEnd,
        DATE_FORMAT(LAST_DAY(CURRENT_DATE()), '%Y-%m-%d') AS closedAt`,
    );

    if (!dateRows[0].isMonthEnd) {
      return response.status(409).json({
        message:
          "Monthly reports can only be submitted on the last day of the month.",
        code: "month-end-required",
      });
    }

    const [countRows] = await connection.execute(
      `SELECT COUNT(*) AS transactionCount FROM transactions
       WHERE user_id = ? AND transaction_date >= ?
         AND transaction_date < DATE_ADD(?, INTERVAL 1 MONTH)`,
      [request.userId, periodStart, periodStart],
    );

    await connection.execute(
      `INSERT INTO monthly_financial_reports
        (user_id, period_start, income_total, expense_total, balance_total,
         transaction_count, closed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         income_total = VALUES(income_total),
         expense_total = VALUES(expense_total),
         balance_total = VALUES(balance_total),
         transaction_count = VALUES(transaction_count),
         closed_at = VALUES(closed_at)`,
      [
        request.userId,
        periodStart,
        normalizedIncome,
        normalizedExpense,
        normalizedIncome - normalizedExpense,
        countRows[0].transactionCount,
        dateRows[0].closedAt,
      ],
    );

    return response.status(201).json({ period: currentPeriod });
  } catch (error) {
    console.error(error);
    return response
      .status(500)
      .json({ message: "Unable to save monthly report." });
  } finally {
    connection.release();
  }
});

app.post("/api/transactions", authenticate, async (request, response) => {
  const {
    date,
    description,
    category,
    categoryDetail,
    inventoryItemId,
    quantity,
    type,
    paymentMethod,
    amount,
  } = request.body;

  const normalizedPaymentMethod = paymentMethod || "cash";
  const usesInventory = ["Barang", "Restock"].includes(category);
  const normalizedQuantity = usesInventory ? Number(quantity) : 1;

  if (
    !date ||
    !description?.trim() ||
    !category ||
    (["Operasional", "Lain-lain"].includes(category) &&
      !categoryDetail?.trim()) ||
    (usesInventory && !inventoryItemId) ||
    (usesInventory &&
      (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1)) ||
    (category === "Restock" && type !== "expense") ||
    !["income", "expense"].includes(type) ||
    !["cash", "qris"].includes(normalizedPaymentMethod) ||
    (category !== "Barang" &&
      (!Number.isFinite(Number(amount)) || Number(amount) <= 0))
  ) {
    return response.status(400).json({ message: "Invalid transaction data." });
  }

  const connection = await pool.getConnection();

  try {
    const currentPeriod = await getCurrentPeriod(connection);
    if (!isCurrentPeriod(date, currentPeriod)) {
      return response.status(409).json({
        message: "Transactions can only be added to the current month.",
        code: "period-read-only",
      });
    }

    await connection.beginTransaction();
    let transactionAmount = Number(amount);
    let resolvedCategoryDetail = categoryDetail?.trim() || null;

    if (category === "Barang") {
      const [stockRows] = await connection.execute(
        "SELECT item_name, price, stock FROM inventory WHERE id = ? FOR UPDATE",
        [inventoryItemId],
      );
      const item = stockRows[0];

      if (!item) {
        await connection.rollback();
        return response
          .status(404)
          .json({ message: "Inventory item not found." });
      }

      const unitPrice = Number(item.price);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        await connection.rollback();
        return response
          .status(400)
          .json({ message: "Inventory item price must be greater than 0." });
      }

      if (Number(item.stock) < normalizedQuantity) {
        await connection.rollback();
        return response.status(409).json({ message: "Insufficient stock." });
      }

      await connection.execute(
        "UPDATE inventory SET stock = stock - ? WHERE id = ?",
        [normalizedQuantity, inventoryItemId],
      );
      transactionAmount = unitPrice * normalizedQuantity;
      resolvedCategoryDetail = item.item_name;
    }

    if (category === "Restock") {
      const [itemRows] = await connection.execute(
        "SELECT item_name, category FROM inventory WHERE id = ? FOR UPDATE",
        [inventoryItemId],
      );
      const item = itemRows[0];

      if (!item || item.category === "Jasa") {
        await connection.rollback();
        return response.status(item ? 400 : 404).json({
          message: "Pilih barang inventory yang valid untuk restock.",
        });
      }

      await connection.execute(
        "UPDATE inventory SET stock = stock + ? WHERE id = ?",
        [normalizedQuantity, inventoryItemId],
      );
      resolvedCategoryDetail = item.item_name;
    }

    const [result] = await connection.execute(
      `INSERT INTO transactions
        (user_id, transaction_date, description, category, category_detail,
         inventory_item_id, quantity, type, payment_method, amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        request.userId,
        date,
        description.trim(),
        category,
        resolvedCategoryDetail,
        usesInventory ? inventoryItemId : null,
        normalizedQuantity,
        type,
        normalizedPaymentMethod,
        transactionAmount,
      ],
    );

    if (category === "Restock") {
      await connection.execute(
        `INSERT INTO inventory_financial_transactions
          (user_id, transaction_id, inventory_item_id, transaction_date,
           item_name, quantity, amount)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          request.userId,
          result.insertId,
          inventoryItemId,
          date,
          resolvedCategoryDetail,
          normalizedQuantity,
          transactionAmount,
        ],
      );
    }

    await connection.commit();
    return response.status(201).json({ id: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return response
      .status(500)
      .json({ message: "Unable to create transaction." });
  } finally {
    connection.release();
  }
});

app.put("/api/transactions/:id", authenticate, async (request, response) => {
  const {
    date,
    description,
    category,
    categoryDetail,
    inventoryItemId,
    quantity,
    type,
    paymentMethod,
    amount,
  } = request.body;

  const normalizedPaymentMethod = paymentMethod || "cash";
  const usesInventory = ["Barang", "Restock"].includes(category);
  const normalizedQuantity = usesInventory ? Number(quantity) : 1;

  if (
    !date ||
    !description?.trim() ||
    !category ||
    (["Operasional", "Lain-lain"].includes(category) &&
      !categoryDetail?.trim()) ||
    (usesInventory && !inventoryItemId) ||
    (usesInventory &&
      (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1)) ||
    (category === "Restock" && type !== "expense") ||
    !["income", "expense"].includes(type) ||
    !["cash", "qris"].includes(normalizedPaymentMethod) ||
    (category !== "Barang" &&
      (!Number.isFinite(Number(amount)) || Number(amount) <= 0))
  ) {
    return response.status(400).json({ message: "Invalid transaction data." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    let transactionAmount = Number(amount);
    let resolvedCategoryDetail = categoryDetail?.trim() || null;
    const [transactionRows] = await connection.execute(
      `SELECT inventory_item_id AS inventoryItemId, quantity, category, type,
        DATE_FORMAT(transaction_date, '%Y-%m') AS period
       FROM transactions WHERE id = ? AND user_id = ? FOR UPDATE`,
      [request.params.id, request.userId],
    );
    const existingTransaction = transactionRows[0];

    if (!existingTransaction) {
      await connection.rollback();
      return response.status(404).json({ message: "Transaction not found." });
    }

    const currentPeriod = await getCurrentPeriod(connection);
    if (
      existingTransaction.period !== currentPeriod ||
      !isCurrentPeriod(date, currentPeriod)
    ) {
      await connection.rollback();
      return response.status(409).json({
        message: "Transactions from completed months are read-only.",
        code: "period-read-only",
      });
    }

    if (
      existingTransaction.inventoryItemId &&
      existingTransaction.category === "Barang"
    ) {
      await connection.execute(
        "UPDATE inventory SET stock = stock + ? WHERE id = ?",
        [existingTransaction.quantity, existingTransaction.inventoryItemId],
      );
    }

    if (
      existingTransaction.inventoryItemId &&
      existingTransaction.category === "Restock"
    ) {
      const [result] = await connection.execute(
        `UPDATE inventory SET stock = stock - ?
         WHERE id = ? AND stock >= ?`,
        [
          existingTransaction.quantity,
          existingTransaction.inventoryItemId,
          existingTransaction.quantity,
        ],
      );
      if (!result.affectedRows) {
        await connection.rollback();
        return response.status(409).json({
          message:
            "Restock tidak dapat diubah karena sebagian stok sudah terpakai.",
        });
      }
    }

    if (category === "Barang") {
      const [stockRows] = await connection.execute(
        "SELECT item_name, price, stock FROM inventory WHERE id = ? FOR UPDATE",
        [inventoryItemId],
      );
      const item = stockRows[0];

      if (!item) {
        await connection.rollback();
        return response
          .status(404)
          .json({ message: "Inventory item not found." });
      }

      const unitPrice = Number(item.price);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        await connection.rollback();
        return response
          .status(400)
          .json({ message: "Inventory item price must be greater than 0." });
      }

      if (Number(item.stock) < normalizedQuantity) {
        await connection.rollback();
        return response.status(409).json({ message: "Insufficient stock." });
      }

      await connection.execute(
        "UPDATE inventory SET stock = stock - ? WHERE id = ?",
        [normalizedQuantity, inventoryItemId],
      );
      transactionAmount = unitPrice * normalizedQuantity;
      resolvedCategoryDetail = item.item_name;
    }

    if (category === "Restock") {
      const [itemRows] = await connection.execute(
        "SELECT item_name, category FROM inventory WHERE id = ? FOR UPDATE",
        [inventoryItemId],
      );
      const item = itemRows[0];

      if (!item || item.category === "Jasa") {
        await connection.rollback();
        return response.status(item ? 400 : 404).json({
          message: "Pilih barang inventory yang valid untuk restock.",
        });
      }

      await connection.execute(
        "UPDATE inventory SET stock = stock + ? WHERE id = ?",
        [normalizedQuantity, inventoryItemId],
      );
      resolvedCategoryDetail = item.item_name;
    }

    await connection.execute(
      `UPDATE transactions SET transaction_date = ?, description = ?, category = ?,
        category_detail = ?, inventory_item_id = ?, quantity = ?, type = ?,
        payment_method = ?, amount = ?
       WHERE id = ? AND user_id = ?`,
      [
        date,
        description.trim(),
        category,
        resolvedCategoryDetail,
        usesInventory ? inventoryItemId : null,
        normalizedQuantity,
        type,
        normalizedPaymentMethod,
        transactionAmount,
        request.params.id,
        request.userId,
      ],
    );

    await connection.execute(
      "DELETE FROM inventory_financial_transactions WHERE transaction_id = ?",
      [request.params.id],
    );

    if (category === "Restock") {
      await connection.execute(
        `INSERT INTO inventory_financial_transactions
          (user_id, transaction_id, inventory_item_id, transaction_date,
           item_name, quantity, amount)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          request.userId,
          request.params.id,
          inventoryItemId,
          date,
          resolvedCategoryDetail,
          normalizedQuantity,
          transactionAmount,
        ],
      );
    }

    await connection.commit();
    return response.sendStatus(204);
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return response
      .status(500)
      .json({ message: "Unable to update transaction." });
  } finally {
    connection.release();
  }
});

app.delete("/api/transactions/:id", authenticate, async (request, response) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [transactionRows] = await connection.execute(
      `SELECT inventory_item_id AS inventoryItemId, quantity, type, category,
        DATE_FORMAT(transaction_date, '%Y-%m') AS period
       FROM transactions WHERE id = ? AND user_id = ? FOR UPDATE`,
      [request.params.id, request.userId],
    );
    const transaction = transactionRows[0];

    if (!transaction) {
      await connection.rollback();
      return response.status(404).json({ message: "Transaction not found." });
    }

    const currentPeriod = await getCurrentPeriod(connection);
    if (transaction.period !== currentPeriod) {
      await connection.rollback();
      return response.status(409).json({
        message: "Transactions from completed months are read-only.",
        code: "period-read-only",
      });
    }

    if (transaction.inventoryItemId && transaction.category === "Barang") {
      await connection.execute(
        "UPDATE inventory SET stock = stock + ? WHERE id = ?",
        [transaction.quantity, transaction.inventoryItemId],
      );
    }

    if (transaction.inventoryItemId && transaction.category === "Restock") {
      const [result] = await connection.execute(
        `UPDATE inventory SET stock = stock - ?
         WHERE id = ? AND stock >= ?`,
        [
          transaction.quantity,
          transaction.inventoryItemId,
          transaction.quantity,
        ],
      );
      if (!result.affectedRows) {
        await connection.rollback();
        return response.status(409).json({
          message:
            "Restock tidak dapat dihapus karena sebagian stok sudah terpakai.",
        });
      }
    }

    await connection.execute(
      "DELETE FROM transactions WHERE id = ? AND user_id = ?",
      [request.params.id, request.userId],
    );
    await connection.commit();
    return response.sendStatus(204);
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return response
      .status(500)
      .json({ message: "Unable to delete transaction." });
  } finally {
    connection.release();
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`FinanceFlow API listening on http://localhost:${port}`);
  archiveCompletedMonths().catch((error) => {
    console.error("Unable to archive completed financial months.", error);
  });
  ensureNotificationDeliveryLogTable()
    .then(sendMonthlyWhatsAppReminder)
    .catch((error) => {
      console.error("Unable to send monthly WhatsApp reminder.", error);
    });
  setInterval(
    () => {
      archiveCompletedMonths().catch((error) => {
        console.error("Unable to archive completed financial months.", error);
      });
      ensureNotificationDeliveryLogTable()
        .then(sendMonthlyWhatsAppReminder)
        .catch((error) => {
          console.error("Unable to send monthly WhatsApp reminder.", error);
        });
    },
    60 * 60 * 1000,
  );
});

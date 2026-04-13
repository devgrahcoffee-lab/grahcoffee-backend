const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');

/**
 * @swagger
 * tags:
 *   name: Otentikasi
 *   description: Gateway Akses Masuk System
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Portal Login untuk Website Admin & Aplikasi Mobile Karyawan
 *     tags: [Otentikasi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Otorisasi Berhasil. API akan mengembalikan 'token' yang harus dipasang sebagai skema 'Bearer' untuk memanggil endpoint lainnya.
 */
router.post('/login', authCtrl.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log-out / Cabut Akses Token
 *     tags: [Otentikasi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kunci sesi dihancurkan.
 */
router.post('/logout', authCtrl.logout);

module.exports = router;

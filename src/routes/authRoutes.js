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

/**
 * @swagger
 * /api/auth/lupa-sandi:
 *   post:
 *     summary: Generate password sementara untuk karyawan yang lupa sandi
 *     tags: [Otentikasi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "budi@grahcoffee.id"
 *     responses:
 *       200:
 *         description: Password sementara dibuat dan dikembalikan (untuk disampaikan Admin ke karyawan)
 */
router.post('/lupa-sandi', authCtrl.lupaSandi);

/**
 * @swagger
 * /api/auth/ganti-sandi:
 *   post:
 *     summary: Ganti password sendiri (perlu login aktif)
 *     tags: [Otentikasi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password_lama, password_baru]
 *             properties:
 *               password_lama:
 *                 type: string
 *               password_baru:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password berhasil diubah. Semua sesi lama dicabut.
 *       401:
 *         description: Password lama tidak sesuai.
 */
router.post('/ganti-sandi', authCtrl.gantiSandi);

module.exports = router;

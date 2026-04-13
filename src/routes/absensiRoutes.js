const express = require('express');
const router = express.Router();
const absensiCtrl = require('../controllers/absensiController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Absensi
 *   description: Manajemen Kehadiran & Kalkulasi Denda
 */

/**
 * @swagger
 * /api/absensi/scan:
 *   post:
 *     summary: Melakukan absen masuk atau pulang dengan barcodenya (Karyawan)
 *     tags: [Absensi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil tercatat
 */
router.post('/scan', verifyToken, absensiCtrl.scanBarcode);
router.post('/admin-scan', verifyToken, requireAdmin, absensiCtrl.scanBarcodeAdmin);

/**
 * @swagger
 * /api/absensi/riwayat-saya:
 *   get:
 *     summary: Melihat rekapan absen diri sendiri (Karyawan)
 *     tags: [Absensi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Riwayat absensi sukses dimuat
 */
router.get('/riwayat-saya', verifyToken, absensiCtrl.getRiwayatPribadi);

/**
 * @swagger
 * /api/absensi/semua:
 *   get:
 *     summary: Memantau absen seluruh karyawan (Admin Only)
 *     tags: [Absensi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data dimuat
 */
router.get('/semua', verifyToken, requireAdmin, absensiCtrl.getRiwayatSeluruh);

module.exports = router;

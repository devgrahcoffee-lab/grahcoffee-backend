const express = require('express');
const router = express.Router();
const pengCtrl = require('../controllers/penggajianController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Penggajian
 *   description: Mesin Hitung Payroll Gaji Karyawan
 */

/**
 * @swagger
 * /api/penggajian/generate:
 *   post:
 *     summary: Trigger proses kalkulasi borongan payroll akhir bulan
 *     tags: [Penggajian]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               periode_bulan:
 *                 type: integer
 *               periode_tahun:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Script menghibur sukses
 */
router.post('/generate', verifyToken, requireAdmin, pengCtrl.generatePenggajianBulanIni);

/**
 * @swagger
 * /api/penggajian/semua:
 *   get:
 *     summary: Admin memonitor pengeluaran gaji / tagihan 
 *     tags: [Penggajian]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List Slip Gaji
 */
router.get('/semua', verifyToken, requireAdmin, pengCtrl.getAllGaji);

/**
 * @swagger
 * /api/penggajian/slip-pribadi:
 *   get:
 *     summary: Staf melihat riwayat struk pembayaran jasanya
 *     tags: [Penggajian]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Slip gaji dikembalikan
 */
router.get('/slip-pribadi', verifyToken, pengCtrl.getInfoGajiPribadi);
router.get('/estimasi-gaji', verifyToken, requireAdmin, pengCtrl.getEstimasiBulanIni);

module.exports = router;


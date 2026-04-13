const express = require('express');
const router = express.Router();
const shiftCtrl = require('../controllers/shiftController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Shift
 *   description: Pengaturan Jadwal Kerja & Shift
 */

/**
 * @swagger
 * /api/shift/jadwal-saya:
 *   get:
 *     summary: Lihat di tanggal apa saja aku disuruh kerja
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of jadwal_kerja
 */
router.get('/jadwal-saya', verifyToken, shiftCtrl.getJadwalKaryawanBulanIni);

/**
 * @swagger
 * /api/shift:
 *   get:
 *     summary: Referensi waktu shift yang ada
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     summary: Bikin presetan formasi Shift Baru (+ durasinya)
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_shift:
 *                 type: string
 *               kategori:
 *                 type: string
 *               jam_masuk:
 *                 type: string
 *                 format: time
 *                 example: "12:00:00"
 *               jam_keluar:
 *                 type: string
 *                 format: time
 *                 example: "20:00:00"
 *               durasi_jam:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Valid preset shift dibuat
 */
router.get('/', verifyToken, requireAdmin, shiftCtrl.getAllShift);
router.post('/', verifyToken, requireAdmin, shiftCtrl.addShift);

/**
 * @swagger
 * /api/shift/jadwal:
 *   post:
 *     summary: Petakan Si Karyawan masuk di Shift A pada Tanggal Sekian
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               karyawan_id:
 *                 type: integer
 *               shift_id:
 *                 type: integer
 *               tanggal:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Pemetaan masuk!
 */
router.get('/jadwal', verifyToken, requireAdmin, shiftCtrl.getAllJadwal);
router.post('/jadwal', verifyToken, requireAdmin, shiftCtrl.aturJadwalHarian);

module.exports = router;

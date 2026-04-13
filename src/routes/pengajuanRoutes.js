const express = require('express');
const router = express.Router();
const pengajuanCtrl = require('../controllers/pengajuanController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Pengajuan
 *   description: Manajemen Persetujuan Cuti / Izin / Resign
 */

/**
 * @swagger
 * /api/pengajuan/ajukan:
 *   post:
 *     summary: Staf mengirim formulir permohonan 
 *     tags: [Pengajuan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jenis:
 *                 type: string
 *                 description: "izin, cuti, atau resign"
 *               tanggal_mulai:
 *                 type: string
 *                 format: date
 *               tanggal_selesai:
 *                 type: string
 *                 format: date
 *               alasan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dokumen terkirim
 */
router.post('/ajukan', verifyToken, pengajuanCtrl.ajukanPengajuan);

/**
 * @swagger
 * /api/pengajuan/admin-ajukan:
 *   post:
 *     summary: Admin menambah data izin manual
 *     tags: [Pengajuan]
 *     security:
 *       - bearerAuth: []
 */
router.post('/admin-ajukan', verifyToken, requireAdmin, pengajuanCtrl.ajukanPengajuanAdmin);

/**
 * @swagger
 * /api/pengajuan/riwayat-saya:
 *   get:
 *     summary: Laporan formulir apa saja yg menunggu persetujuan (Pegawai)
 *     tags: [Pengajuan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil memuat riwayat
 */
router.get('/riwayat-saya', verifyToken, pengajuanCtrl.getRiwayatPribadi);

/**
 * @swagger
 * /api/pengajuan/semua:
 *   get:
 *     summary: Semua formulir pengajuan menumpuk dalam dashboard Admin
 *     tags: [Pengajuan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/semua', verifyToken, requireAdmin, pengajuanCtrl.getAllPengajuan);

/**
 * @swagger
 * /api/pengajuan/proses/{id}:
 *   patch:
 *     summary: Eksekusi keputusan admin (Approve / Reject)
 *     tags: [Pengajuan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status_keputusan:
 *                 type: string
 *                 description: "disetujui / ditolak"
 *     responses:
 *       200:
 *         description: Status tersimpan
 */
router.patch('/proses/:id', verifyToken, requireAdmin, pengajuanCtrl.prosesPengajuanAdmin);

module.exports = router;

const express = require('express');
const router = express.Router();
const lapCtrl = require('../controllers/laporanController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Laporan
 *   description: Hasil rekap operasional menyeluruh
 */

/**
 * @swagger
 * /api/laporan/operasional:
 *   get:
 *     summary: Tarik laporan performa eksekutif untuk halaman depan (Charts)
 *     tags: [Laporan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistik Laporan Dimuat
 */
router.get('/operasional', verifyToken, requireAdmin, lapCtrl.getLaporanEksekutif);
router.get('/grafik/tren', verifyToken, requireAdmin, lapCtrl.getGrafikKehadiran);
router.get('/grafik/rasio', verifyToken, requireAdmin, lapCtrl.getRasioKeterlambatan);
module.exports = router;

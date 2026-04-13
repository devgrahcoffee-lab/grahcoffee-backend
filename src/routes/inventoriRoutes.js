const express = require('express');
const router = express.Router();
const inventoriCtrl = require('../controllers/inventoriController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Inventori
 *   description: Manajemen Stok dan Bahan Baku (Admin Only)
 */

/**
 * @swagger
 * /api/inventori:
 *   get:
 *     summary: Daftar ketersediaan bahan
 *     tags: [Inventori]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Katalog stok dimuat
 */
router.get('/', verifyToken, requireAdmin, inventoriCtrl.getAllBahanBaku);

/**
 * @swagger
 * /api/inventori/bahan-baku:
 *   post:
 *     summary: Mendaftarkan material masuk perdana 
 *     tags: [Inventori]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama:
 *                 type: string
 *               satuan:
 *                 type: string
 *               stok_minimum:
 *                 type: number
 *     responses:
 *       200:
 *         description: Bahan berhasil
 */
router.post('/bahan-baku', verifyToken, requireAdmin, inventoriCtrl.addBahanBaku);

/**
 * @swagger
 * /api/inventori/bahan-baku/{id}:
 *   put:
 *     summary: Memperbarui spesifikasi bahan baku 
 *     tags: [Inventori]
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
 *               nama:
 *                 type: string
 *               satuan:
 *                 type: string
 *               stok_minimum:
 *                 type: number
 *     responses:
 *       200:
 *         description: Sukses update
 *   delete:
 *     summary: Hapus katalog bahan
 *     tags: [Inventori]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sukses terhapus 
 */
router.put('/bahan-baku/:id', verifyToken, requireAdmin, inventoriCtrl.updateBahanBaku);
router.delete('/bahan-baku/:id', verifyToken, requireAdmin, inventoriCtrl.deleteBahanBaku);

/**
 * @swagger
 * /api/inventori/log:
 *   post:
 *     summary: Mencatat sirkulasi log (bahan ditarik / ditambah)
 *     tags: [Inventori]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bahan_baku_id:
 *                 type: integer
 *               jenis:
 *                 type: string
 *                 description: "masuk / keluar"
 *               jumlah:
 *                 type: number
 *               keterangan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaksi terekam
 */
router.post('/log', verifyToken, requireAdmin, inventoriCtrl.catatLogInventori);

module.exports = router;

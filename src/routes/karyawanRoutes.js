const express = require('express');
const routerInst = express.Router();
const karyawanCtrl = require('../controllers/karyawanController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Karyawan
 *   description: Manajemen Karyawan
 */

/**
 * @swagger
 * /api/karyawan/profil:
 *   get:
 *     summary: Melihat biodata diri yang sedang login (Mobile App)
 *     tags: [Karyawan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Identitas dikembalikan
 */
routerInst.get('/profil', verifyToken, karyawanCtrl.getProfilPribadi);

/**
 * @swagger
 * /api/karyawan:
 *   get:
 *     summary: Dapatkan array semua pegawai terdaftar
 *     tags: [Karyawan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     summary: Pembuatan user pegawai baru
 *     tags: [Karyawan]
 *     security:
 *       - bearerAuth: []
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
 *               username:
 *                 type: string
 *               nama:
 *                 type: string
 *               nomor_telepon:
 *                 type: string
 *               posisi:
 *                 type: string
 *                 description: "Barista / Kitchen"
 *     responses:
 *       200:
 *         description: Berhasil menyimpan
 */
routerInst.get('/', verifyToken, requireAdmin, karyawanCtrl.getAllKaryawan);
routerInst.post('/', verifyToken, requireAdmin, karyawanCtrl.addKaryawan);

/**
 * @swagger
 * /api/karyawan/{id}:
 *   put:
 *     summary: Edit entitas Karyawan
 *     tags: [Karyawan]
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
 *               nomor_telepon:
 *                 type: string
 *               posisi:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     summary: Pemecatan Karyawan / Delete permanent
 *     tags: [Karyawan]
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
routerInst.put('/:id', verifyToken, requireAdmin, karyawanCtrl.updateKaryawan);
routerInst.delete('/:id', verifyToken, requireAdmin, karyawanCtrl.deleteKaryawan);

module.exports = routerInst;

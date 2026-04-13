require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { swaggerUi, swaggerSpec } = require('./swagger');

// Import routes
const healthRoute = require('./routes/health');
const authRoute = require('./routes/authRoutes');
const karyawanRoute = require('./routes/karyawanRoutes');
const inventoriRoute = require('./routes/inventoriRoutes');
const shiftRoute = require('./routes/shiftRoutes');
const absensiRoute = require('./routes/absensiRoutes');
const pengajuanRoute = require('./routes/pengajuanRoutes');
const penggajianRoute = require('./routes/penggajianRoutes');
const laporanRoute = require('./routes/laporanRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Base API routes
app.use('/api/health', healthRoute);
app.use('/api/auth', authRoute);
app.use('/api/karyawan', karyawanRoute);
app.use('/api/inventori', inventoriRoute);
app.use('/api/shift', shiftRoute);
app.use('/api/absensi', absensiRoute);
app.use('/api/pengajuan', pengajuanRoute);
app.use('/api/penggajian', penggajianRoute);
app.use('/api/laporan', laporanRoute);

// Undefined Route Fallback
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'API route not found'
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});

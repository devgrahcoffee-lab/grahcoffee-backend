-- DDL SQL Schema for Grah Coffee System
-- Target: PostgreSQL / Supabase SQL Editor
-- Struktur ini dibuat berdasarkan ERD aplikasi cafe.

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'admin' atau 'karyawan'
    status VARCHAR(50) DEFAULT 'aktif',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE karyawan (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    nama VARCHAR(255) NOT NULL,
    nomor_telepon VARCHAR(20),
    posisi VARCHAR(100) NOT NULL, -- Contoh: 'Barista' atau 'Kitchen'
    status VARCHAR(50) DEFAULT 'aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE shift (
    id SERIAL PRIMARY KEY,
    nama_shift VARCHAR(100) NOT NULL,
    kategori VARCHAR(50),
    jam_masuk TIME NOT NULL,
    jam_keluar TIME NOT NULL,
    durasi_jam INT
);

CREATE TABLE jadwal_kerja (
    id SERIAL PRIMARY KEY,
    karyawan_id INT REFERENCES karyawan(id) ON DELETE CASCADE,
    shift_id INT REFERENCES shift(id) ON DELETE SET NULL,
    tanggal DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'terjadwal'
);

CREATE TABLE absensi (
    id SERIAL PRIMARY KEY,
    karyawan_id INT REFERENCES karyawan(id) ON DELETE CASCADE,
    jadwal_id INT REFERENCES jadwal_kerja(id) ON DELETE SET NULL,
    tanggal DATE NOT NULL,
    jam_masuk TIME,
    jam_pulang TIME,
    status VARCHAR(50), -- 'hadir', 'terlambat', 'alfa', 'izin'
    menit_terlambat INT DEFAULT 0,
    potongan_terlambat DECIMAL(10, 2) DEFAULT 0.00
);

CREATE TABLE bahan_baku (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    satuan VARCHAR(50) NOT NULL,
    stok_saat_ini DECIMAL(10, 2) DEFAULT 0.00,
    stok_minimum DECIMAL(10, 2) DEFAULT 0.00
);

CREATE TABLE log_inventori (
    id SERIAL PRIMARY KEY,
    bahan_baku_id INT REFERENCES bahan_baku(id) ON DELETE CASCADE,
    jenis VARCHAR(50) NOT NULL, -- 'masuk' atau 'keluar'
    jumlah DECIMAL(10, 2) NOT NULL,
    keterangan TEXT,
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE penggajian (
    id SERIAL PRIMARY KEY,
    karyawan_id INT REFERENCES karyawan(id) ON DELETE CASCADE,
    periode_bulan INT NOT NULL,
    periode_tahun INT NOT NULL,
    total_hadir INT DEFAULT 0,
    gaji_pokok DECIMAL(12, 2) DEFAULT 0.00,
    total_potongan DECIMAL(12, 2) DEFAULT 0.00,
    gaji_bersih DECIMAL(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE pengajuan (
    id SERIAL PRIMARY KEY,
    karyawan_id INT REFERENCES karyawan(id) ON DELETE CASCADE,
    jenis VARCHAR(100) NOT NULL, -- 'izin', 'cuti', 'resign'
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    alasan TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Custom untuk Autentikasi Internal (Login / Session Storage / Reset Pass)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

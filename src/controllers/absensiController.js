const supabase = require('../config/supabaseClient');

// Helper fungsi untuk menghitung denda Rp 5000 per blok 15 menit
const hitungDendaKeterlambatan = (jamAbsen, jamShift) => {
    const parseMenit = (t) => {
        const [h, m] = t.split(':').map(Number);
        return (h * 60) + m;
    };
    const menitAbsen = parseMenit(jamAbsen);
    const menitShift = parseMenit(jamShift);
    
    let telat = menitAbsen - menitShift;
    if (telat <= 0) return { telat: 0, denda: 0 };
    
    let blok15Menit = Math.ceil(telat / 15);
    return { telat: telat, denda: blok15Menit * 5000 };
};

exports.scanBarcode = async (req, res) => {
    // Diasumsikan endpoint dipanggil dari HP karyawan (via token)
    // Terdapat data tanggal, dan jam saat scan dilakukan (simulasi waktu sistem)
    const user_id = req.user.id;
    
    // 1. Dapatkan Identifier Karyawan
    const { data: kar } = await supabase.from('karyawan').select('id').eq('user_id', user_id).single();
    if (!kar) return res.status(404).json({ success: false, error: 'User tidak valid sebagai karyawan' });

    // Gunakan tanggal/jam server atau dari body
    const now = new Date();
    const tanggalHariIni = now.toISOString().split('T')[0];
    const waktuSekarang = now.toTimeString().split(' ')[0]; // HH:mm:ss

    // 2. Cari Jadwal Kerja hari ini
    const { data: jadwal } = await supabase
        .from('jadwal_kerja')
        .select('*, shift(*)')
        .eq('karyawan_id', kar.id)
        .eq('tanggal', tanggalHariIni)
        .single();

    if (!jadwal) return res.status(404).json({ success: false, error: 'Anda tidak memiliki jadwal shift pada hari ini' });

    // 3. Cek apakah sudah absen masuk
    const { data: absensiAda } = await supabase
        .from('absensi')
        .select('*')
        .eq('jadwal_id', jadwal.id)
        .single();

    if (!absensiAda) {
        // --- ABSEN MASUK ---
        // Hitung denda
        const kalkulasi = hitungDendaKeterlambatan(waktuSekarang, jadwal.shift.jam_masuk);
        const { data: insertAbsen, error } = await supabase.from('absensi').insert([{
            karyawan_id: kar.id,
            jadwal_id: jadwal.id,
            tanggal: tanggalHariIni,
            jam_masuk: waktuSekarang,
            status: 'hadir',
            menit_terlambat: kalkulasi.telat,
            potongan_terlambat: kalkulasi.denda
        }]).select().single();

        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, message: 'Berhasil Absen Masuk', denda: kalkulasi.denda, data: insertAbsen });

    } else {
        // --- ABSEN PULANG ---
        if (absensiAda.jam_pulang) {
            return res.status(400).json({ success: false, error: 'Anda sudah melakukan absen pulang hari ini' });
        }
        
        const { data: updateAbsen, error } = await supabase.from('absensi')
            .update({ jam_pulang: waktuSekarang })
            .eq('id', absensiAda.id).select().single();

        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, message: 'Berhasil Absen Pulang', data: updateAbsen });
    }
};

exports.scanBarcodeAdmin = async (req, res) => {
    // Terminal Kiosk Mode: mesin/admin mengirimkan ID Karyawan ter-scan
    const { karyawan_id } = req.body;
    
    if (!karyawan_id) return res.status(400).json({ success: false, error: 'Kode Barcode Tidak Valid' });

    const now = new Date();
    const tanggalHariIni = now.toISOString().split('T')[0];
    let waktuSekarang = now.toTimeString().split(' ')[0]; 
    if(req.body.waktu_simulasi) waktuSekarang = req.body.waktu_simulasi; // Untuk testing jika perlu
    
    const { data: jadwal } = await supabase.from('jadwal_kerja').select('*, shift(*)').eq('karyawan_id', karyawan_id).eq('tanggal', tanggalHariIni).single();
    if (!jadwal) return res.status(404).json({ success: false, error: 'Karyawan tidak memiliki jadwal dinas hari ini' });

    const { data: absensiAda } = await supabase.from('absensi').select('*').eq('jadwal_id', jadwal.id).single();
    
    if (!absensiAda) {
        // --- ABSEN MASUK ---
        const kalkulasi = hitungDendaKeterlambatan(waktuSekarang, jadwal.shift.jam_masuk);
        const { data: insertAbsen, error } = await supabase.from('absensi').insert([{
            karyawan_id, jadwal_id: jadwal.id, tanggal: tanggalHariIni, jam_masuk: waktuSekarang, status: 'hadir',
            menit_terlambat: kalkulasi.telat, potongan_terlambat: kalkulasi.denda
        }]).select().single();
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, message: 'BERHASIL ABSEN MASUK', denda: kalkulasi.denda, data: insertAbsen });
    } else {
        // --- ABSEN PULANG ---
        if (absensiAda.jam_pulang) return res.status(400).json({ success: false, error: 'Karyawan ini sudah Absen Pulang sebelumnya.' });
        const { data: updateAbsen, error } = await supabase.from('absensi').update({ jam_pulang: waktuSekarang }).eq('id', absensiAda.id).select().single();
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, message: 'BERHASIL ABSEN PULANG', data: updateAbsen });
    }
};

exports.getRiwayatSeluruh = async (req, res) => {
    // Admin Only
    const { data, error } = await supabase.from('absensi').select('*, karyawan(nama), jadwal_kerja(shift(nama_shift))').order('tanggal', { ascending: false });
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
};

exports.getRiwayatPribadi = async (req, res) => {
    // Karyawan Only
    const user_id = req.user.id;
    const { data: kar } = await supabase.from('karyawan').select('id').eq('user_id', user_id).single();
    
    if(!kar) return res.status(404).json({ success: false, error: "Identifier karyawan tidak terdaftar" });

    const { data, error } = await supabase.from('absensi').select('*, jadwal_kerja(shift(nama_shift))')
        .eq('karyawan_id', kar.id).order('tanggal', { ascending: false });
        
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
};

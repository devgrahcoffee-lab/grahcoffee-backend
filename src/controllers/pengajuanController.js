const supabase = require('../config/supabaseClient');

const toWibDateOnly = (value) => {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return null;
    return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
};

const getTodayWibDateOnly = () => {
    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()));
};

const diffDays = (start, end) => Math.round((start.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));

exports.ajukanPengajuan = async (req, res) => {
    const user_id = req.user.id;
    const { jenis, tanggal_mulai, tanggal_selesai, alasan } = req.body;
    const jenisNormal = (jenis || '').toLowerCase();
    
    const { data: kar } = await supabase.from('karyawan').select('id').eq('user_id', user_id).single();
    if (!kar) return res.status(404).json({ success: false, error: 'User tidak valid' });

    if (['izin', 'cuti', 'sakit'].includes(jenisNormal)) {
        const startDate = toWibDateOnly(tanggal_mulai);
        const today = getTodayWibDateOnly();

        if (!startDate) {
            return res.status(400).json({ success: false, error: 'Tanggal mulai tidak valid.' });
        }

        const selisihHari = diffDays(startDate, today);
        if (selisihHari < 1 || selisihHari > 2) {
            return res.status(400).json({
                success: false,
                error: 'Pengajuan izin, cuti, atau sakit harus diajukan 1-2 hari sebelum tanggal mulai.'
            });
        }

        if (tanggal_selesai) {
            const endDate = toWibDateOnly(tanggal_selesai);
            if (!endDate) {
                return res.status(400).json({ success: false, error: 'Tanggal selesai tidak valid.' });
            }
            if (diffDays(endDate, startDate) < 0) {
                return res.status(400).json({ success: false, error: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.' });
            }
        }
    }

    const { data, error } = await supabase.from('pengajuan').insert([{
        karyawan_id: kar.id,
        jenis: jenisNormal || jenis, 
        tanggal_mulai, 
        tanggal_selesai, 
        alasan,
        status: 'pending' // Default await admin
    }]).select().single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data, message: 'Pengajuan sukses terkirim dan menunggu persetujuan admin.' });
};

exports.ajukanPengajuanAdmin = async (req, res) => {
    const { karyawan_id, jenis, tanggal_mulai, tanggal_selesai, alasan, status } = req.body;
    
    const { data, error } = await supabase.from('pengajuan').insert([{
        karyawan_id,
        jenis, 
        tanggal_mulai, 
        tanggal_selesai, 
        alasan,
        status: status || 'disetujui' // Admin bypasses approval if they set it
    }]).select().single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data, message: 'Pengajuan manual berhasil dialokasikan admin.' });
};

exports.getRiwayatPribadi = async (req, res) => {
    const user_id = req.user.id;
    const { data: kar } = await supabase.from('karyawan').select('id').eq('user_id', user_id).single();
    
    const { data, error } = await supabase.from('pengajuan').select('*').eq('karyawan_id', kar.id).order('created_at', { ascending: false });
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
};

exports.getAllPengajuan = async (req, res) => {
    // Admin only
    const { data, error } = await supabase.from('pengajuan').select('*, karyawan(nama, posisi)').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
};

exports.prosesPengajuanAdmin = async (req, res) => {
    // Admin only action (Setujui / Tolak)
    const { id } = req.params;
    const { status_keputusan } = req.body; // 'disetujui' atau 'ditolak'

    if (!['disetujui', 'ditolak'].includes(status_keputusan.toLowerCase())) {
        return res.status(400).json({ success: false, error: 'Status hanya boleh: disetujui, ditolak' });
    }

    const { data, error } = await supabase.from('pengajuan')
        .update({ status: status_keputusan })
        .eq('id', id).select().single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, message: `Berhasil ditandai sebagai: ${status_keputusan}`, data });
};

const supabase = require('../config/supabaseClient');

exports.ajukanPengajuan = async (req, res) => {
    const user_id = req.user.id;
    const { jenis, tanggal_mulai, tanggal_selesai, alasan } = req.body;
    
    const { data: kar } = await supabase.from('karyawan').select('id').eq('user_id', user_id).single();
    if (!kar) return res.status(404).json({ success: false, error: 'User tidak valid' });

    const { data, error } = await supabase.from('pengajuan').insert([{
        karyawan_id: kar.id,
        jenis, 
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

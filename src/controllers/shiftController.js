const supabase = require('../config/supabaseClient');

exports.getAllShift = async (req, res) => {
    const { data, error } = await supabase.from('shift').select('*');
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
};

exports.addShift = async (req, res) => {
    const { nama_shift, kategori, jam_masuk, jam_keluar, durasi_jam } = req.body;
    const { data, error } = await supabase.from('shift').insert([{ 
        nama_shift, kategori, jam_masuk, jam_keluar, durasi_jam 
    }]).select().single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
};

exports.aturJadwalHarian = async (req, res) => {
    const { karyawan_id, shift_id, tanggal } = req.body;
    const { data, error } = await supabase.from('jadwal_kerja').insert([{ 
        karyawan_id, shift_id, tanggal 
    }]).select().single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
};

exports.getJadwalKaryawanBulanIni = async (req, res) => {
    const user_id = req.user.id;
    const { data: kar } = await supabase.from('karyawan').select('id').eq('user_id', user_id).single();
    
    if(!kar) return res.status(404).json({ success: false, error: "Identitas karyawan tidak terdaftar" });
    
    // Dapat di custom range berdasarkan body/param, ini mereturn seluruhnya
    const { data, error } = await supabase.from('jadwal_kerja').select('*, shift(*)').eq('karyawan_id', kar.id).order('tanggal', { ascending: false });
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
};

exports.getAllJadwal = async (req, res) => {
    // Admin query
    const { data, error } = await supabase.from('jadwal_kerja')
        .select('id, tanggal, karyawan(id, nama, posisi), shift(id, nama_shift, jam_masuk, jam_keluar)')
        .order('tanggal', { ascending: false });
        
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
};

const supabase = require('../config/supabaseClient');

exports.getAllKaryawan = async (req, res) => {
    const { data, error } = await supabase.from('karyawan').select('*, users(email, username, role, status)');
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
};

exports.addKaryawan = async (req, res) => {
    const { email, password, username, nama, nomor_telepon, posisi } = req.body;
    
    // Create underlying user auth record mapping
    const { data: user, error: errUser } = await supabase.from('users').insert([{
        email, username, password_hash: password, role: 'karyawan'
    }]).select().single();
    
    if (errUser) return res.status(500).json({ success: false, error: errUser.message });

    // Link user_id to karyawan record
    const { data: karyawan, error: errKaryawan } = await supabase.from('karyawan').insert([{
        user_id: user.id, nama, nomor_telepon, posisi
    }]).select().single();

    if (errKaryawan) return res.status(500).json({ success: false, error: errKaryawan.message });
    res.json({ success: true, data: { user, karyawan } });
};

exports.updateKaryawan = async (req, res) => {
    const { id } = req.params;
    const { nama, nomor_telepon, posisi, status } = req.body;
    
    // 1. Update profil di tabel karyawan
    const { data: kar, error: errKar } = await supabase.from('karyawan').update({ 
        nama, nomor_telepon, posisi 
    }).eq('id', id).select().single();
    
    if (errKar) return res.status(500).json({ success: false, error: errKar.message });

    // 2. Update status aktif/inaktif di tabel users (untuk memutus/membuka akses login)
    if (kar && kar.user_id && status) {
        const { error: errUser } = await supabase.from('users').update({ status }).eq('id', kar.user_id);
        if (errUser) return res.status(500).json({ success: false, error: errUser.message });
    }

    res.json({ success: true, data: kar });
};

exports.deleteKaryawan = async (req, res) => {
    const { id } = req.params;
    
    // Based on ERD ON DELETE CASCADE, deleting User deletes Karyawan
    const { data: kar } = await supabase.from('karyawan').select('user_id').eq('id', id).single();
    if (kar && kar.user_id) {
        await supabase.from('users').delete().eq('id', kar.user_id);
    } else {
        await supabase.from('karyawan').delete().eq('id', id);
    }
    res.json({ success: true, message: 'Data karyawan dan akun sukses dihapus' });
};

exports.getProfilPribadi = async (req, res) => {
    const user_id = req.user.id;
    const { data, error } = await supabase.from('karyawan').select('*').eq('user_id', user_id).single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
};

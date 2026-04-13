const supabase = require('../config/supabaseClient');
const crypto = require('crypto');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    // Tarik data pengguna (Pengecekan sederhana menggunakan parameter 'password_hash')
    const { data: user, error: errUser } = await supabase.from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password)
        .single();
        
    if (errUser || !user) {
        return res.status(401).json({ success: false, message: 'Email atau Kata Sandi yang dimasukkan salah.' });
    }
    
    if (user.status !== 'aktif') {
        return res.status(403).json({ success: false, message: 'Akun Anda berstatus non-aktif. Hubungi HRD.' });
    }
    
    // Buat token acak (pseudo-JWT) yang akan difungsikan untuk 'Bearer' token.
    const token = crypto.randomBytes(40).toString('hex');
    
    // Masukkan token tsb ke tabel sessions agar dikenali oleh middleware RequireToken()
    const { error: errSession } = await supabase.from('sessions').insert([{
        user_id: user.id,
        token: token,
        ip_address: req.ip || '127.0.0.1'
    }]);
    
    if (errSession) {
        return res.status(500).json({ success: false, message: 'Gagal meregistrasi sesi masuk pada server DB.' });
    }
    
    res.json({ 
        success: true, 
        message: 'Akses masuk diberikan.', 
        token: token,
        role: user.role, // "admin" atau "karyawan" (Frontend akan meredirect sesuai role ini)
        user_id: user.id
    });
};

exports.logout = async (req, res) => {
    // Menghapus data sesi dari Database berdasarkan Bearer Token terakhirnya
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
        await supabase.from('sessions').delete().eq('token', token);
    }
    
    res.json({ success: true, message: 'Berhasil memutuskan sesi aktif.' });
};

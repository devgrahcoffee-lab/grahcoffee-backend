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
        role: user.role,
        user_id: user.id,
        username: user.username || user.email.split('@')[0],
        email: user.email
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

exports.lupaSandi = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email wajib diisi.' });

    // Cek apakah email terdaftar
    const { data: user, error } = await supabase
        .from('users')
        .select('id, email, status')
        .eq('email', email)
        .single();

    if (error || !user) {
        // Kembalikan pesan netral agar tidak bocorkan info akun terdaftar
        return res.json({ success: true, message: 'Jika email terdaftar, password sementara telah dibuat.' });
    }

    if (user.status !== 'aktif') {
        return res.status(403).json({ success: false, message: 'Akun berstatus non-aktif.' });
    }

    // Generate password sementara 8 karakter alfanumerik
    const tempPassword = crypto.randomBytes(4).toString('hex'); // e.g. "a1b2c3d4"

    const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: tempPassword })
        .eq('id', user.id);

    if (updateError) {
        return res.status(500).json({ success: false, message: 'Gagal memperbarui password.' });
    }

    res.json({
        success: true,
        message: 'Password sementara berhasil dibuat. Sampaikan kepada karyawan dan minta segera diubah.',
        temp_password: tempPassword, // Tampilkan ke Admin
    });
};

// ============================================================
// GANTI SANDI: Karyawan/Admin mengganti password sendiri
// Endpoint terproteksi (perlu Bearer Token aktif)
// ============================================================
exports.gantiSandi = async (req, res) => {
    const { password_lama, password_baru } = req.body;

    if (!password_lama || !password_baru) {
        return res.status(400).json({ success: false, message: 'Password lama dan password baru wajib diisi.' });
    }

    if (password_baru.length < 6) {
        return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter.' });
    }

    // req.user di-inject oleh middleware verifyToken
    const user_id = req.user.id;

    // Verifikasi password lama
    const { data: user, error } = await supabase
        .from('users')
        .select('id, password_hash')
        .eq('id', user_id)
        .single();

    if (error || !user) {
        return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    if (user.password_hash !== password_lama) {
        return res.status(401).json({ success: false, message: 'Password lama tidak sesuai.' });
    }

    const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: password_baru })
        .eq('id', user_id);

    if (updateError) {
        return res.status(500).json({ success: false, message: 'Gagal menyimpan password baru.' });
    }

    // Cabut semua sesi lama supaya login ulang dengan password baru
    await supabase.from('sessions').delete().eq('user_id', user_id);

    res.json({ success: true, message: 'Password berhasil diubah. Silakan login kembali dengan password baru.' });
};

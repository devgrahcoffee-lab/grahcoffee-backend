const supabase = require('../config/supabaseClient');

/**
 * Middleware untuk memverifikasi token bearer sesi pada setiap _request_
 * Logika ini memeriksa kemunculan token di header dan memvalidasinya dari tabel `sessions`
 */
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <TOKEN>"

        if (!token) {
            return res.status(401).json({ success: false, message: 'Tidak ada otorisasi. Token akses HTTP tidak ditemukan.' });
        }

        // Melakukan validasi internal ke tabel 'sessions' Supabase kita
        const { data: session, error } = await supabase
            .from('sessions')
            .select(`
                *,
                users (
                    id,
                    role,
                    status
                )
            `)
            .eq('token', token)
            .single();

        // Apabila token tidak ditemukan atau telah tamat
        if (error || !session) {
            return res.status(403).json({ success: false, message: 'Token tidak valid atau telah kedaluwarsa.' });
        }

        // Cek kembali apabila akun tersebut tidak aktif / kena suspen
        if (session.users.status !== 'aktif') {
            return res.status(403).json({ success: false, message: 'Akses ditolak: Akun dinonaktifkan.' });
        }

        // Menyematkan data identitas pemanggil pada Request (`req`)
        req.user = session.users;
        
        // Teruskan ke jalur rute selanjutnya (Controller)
        next();
    } catch (err) {
        console.error("Middleware Auth Error: ", err);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem ketika memvalidasi akun.' });
    }
};

/**
 * Middleware spesifik untuk membatasi aksi krusial hanya bagi "Admin"
 * Harus digunakan SETELAH middleware verifyToken di atas (Penting!)
 */
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ 
            success: false, 
            message: 'Tindakan ini dilarang. Otorisasi membatasi rute ini hanya untuk Admin operasional.' 
        });
    }
};

module.exports = {
    verifyToken,
    requireAdmin
};

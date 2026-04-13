require('dotenv').config();
const supabase = require('./src/config/supabaseClient');

// Skrip sekali-jalan (One-off Script) untuk membuat akun Admin Utama
const seedAdmin = async () => {
    console.log('Menginjeksi akun Super Admin ke database...');
    
    const { data, error } = await supabase.from('users').insert([{
        email: 'admin@grahcoffee.com',
        username: 'Admin Grah Coffee',
        password_hash: 'admin123', // Ingat kata sandi sederhana ini
        role: 'admin',
        status: 'aktif'
    }]).select();

    if (error) {
        console.error('Gagal membuat akun:', error.message);
    } else {
        console.log('Berhasil! Anda sekarang dapat login menggunakan email: admin@grahcoffee.com dan sandi: admin123');
        console.log(data);
    }
};

seedAdmin();

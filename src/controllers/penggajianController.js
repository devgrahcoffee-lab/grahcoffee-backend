const supabase = require('../config/supabaseClient');

exports.generatePenggajianBulanIni = async (req, res) => {
    const { periode_bulan, periode_tahun } = req.body;
    
    // 1. Tarik seluruh karyawan berstatus aktif
    const { data: listKaryawan, error: errKar } = await supabase.from('karyawan').select('*').eq('status', 'aktif');
    if (errKar || !listKaryawan) return res.status(500).json({ success: false, error: 'Gagal memuat staf karyawan' });
    
    let hasilGenerate = [];
    
    // Parsing rentang waktu sesuai bulan (pendekatan sederhana JS)
    const startDate = `${periode_tahun}-${String(periode_bulan).padStart(2, '0')}-01`;
    const endDate = `${periode_tahun}-${String(periode_bulan).padStart(2, '0')}-31`; 

    // 2. Loop per Karyawan dan rekap absennya bulan ini
    for (let kar of listKaryawan) {
        const { data: daftarHadir } = await supabase
            .from('absensi')
            .select('*')
            .eq('karyawan_id', kar.id)
            .gte('tanggal', startDate)
            .lte('tanggal', endDate);
            
        let totalHadir = daftarHadir ? daftarHadir.length : 0;
        let totalPotongan = daftarHadir 
            ? daftarHadir.reduce((acc, curr) => acc + parseFloat(curr.potongan_terlambat || 0), 0) 
            : 0;
        
        // Berdasarkan Rule Bisnis: Barista Rp 46.666/hari, Kitchen Rp 43.333/hari
        let gajiHarian = kar.posisi.toLowerCase() === 'barista' ? 46666 : 43333;
        let gajiPokok = totalHadir * gajiHarian;
        let gajiBersih = gajiPokok - totalPotongan;
        
        // 3. Masukkan ke tabel penggajian
        const { data: insertGaji } = await supabase.from('penggajian').insert([{
            karyawan_id: kar.id,
            periode_bulan,
            periode_tahun,
            total_hadir: totalHadir,
            gaji_pokok: gajiPokok,
            total_potongan: totalPotongan,
            gaji_bersih: gajiBersih,
            status: 'pending' // pending = belum disahkan cair
        }]).select('*, karyawan(nama)').single();
        
        if (insertGaji) hasilGenerate.push(insertGaji);
    }
    
    res.json({ 
        success: true, 
        message: `Berhasil men-generate perhitungan untuk ${hasilGenerate.length} data karyawan.`, 
        data: hasilGenerate 
    });
};

exports.getInfoGajiPribadi = async (req, res) => {
    const user_id = req.user.id;
    const { data: kar } = await supabase.from('karyawan').select('id').eq('user_id', user_id).single();
    
    if(!kar) return res.status(404).json({ success: false, error: 'User tidak tertaut ke entitas karyawan.' });

    const { data, error } = await supabase.from('penggajian')
        .select('*')
        .eq('karyawan_id', kar.id)
        .order('periode_tahun', { ascending: false })
        .order('periode_bulan', { ascending: false });
        
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
};

exports.getAllGaji = async (req, res) => {
    // Admin only view
    const { data, error } = await supabase.from('penggajian')
        .select('*, karyawan(nama, posisi)')
        .order('periode_tahun', { ascending: false })
        .order('periode_bulan', { ascending: false });
        
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
};

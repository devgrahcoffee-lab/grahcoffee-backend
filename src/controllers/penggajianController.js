const supabase = require('../config/supabaseClient');

exports.generatePenggajianBulanIni = async (req, res) => {
    const { periode_bulan, periode_tahun } = req.body;

    if (!periode_bulan || !periode_tahun) {
        return res.status(400).json({ success: false, error: 'periode_bulan dan periode_tahun wajib diisi' });
    }

    // 1. Tarik karyawan aktif (status di tabel users)
    const { data: listKaryawan, error: errKar } = await supabase
        .from('karyawan')
        .select('*, users!inner(status, email)')
        .eq('users.status', 'aktif');

    if (errKar) return res.status(500).json({ success: false, error: 'Gagal memuat staf: ' + errKar.message });
    if (!listKaryawan || listKaryawan.length === 0) {
        return res.status(404).json({ success: false, error: 'Tidak ada karyawan aktif ditemukan. Pastikan status karyawan sudah "aktif" di tabel users.' });
    }

    // 2. Hitung rentang tanggal yang benar untuk bulan ini
    const startDate = `${periode_tahun}-${String(periode_bulan).padStart(2, '0')}-01`;
    const lastDay = new Date(periode_tahun, periode_bulan, 0).getDate();
    const endDate = `${periode_tahun}-${String(periode_bulan).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    let hasilGenerate = [];
    let totalDibuat = 0;
    let totalDiperbarui = 0;

    // 3. Loop per karyawan — INSERT jika belum ada, UPDATE jika sudah ada (recalculate)
    for (const kar of listKaryawan) {
        // Cek apakah slip periode ini sudah pernah dibuat
        const { data: existing } = await supabase
            .from('penggajian')
            .select('id, status')
            .eq('karyawan_id', kar.id)
            .eq('periode_bulan', periode_bulan)
            .eq('periode_tahun', periode_tahun)
            .maybeSingle();

        // Tarik ulang data absensi terbaru (selalu fresh)
        const { data: daftarHadir } = await supabase
            .from('absensi')
            .select('potongan_terlambat')
            .eq('karyawan_id', kar.id)
            .gte('tanggal', startDate)
            .lte('tanggal', endDate);

        const totalHadir = daftarHadir ? daftarHadir.length : 0;
        const totalPotongan = daftarHadir
            ? daftarHadir.reduce((acc, curr) => acc + parseFloat(curr.potongan_terlambat || 0), 0)
            : 0;

        // Rule bisnis gaji harian berdasarkan posisi
        const posisi = (kar.posisi || '').toLowerCase();
        let gajiHarian;
        if (posisi === 'barista')     gajiHarian = 46666;
        else if (posisi === 'kasir')  gajiHarian = 50000;
        else if (posisi === 'kitchen') gajiHarian = 43333;
        else                           gajiHarian = 43333;

        const gajiPokok  = totalHadir * gajiHarian;
        const gajiBersih = Math.max(0, gajiPokok - totalPotongan);

        const payload = {
            total_hadir:    totalHadir,
            gaji_pokok:     gajiPokok,
            total_potongan: totalPotongan,
            gaji_bersih:    gajiBersih,
        };

        let resultData = null;

        if (existing) {
            // --- UPDATE slip yang sudah ada (recalculate dari absensi terbaru) ---
            const { data: updated } = await supabase
                .from('penggajian')
                .update(payload)
                .eq('id', existing.id)
                .select('*, karyawan(nama, posisi)')
                .single();

            resultData = updated;
            totalDiperbarui++;
        } else {
            // --- INSERT slip baru ---
            const { data: inserted } = await supabase
                .from('penggajian')
                .insert([{
                    karyawan_id:    kar.id,
                    periode_bulan:  parseInt(periode_bulan),
                    periode_tahun:  parseInt(periode_tahun),
                    status:         'pending',
                    ...payload
                }])
                .select('*, karyawan(nama, posisi)')
                .single();

            resultData = inserted;
            totalDibuat++;
        }

        if (resultData) hasilGenerate.push(resultData);
    }

    const namaBulan = new Date(periode_tahun, periode_bulan - 1)
        .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const parts = [];
    if (totalDibuat > 0)     parts.push(`${totalDibuat} slip baru dibuat`);
    if (totalDiperbarui > 0) parts.push(`${totalDiperbarui} slip diperbarui (recalculate)`);

    res.json({
        success: true,
        message: `Generate selesai untuk periode ${namaBulan}. ${parts.join(', ')}.`,
        data: hasilGenerate,
        meta: { created: totalDibuat, updated: totalDiperbarui, startDate, endDate }
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

exports.getEstimasiBulanIni = async (req, res) => {
    try {
        // Gunakan waktu WIB (UTC+7) untuk menentukan bulan berjalan
        const nowWIB = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
        const bulan = nowWIB.getUTCMonth() + 1;
        const tahun = nowWIB.getUTCFullYear();
        const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
        const endDate   = `${tahun}-${String(bulan).padStart(2, '0')}-31`;

        // Tarik karyawan aktif beserta data absensi bulan ini
        const { data: listKaryawan } = await supabase
            .from('karyawan')
            .select('id, posisi, users!inner(status)')
            .eq('users.status', 'aktif');

        if (!listKaryawan || listKaryawan.length === 0) {
            return res.json({ success: true, data: { estimasiTotal: 0, jumlahKaryawan: 0, bulan, tahun } });
        }

        let estimasiTotal = 0;
        let totalPotongan = 0;

        for (const kar of listKaryawan) {
            const { data: absenBulanIni } = await supabase
                .from('absensi')
                .select('potongan_terlambat')
                .eq('karyawan_id', kar.id)
                .gte('tanggal', startDate)
                .lte('tanggal', endDate);

            const totalHadir = absenBulanIni ? absenBulanIni.length : 0;
            const potongan = absenBulanIni
                ? absenBulanIni.reduce((acc, a) => acc + parseFloat(a.potongan_terlambat || 0), 0)
                : 0;

            // Rule bisnis: Barista Rp 46.666/hari, lainnya Rp 43.333/hari
            const gajiHarian = kar.posisi?.toLowerCase() === 'barista' ? 46666 : 43333;
            const gajiPokok = totalHadir * gajiHarian;
            const gajiBersih = gajiPokok - potongan;

            estimasiTotal += gajiBersih;
            totalPotongan += potongan;
        }

        res.json({
            success: true,
            data: {
                estimasiTotal,
                totalPotongan,
                jumlahKaryawan: listKaryawan.length,
                bulan,
                tahun,
                namaBulan: nowWIB.toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

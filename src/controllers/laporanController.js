const supabase = require('../config/supabaseClient');

exports.getLaporanEksekutif = async (req, res) => {
    try {
        // Agregasi dummy sederhana, memanggil hitungan total (meta-data) untuk keperluan Dashboard / PDF Web Export Admin
        const { count: countInv } = await supabase.from('bahan_baku').select('*', { count: 'exact', head: true });
        const { count: countLogMasuk } = await supabase.from('log_inventori').select('*', { count: 'exact', head: true }).eq('jenis', 'masuk');
        const { count: countLogKeluar } = await supabase.from('log_inventori').select('*', { count: 'exact', head: true }).eq('jenis', 'keluar');
        
        const { count: absenHadir } = await supabase.from('absensi').select('*', { count: 'exact', head: true });
        const { count: pengajuanPending } = await supabase.from('pengajuan').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        
        res.json({
            success: true, 
            data: {
                totalKatalogBahan: countInv || 0,
                mobilitasBarangMasuk: countLogMasuk || 0,
                mobilitasBarangKeluar: countLogKeluar || 0,
                totalLogAbsenMasuk: absenHadir || 0,
                tiketPengajuanTunda: pengajuanPending || 0
            }
        });
    } catch(err) {
        res.status(500).json({ success: false, error: "Gagal menggabungkan laporan operasional", details: err.message });
    }
};

exports.getGrafikKehadiran = async (req, res) => {
    try {
        const { data, error } = await supabase.from('absensi').select('tanggal_masuk');
        let trenMap = {};
        if (data && data.length > 0) {
           data.forEach(x => {
               const dayStr = x.tanggal_masuk;
               if(trenMap[dayStr]) trenMap[dayStr]++;
               else trenMap[dayStr] = 1;
           });
        }
        
        let labels = Object.keys(trenMap).slice(-7);
        let dataset = labels.map(l => trenMap[l]);

        res.json({ success: true, data: { labels, dataset }});
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getRasioKeterlambatan = async (req, res) => {
    try {
        const { data, error } = await supabase.from('absensi').select('denda_keterlambatan');
        let tepatWaktu = 0;
        let telat = 0;
        if(data && data.length > 0) {
            data.forEach(x => {
                if(x.denda_keterlambatan > 0) telat++;
                else tepatWaktu++;
            });
        }
        
        res.json({ success: true, data: { tepatWaktu, telat }});
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

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
        // Ambil 14 hari terakhir berdasarkan WIB
        const nowWIB = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
        const labels = [];
        const labelsISO = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date(nowWIB.getTime() - i * 24 * 60 * 60 * 1000);
            const iso = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', timeZone: 'Asia/Jakarta' });
            labelsISO.push(iso);
            labels.push(label);
        }

        const startDate = labelsISO[0];
        const endDate = labelsISO[labelsISO.length - 1];

        const { data } = await supabase
            .from('absensi')
            .select('tanggal')
            .gte('tanggal', startDate)
            .lte('tanggal', endDate);

        // Hitung per tanggal
        const trenMap = {};
        labelsISO.forEach(d => { trenMap[d] = 0; });
        if (data) {
            data.forEach(x => {
                if (trenMap[x.tanggal] !== undefined) trenMap[x.tanggal]++;
            });
        }

        const dataset = labelsISO.map(d => trenMap[d]);
        res.json({ success: true, data: { labels, dataset } });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
};


exports.getRasioKeterlambatan = async (req, res) => {
    try {
        const { data } = await supabase.from('absensi').select('potongan_terlambat, menit_terlambat');
        let tepatWaktu = 0;
        let telat = 0;
        let totalDenda = 0;
        if (data && data.length > 0) {
            data.forEach(x => {
                if (parseFloat(x.potongan_terlambat || 0) > 0) {
                    telat++;
                    totalDenda += parseFloat(x.potongan_terlambat || 0);
                } else {
                    tepatWaktu++;
                }
            });
        }
        res.json({ success: true, data: { tepatWaktu, telat, totalDenda }});
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

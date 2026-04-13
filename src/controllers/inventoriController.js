const supabase = require('../config/supabaseClient');

exports.getAllBahanBaku = async (req, res) => {
    const { data, error } = await supabase.from('bahan_baku').select('*').order('nama', { ascending: true });
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
};

exports.addBahanBaku = async (req, res) => {
    const { nama, satuan, stok_minimum } = req.body;
    const { data, error } = await supabase.from('bahan_baku').insert([{ 
        nama, 
        satuan, 
        stok_minimum, 
        stok_saat_ini: 0 
    }]).select();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data: data[0] });
};

exports.updateBahanBaku = async (req, res) => {
    const { id } = req.params;
    const { nama, satuan, stok_minimum } = req.body;
    const { data, error } = await supabase.from('bahan_baku').update({ nama, satuan, stok_minimum }).eq('id', id).select();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data: data[0] });
};

exports.deleteBahanBaku = async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('bahan_baku').delete().eq('id', id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, message: 'Bahan baku berhasil dihapus' });
};

exports.catatLogInventori = async (req, res) => {
    const { bahan_baku_id, jenis, jumlah, keterangan } = req.body; // jenis = 'masuk' atau 'keluar'
    
    // Transaksi pseudo: Tarik data stok -> Update -> Insert Log
    const { data: bahan, error: errBahan } = await supabase.from('bahan_baku').select('stok_saat_ini').eq('id', bahan_baku_id).single();
    if (errBahan || !bahan) return res.status(404).json({ success: false, error: 'Bahan baku tidak ditemukan' });

    let stok_baru = jenis === 'masuk' 
        ? parseFloat(bahan.stok_saat_ini) + parseFloat(jumlah) 
        : parseFloat(bahan.stok_saat_ini) - parseFloat(jumlah);
    
    if (stok_baru < 0) return res.status(400).json({ success: false, error: 'Stok tidak boleh minus' });

    const { error: errUpdate } = await supabase.from('bahan_baku').update({ stok_saat_ini: stok_baru }).eq('id', bahan_baku_id);
    if (errUpdate) return res.status(500).json({ success: false, error: errUpdate.message });

    const { data: log, error: errLog } = await supabase.from('log_inventori').insert([{ 
        bahan_baku_id, jenis, jumlah, keterangan 
    }]).select();
    if (errLog) return res.status(500).json({ success: false, error: errLog.message });

    res.json({ success: true, stok_terbaru: stok_baru, log: log[0] });
};

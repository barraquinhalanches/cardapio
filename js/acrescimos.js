// Loader for additions (acréscimos) from `acrescimos.csv`
const ACRESCIMOS = [];

function parsePriceA(v){
    if(!v) return null;
    v = String(v).trim();
    if(v === '-' || v === '') return null;
    v = v.replace(',', '.');
    const n = parseFloat(v);
    return isNaN(n)? null : n;
}

function loadAcrescimosCsv(){
    return fetch('assets/data/acrescimos.csv').then(r=>r.arrayBuffer()).then(buf=>{
        let text;
        try { text = new TextDecoder('utf-8').decode(buf); } catch(e){ text = null; }
        if(!text || /�|Ã[\wÀ-ÿ]/.test(text)){
            try{ text = new TextDecoder('windows-1252').decode(buf); } catch(e){}
        }
        text = text || '';
        const lines = text.split(/\r?\n/).filter(l=>l.trim());
        const rows = lines.map(l=> l.split(';'));
        const header = (rows[0]||[]).map(c=> (c||'').toLowerCase()).join('|');
        let start = 0; if(header.includes('nome') && header.includes('pre')) start = 1;
        let id = 1;
        for(let i=start;i<rows.length;i++){
            const cols = rows[i].map(c=> (c||'').trim());
            if(cols.length < 2) continue;
            const nome = cols[1] || ('Item '+id);
            const precoG = parsePriceA(cols[3]);
            const precoJ = parsePriceA(cols[4]);
            ACRESCIMOS.push({ id: id, nome: nome, preco_grande: precoG, preco_junior: precoJ });
            id++;
        }
        return ACRESCIMOS;
    });
}

const ACRESCIMOS_READY = loadAcrescimosCsv();

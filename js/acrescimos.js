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
        let id = 1;
        for(const line of lines){
            // accept either ';' or ',' as separator
            let cols = line.split(';');
            if(cols.length < 2) cols = line.split(',');
            cols = cols.map(c=> (c||'').trim());
            if(cols.length < 2) continue;
            // if file has header, try to skip it
            const lower0 = (cols[0]||'').toLowerCase();
            const lower1 = (cols[1]||'').toLowerCase();
            if(id===1 && (lower0.includes('nome') || lower1.includes('nome') || lower0.includes('ingrediente') || lower1.includes('pre'))) {
                // header row, skip
                continue;
            }
            const nome = cols[0] || (`Item ${id}`);
            const preco = parsePriceA(cols[1]) || 0;
            ACRESCIMOS.push({ id: id, nome: nome, preco_grande: preco, preco_junior: null });
            id++;
        }
        return ACRESCIMOS;
    });
}

const ACRESCIMOS_READY = loadAcrescimosCsv();

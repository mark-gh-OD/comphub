const { useEffect, useMemo, useState } = React;

function fmtPct(x){
  if (x === null || x === undefined || x === '') return '—';
  const n = Number(x);
  if (Number.isNaN(n)) return String(x);
  // Rates are stored as 0.4 in sample data
  return (n * 100).toFixed(0) + '%';
}

function inEffect(row, asOfDate){
  if (!asOfDate) return true;
  const s = row?.effective_start_date;
  const e = row?.effective_end_date;
  if (!s || !e) return true;
  return s <= asOfDate && asOfDate <= e;
}

async function safeJson(res){
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { _raw: text }; }
}

function useLocalStorage(key, initial){
  const [value, setValue] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}

function TopBar({current}){
  const tabs = ["Dashboard","Summarized Rules","Rules Database","Split Database","Architecture"]; 
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-badge" />
        <div>Comp Hub</div>
      </div>
      <div className="nav">
        {tabs.map(t => (
          <a key={t} className={t===current?"active":""} href="#" onClick={(e)=>e.preventDefault()}>{t}</a>
        ))}
      </div>
      <div className="spacer" />
      <div className="userpill">ADMIN ▸ JW</div>
    </div>
  );
}

function StatusBadge({status}){
  const s = (status||'').toLowerCase();
  const cls = s === 'active' ? 'badge active' : 'badge inactive';
  return <span className={cls}>{(status||'').toUpperCase() || '—'}</span>;
}

function App(){
  const [baseUrl, setBaseUrl] = useLocalStorage('comphub_baseUrl', '');
  const [asOfDate, setAsOfDate] = useLocalStorage('comphub_asOfDate', new Date().toISOString().slice(0,10));
  const [q, setQ] = useState('');

  const [producers, setProducers] = useState([]);
  const [loadingProducers, setLoadingProducers] = useState(false);
  const [error, setError] = useState('');

  const [view, setView] = useState({ screen: 'list', producerId: null });

  async function fetchProducers(){
    if (!baseUrl) { setError('Paste your Postman Mock base URL above (e.g., https://xxxx.mock.pstmn.io).'); return; }
    setError('');
    setLoadingProducers(true);
    try {
      const url = new URL(baseUrl.replace(/\/$/, '') + '/producers');
      // pass asOfDate for future backend compatibility
      url.searchParams.set('asOfDate', asOfDate);
      const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' }});
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || ('HTTP ' + res.status));
      setProducers(Array.isArray(data) ? data : []);
    } catch (e){
      setError(String(e.message || e));
      setProducers([]);
    } finally {
      setLoadingProducers(false);
    }
  }

  useEffect(()=>{ fetchProducers(); }, []); // initial load

  const filteredProducers = useMemo(()=>{
    const list = producers.filter(p => inEffect(p, asOfDate));
    if (!q.trim()) return list;
    const qq = q.trim().toLowerCase();
    return list.filter(p =>
      String(p.producer_id||'').toLowerCase().includes(qq) ||
      String(p.producer_name||'').toLowerCase().includes(qq) ||
      String(p.network||'').toLowerCase().includes(qq)
    );
  }, [producers, q, asOfDate]);

  return (
    <>
      <TopBar current="Split Database" />
      <div className="container">
        <div className="toolbar">
          <input className="input" style={{minWidth:320, flex: 1}} value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} placeholder="Postman Mock base URL (e.g., https://xxxx.mock.pstmn.io)" />
          <input className="date" type="date" value={asOfDate} onChange={e=>setAsOfDate(e.target.value)} title="Effective / deposit month date" />
          <button className="button primary" onClick={fetchProducers}>Refresh</button>
        </div>

        {view.screen === 'list' && (
          <div className="grid">
            <div className="card">
              <div className="card-header">
                <div>
                  <h1>Producers</h1>
                  <div className="hint">Search & select a producer to view contracted rates, VCP docs, and rules usage.</div>
                </div>
                <div className="badge">asOfDate: {asOfDate}</div>
              </div>
              <div className="card-body">
                <div style={{display:'flex', gap:10, marginBottom:10}}>
                  <input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name, id, network…" style={{flex:1}} />
                  <button className="button" onClick={()=>setQ('')}>Clear</button>
                </div>
                {error && <div className="footer-note" style={{color:'#b91c1c'}}>{error}</div>}
                {loadingProducers ? (
                  <div className="footer-note">Loading…</div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Producer</th>
                        <th>Network</th>
                        <th>Vertical</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducers.map(p => (
                        <tr key={p.producer_id}>
                          <td>
                            <a className="rowlink" href="#" onClick={(e)=>{e.preventDefault(); setView({screen:'detail', producerId: p.producer_id});}}>
                              {p.producer_name || '—'}
                            </a>
                            <div className="hint">{p.producer_id}</div>
                          </td>
                          <td>{p.network || '—'}</td>
                          <td>{p.vertical || '—'}</td>
                          <td><StatusBadge status={p.status} /></td>
                        </tr>
                      ))}
                      {!filteredProducers.length && (
                        <tr><td colSpan="4" className="hint">No producers match the current filters.</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h1>How to use this demo</h1>
                  <div className="hint">This UI calls your Postman Mock Server endpoints (Path B).</div>
                </div>
              </div>
              <div className="card-body">
                <div className="kv"><div className="k">1) Set base URL</div><div>Paste the Postman Mock base URL and click <b>Refresh</b>.</div></div>
                <div className="kv"><div className="k">2) Pick as-of date</div><div>Use the date picker to simulate effective / deposit month behavior.</div></div>
                <div className="kv"><div className="k">3) Select a producer</div><div>Click a producer name to view contracted rates, VCP docs, and used-in-rules table.</div></div>
                <div className="kv"><div className="k">4) Drill into a rule</div><div>Click a Rule ID in the rules table to see its usage rows.</div></div>
                <div className="footer-note">Tip: If your mock server only has examples for P-001 / rule 12345, start there.</div>
              </div>
            </div>
          </div>
        )}

        {view.screen === 'detail' && (
          <ProducerDetail
            baseUrl={baseUrl}
            asOfDate={asOfDate}
            producerId={view.producerId}
            onBack={()=>setView({screen:'list', producerId:null})}
          />
        )}
      </div>
    </>
  );
}

function ProducerDetail({baseUrl, asOfDate, producerId, onBack}){
  const [producer, setProducer] = useState(null);
  const [vcpDocs, setVcpDocs] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [usageModal, setUsageModal] = useState({open:false, ruleId:null, data:[], loading:false, err:''});

  async function load(){
    if (!baseUrl) { setErr('Missing base URL. Go back and paste your Postman Mock base URL.'); return; }
    setLoading(true); setErr('');
    try {
      const base = baseUrl.replace(/\/$/, '');

      const pUrl = new URL(`${base}/producers/${encodeURIComponent(producerId)}`);
      pUrl.searchParams.set('asOfDate', asOfDate);
      const pRes = await fetch(pUrl.toString(), { headers: { 'Accept': 'application/json' }});
      const pData = await safeJson(pRes);
      if (!pRes.ok) throw new Error(pData?.message || ('HTTP ' + pRes.status));
      setProducer(pData);

      const dUrl = new URL(`${base}/producers/${encodeURIComponent(producerId)}/vcp-documents`);
      dUrl.searchParams.set('asOfDate', asOfDate);
      const dRes = await fetch(dUrl.toString(), { headers: { 'Accept': 'application/json' }});
      const dData = await safeJson(dRes);
      setVcpDocs(Array.isArray(dData) ? dData.filter(x => inEffect(x, asOfDate)) : []);

      const rUrl = new URL(`${base}/rules`);
      rUrl.searchParams.set('producerId', producerId);
      rUrl.searchParams.set('asOfDate', asOfDate);
      const rRes = await fetch(rUrl.toString(), { headers: { 'Accept': 'application/json' }});
      const rData = await safeJson(rRes);
      setRules(Array.isArray(rData) ? rData.filter(x => inEffect(x, asOfDate)) : []);

    } catch (e){
      setErr(String(e.message || e));
      setProducer(null); setVcpDocs([]); setRules([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ load(); }, [producerId, baseUrl, asOfDate]);

  async function openUsage(ruleId){
    setUsageModal({open:true, ruleId, data:[], loading:true, err:''});
    try {
      const base = baseUrl.replace(/\/$/, '');
      const uUrl = new URL(`${base}/rules/${encodeURIComponent(ruleId)}/usage`);
      uUrl.searchParams.set('asOfDate', asOfDate);
      const res = await fetch(uUrl.toString(), { headers: { 'Accept': 'application/json' }});
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || ('HTTP ' + res.status));
      setUsageModal({open:true, ruleId, data: Array.isArray(data) ? data.filter(x=>inEffect(x, asOfDate)) : [], loading:false, err:''});
    } catch (e){
      setUsageModal({open:true, ruleId, data:[], loading:false, err:String(e.message||e)});
    }
  }

  const titleName = producer?.producer_name || producerId;

  return (
    <>
      <div className="breadcrumb">
        <a href="#" onClick={(e)=>{e.preventDefault(); onBack();}}>← Back</a> &nbsp; / &nbsp; <b>{titleName}</b>
      </div>

      {err && <div className="footer-note" style={{color:'#b91c1c', marginBottom:10}}>{err}</div>}

      <div className="detail-top">
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{fontSize:12,color:'var(--muted)'}}>Producer</div>
              <div style={{fontSize:18,fontWeight:700}}>{titleName}</div>
              <div className="hint">{producer?.producer_id || producerId} · {producer?.network || '—'} · {producer?.vertical || '—'}</div>
            </div>
            <div><StatusBadge status={producer?.status} /></div>
          </div>
          <div className="card-body">
            <div style={{fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em'}}>Contracted Rates</div>
            <div className="rates">
              <div className="ratebox"><div className="label">Rate v1</div><div className="value">{fmtPct(producer?.rate_v1)}</div></div>
              <div className="ratebox"><div className="label">Rate v2</div><div className="value">{fmtPct(producer?.rate_v2)}</div></div>
              <div className="ratebox"><div className="label">Rate v3</div><div className="value">{fmtPct(producer?.rate_v3)}</div></div>
            </div>
            {producer?.notes && <div className="footer-note">Notes: {producer.notes}</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div style={{fontSize:12,color:'var(--muted)'}}>VCP Document</div>
              <div style={{fontSize:14,fontWeight:700}}>As-of {asOfDate}</div>
            </div>
            <div className="badge">{vcpDocs.length} docs</div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="footer-note">Loading…</div>
            ) : (
              <>
                {vcpDocs.length ? vcpDocs.map(d => (
                  <div key={d.vcp_id} style={{padding:'10px 10px', border:'1px solid var(--border)', borderRadius:10, marginBottom:10, background:'#fafafa'}}>
                    <div style={{display:'flex', justifyContent:'space-between', gap:10}}>
                      <div>
                        <div className="hint">VCP ID</div>
                        <div><a className="rowlink" href="#" onClick={(e)=>e.preventDefault()}>{d.vcp_id}</a></div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div className="hint">Status</div>
                        <StatusBadge status={d.status} />
                      </div>
                    </div>
                    <div className="kv" style={{gridTemplateColumns:'120px 1fr'}}>
                      <div className="k">Document</div><div>{d.document_name || '—'}</div>
                      <div className="k">Effective</div><div>{d.effective_start_date || '—'} → {d.effective_end_date || '—'}</div>
                    </div>
                  </div>
                )) : (
                  <div className="footer-note">No VCP documents effective on {asOfDate}.</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div style={{fontSize:12,color:'var(--muted)'}}>Used in Rules</div>
            <div style={{fontSize:14,fontWeight:700}}>Rules effective on {asOfDate}</div>
          </div>
          <div className="badge">{rules.length} rules</div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="footer-note">Loading…</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Rule Name</th>
                  <th>Status</th>
                  <th>Effective</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.rule_id}>
                    <td>
                      <a className="rowlink" href="#" onClick={(e)=>{e.preventDefault(); openUsage(r.rule_id);}}>
                        {r.rule_id}
                      </a>
                    </td>
                    <td>{r.rule_name || '—'}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="hint">{r.effective_start_date || '—'} → {r.effective_end_date || '—'}</td>
                  </tr>
                ))}
                {!rules.length && (
                  <tr><td colSpan="4" className="hint">No rules found for this producer (as-of {asOfDate}).</td></tr>
                )}
              </tbody>
            </table>
          )}
          <div className="footer-note">Click a Rule ID to drill down to rule usage (producer/account/product rows).</div>
        </div>
      </div>

      {usageModal.open && (
        <div className="modal-backdrop" onClick={()=>setUsageModal({open:false, ruleId:null, data:[], loading:false, err:''})}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <div className="card-header">
              <div>
                <div style={{fontSize:12,color:'var(--muted)'}}>Rule Usage</div>
                <div style={{fontSize:14,fontWeight:700}}>Rule {usageModal.ruleId} · asOf {asOfDate}</div>
              </div>
              <button className="button" onClick={()=>setUsageModal({open:false, ruleId:null, data:[], loading:false, err:''})}>Close</button>
            </div>
            <div className="card-body">
              {usageModal.loading ? (
                <div className="footer-note">Loading…</div>
              ) : usageModal.err ? (
                <div className="footer-note" style={{color:'#b91c1c'}}>{usageModal.err}</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Producer</th>
                      <th>Account</th>
                      <th>Product</th>
                      <th>Split %</th>
                      <th>Effective</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageModal.data.map((u, idx) => (
                      <tr key={idx}>
                        <td>{u.producer_id || '—'}</td>
                        <td>{u.account_name || '—'}</td>
                        <td>{u.product || '—'}</td>
                        <td>{fmtPct(u.split_percent)}</td>
                        <td className="hint">{u.effective_start_date || '—'} → {u.effective_end_date || '—'}</td>
                      </tr>
                    ))}
                    {!usageModal.data.length && (
                      <tr><td colSpan="5" className="hint">No usage rows returned for this rule.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

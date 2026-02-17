const { useState } = React;

function App() {
  const [selected, setSelected] = useState(null);

  const producers = [
{ producer_id: 'P-001', producer_name: 'Sean Connery', network: 'EB', vertical: 'Sales', status: 'Active', rate_v1: 0.4, rate_v2: 0.2, rate_v3: 0.1, effective_start_date: '2024-01-01', effective_end_date: '9999-12-31' },
{ producer_id: 'P-002', producer_name: 'Pierce Brosnan', network: 'EB', vertical: 'Sales', status: 'Active', rate_v1: 0.4, rate_v2: 0.2, rate_v3: 0.1, effective_start_date: '2024-01-01', effective_end_date: '9999-12-31' },
{ producer_id: 'P-003', producer_name: 'Roger Moore', network: 'EB', vertical: 'Sales', status: 'Active', rate_v1: 0.4, rate_v2: 0.2, rate_v3: 0.1, effective_start_date: '2024-01-01', effective_end_date: '9999-12-31' },
{ producer_id: 'P-004', producer_name: 'Daniel Craig', network: 'EB', vertical: 'Sales', status: 'Active', rate_v1: 0.4, rate_v2: 0.2, rate_v3: 0.1, effective_start_date: '2024-01-01', effective_end_date: '9999-12-31' }
  ];

  return (
    <div>
      <div className="topbar">Comp Hub – Producer Demo</div>
      <div className="container">
        <h2>Producers</h2>
        <table className="table">
          <thead>
            <tr><th>Name</th><th>ID</th><th>Status</th></tr>
          </thead>
          <tbody>
            {producers.map(p => (
              <tr key={p.producer_id}>
                <td><span className="rowlink" onClick={() => setSelected(p)}>{p.producer_name}</span></td>
                <td>{p.producer_id}</td>
                <td>{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {selected && (
          <div style={marginTop:'20px'}>
            <h3>Producer Detail</h3>
            <p><b>Name:</b> {selected.producer_name}</p>
            <p><b>ID:</b> {selected.producer_id}</p>
            <p><b>Rates:</b> V1 {selected.rate_v1*100}%, V2 {selected.rate_v2*100}%, V3 {selected.rate_v3*100}%</p>
          </div>
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

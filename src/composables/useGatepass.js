/**
 * useGatepass.js
 * Generates and downloads a styled HTML gatepass document for a given vehicle.
 * Usage: const { downloadGatepass } = useGatepass()
 *        downloadGatepass(vehicle, 'initial')  // or 'exit'
 */

export function useGatepass() {
  /**
   * @param {Object} vehicle  - vehicle object from the Pinia store
   * @param {'initial'|'exit'} type - which gatepass to generate
   */
  function downloadGatepass(vehicle, type = 'initial') {
    const isExit = type === 'exit'
    const gatepassNo = isExit ? vehicle.exitGatepass : vehicle.initialGatepass
    const title = isExit ? 'EXIT GATEPASS' : 'INITIAL GATEPASS'
    const accentHex = isExit ? '#10b981' : '#3b82f6'   // emerald : blue
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })
    const timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })

    const issuesRows = (vehicle.issues ?? []).map((iss, i) => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;color:#6b7280">${i + 1}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${iss.description || '—'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-family:monospace">
          BDT ${Number(iss.estimatedCost || 0).toLocaleString()}
        </td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title} – ${vehicle.licensePlate}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;background:#f3f4f6;display:flex;justify-content:center;padding:30px 10px}
    .page{background:#fff;width:800px;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)}

    /* ── Header band ── */
    .header{background:${accentHex};color:#fff;padding:28px 36px;display:flex;justify-content:space-between;align-items:center}
    .header-left h1{font-size:22px;font-weight:800;letter-spacing:.5px;margin-bottom:4px}
    .header-left p{font-size:13px;opacity:.85}
    .header-right{text-align:right}
    .header-right .gp-no{font-size:18px;font-weight:700;font-family:monospace;word-break:break-all}
    .header-right small{font-size:11px;opacity:.8;display:block;margin-top:2px}

    /* ── Workshop banner ── */
    .shop-banner{background:#1e293b;color:#fff;display:flex;align-items:center;gap:14px;padding:16px 36px}
    .shop-banner .logo{width:44px;height:44px;background:${accentHex};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
    .shop-banner h2{font-size:17px;font-weight:700}
    .shop-banner p{font-size:12px;color:#94a3b8;margin-top:2px}

    /* ── Body ── */
    .body{padding:30px 36px;display:flex;flex-direction:column;gap:24px}

    /* ── Info grid ── */
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px}
    .info-box label{display:block;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px}
    .info-box .value{font-size:15px;font-weight:600;color:#1e293b}
    .info-box .value.plate{font-family:monospace;font-size:20px;letter-spacing:2px}

    /* ── Section titles ── */
    .section-title{font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.6px;padding-bottom:8px;border-bottom:2px solid ${accentHex};margin-bottom:12px}

    /* ── Issues table ── */
    .issues-table{width:100%;border-collapse:collapse;font-size:13px}
    .issues-table thead tr{background:#f1f5f9}
    .issues-table th{padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px}
    .issues-table .total-row td{background:#f8fafc;font-weight:700;font-size:13px}

    /* ── Bill box ── */
    .bill-row{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0}
    .bill-row.highlight{background:${accentHex}15;border-color:${accentHex}40}
    .bill-row .label{font-size:13px;color:#475569}
    .bill-row .amount{font-size:15px;font-weight:700;font-family:monospace;color:#1e293b}
    .bill-row.highlight .amount{color:${accentHex};font-size:18px}

    /* ── Signature section ── */
    .sig-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:8px}
    .sig-box{text-align:center}
    .sig-line{border-top:2px dashed #cbd5e1;margin-top:50px;padding-top:8px}
    .sig-box small{font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.5px}

    /* ── Status badge ── */
    .badge{display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.3px}
    .badge-blue{background:#dbeafe;color:#1d4ed8}
    .badge-green{background:#d1fae5;color:#065f46}
    .badge-yellow{background:#fef3c7;color:#92400e}

    /* ── Footer ── */
    .footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 36px;display:flex;justify-content:space-between;align-items:center}
    .footer small{font-size:11px;color:#94a3b8}

    /* ── Print ── */
    @media print{
      body{background:#fff;padding:0}
      .page{box-shadow:none;border-radius:0;width:100%}
      .no-print{display:none!important}
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header Band -->
    <div class="header">
      <div class="header-left">
        <h1>${title}</h1>
        <p>${isExit ? 'Vehicle Exit Authorization' : 'Vehicle Entry Authorization'}</p>
      </div>
      <div class="header-right">
        <div class="gp-no">${gatepassNo ?? 'N/A'}</div>
        <small>Gatepass Number</small>
      </div>
    </div>

    <!-- Workshop Identity -->
    <div class="shop-banner">
      <div class="logo">🚗</div>
      <div>
        <h2>AutoWorkshop Management System</h2>
        <p>Authorized Workshop Service Center</p>
      </div>
    </div>

    <!-- Body -->
    <div class="body">

      <!-- Date / Time -->
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <span class="badge ${isExit ? 'badge-green' : 'badge-blue'}">${isExit ? '🚪 EXIT PASS' : '🚗 ENTRY PASS'}</span>
          ${vehicle.isNewCar ? '<span class="badge badge-yellow" style="margin-left:8px">ON TEST</span>' : ''}
        </div>
        <div style="text-align:right;font-size:12px;color:#64748b">
          <div>${dateStr}</div>
          <div style="font-weight:600;color:#1e293b">${timeStr}</div>
        </div>
      </div>

      <!-- Vehicle Information -->
      <div>
        <div class="section-title">Vehicle Information</div>
        <div class="info-grid">
          <div class="info-box">
            <label>License Plate</label>
            <div class="value plate">${vehicle.licensePlate}</div>
          </div>
          <div class="info-box">
            <label>Vehicle ID</label>
            <div class="value">${vehicle.id}</div>
          </div>
          <div class="info-box">
            <label>Assigned Supervisor</label>
            <div class="value">${vehicle.assignedSupervisor?.name ?? '—'}</div>
          </div>
          <div class="info-box">
            <label>Entry Time</label>
            <div class="value">${new Date(vehicle.entryTime).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</div>
          </div>
        </div>
      </div>

      <!-- Issues / Job Card (always shown) -->
      ${vehicle.issues?.length > 0 ? `
      <div>
        <div class="section-title">Reported Issues &amp; Job Card</div>
        <table class="issues-table">
          <thead>
            <tr>
              <th style="width:40px">#</th>
              <th>Description</th>
              <th style="text-align:right">Est. Cost</th>
            </tr>
          </thead>
          <tbody>
            ${issuesRows}
            <tr class="total-row">
              <td colspan="2" style="padding:8px 10px;text-align:right;color:#64748b">Quoted Total</td>
              <td style="padding:8px 10px;text-align:right;font-family:monospace">BDT ${Number(vehicle.quotationAmount || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>` : ''}

      <!-- Billing Section (only on exit) -->
      ${isExit ? `
      <div>
        <div class="section-title">Billing Summary</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div class="bill-row">
            <span class="label">Quoted Amount</span>
            <span class="amount">BDT ${Number(vehicle.quotationAmount || 0).toLocaleString()}</span>
          </div>
          <div class="bill-row highlight">
            <span class="label" style="font-weight:700;color:#1e293b">Final Approved Bill</span>
            <span class="amount">BDT ${Number(vehicle.finalBillAmount || 0).toLocaleString()}</span>
          </div>
          ${vehicle.receiptNo ? `
          <div class="bill-row">
            <span class="label">Receipt Number</span>
            <span class="amount" style="font-size:13px">${vehicle.receiptNo}</span>
          </div>` : ''}
        </div>
      </div>` : ''}

      <!-- Signatures -->
      <div>
        <div class="section-title">Authorizations</div>
        <div class="sig-grid">
          <div class="sig-box">
            <div class="sig-line"><small>Security Guard</small></div>
          </div>
          <div class="sig-box">
            <div class="sig-line"><small>Supervisor / In-charge</small></div>
          </div>
          <div class="sig-box">
            <div class="sig-line"><small>${isExit ? 'Cashier / Accounts' : 'Manager'}</small></div>
          </div>
        </div>
      </div>

    </div><!-- /body -->

    <!-- Footer -->
    <div class="footer">
      <small>AutoWorkshop MS · ${gatepassNo ?? ''}</small>
      <small>Generated: ${dateStr} ${timeStr}</small>
    </div>

  </div><!-- /page -->

  <div class="no-print" style="text-align:center;margin-top:20px">
    <button onclick="window.print()" style="background:${accentHex};color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <script>
    // Auto-trigger print dialog when opened as popup
    if (window.opener) { window.onload = () => setTimeout(() => window.print(), 400); }
  <\/script>
</body>
</html>`

    // Open in a new tab / popup
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank', 'width=900,height=750,scrollbars=yes')
    if (!win) {
      // Fallback: direct download as .html file
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-gatepass-${vehicle.licensePlate}-${vehicle.id}.html`
      a.click()
    }
    // Clean up the object URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return { downloadGatepass }
}

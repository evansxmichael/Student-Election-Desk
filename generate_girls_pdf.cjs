const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Read data
const DATA_FILE = path.join(__dirname, 'data', 'election_store.json');
const raw = fs.readFileSync(DATA_FILE, 'utf8');
const allStudents = JSON.parse(raw);

// 2. Filter female voters
const girls = allStudents.filter(s => s.gender === 'Female');
console.log(`Found ${girls.length} female voters.`);

// Define preferred sort order for courses and years
const courseOrder = [
  'B.Tech (Computer Science)',
  'M.Tech (Computer Science)',
  'MCA',
  'B.Tech Civil (SF)',
  'B.Sc Fashion Technology',
  'Diploma Fashion Technology',
  'B.Sc Interior Design'
];

const yearOrder = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

function getCourseRank(course) {
  const idx = courseOrder.indexOf(course);
  return idx === -1 ? 99 : idx;
}

function getYearRank(year) {
  const idx = yearOrder.indexOf(year);
  return idx === -1 ? 99 : idx;
}

// Group by Course + Year
const groups = {};
girls.forEach(student => {
  const course = student.course || 'Other';
  const year = student.year || 'Unknown';
  const key = `${course}__${year}`;
  if (!groups[key]) {
    groups[key] = {
      course,
      year,
      students: []
    };
  }
  groups[key].students.push(student);
});

// Convert to array and sort groups
const sortedGroups = Object.values(groups).sort((a, b) => {
  if (getCourseRank(a.course) !== getCourseRank(b.course)) {
    return getCourseRank(a.course) - getCourseRank(b.course);
  }
  return getYearRank(a.year) - getYearRank(b.year);
});

// Sort students within each group by Roll Number (or Name)
sortedGroups.forEach(g => {
  g.students.sort((a, b) => (a.roll || '').localeCompare(b.roll || '') || a.name.localeCompare(b.name));
});

// Build HTML content
const summaryRows = sortedGroups.map((g, i) => `
  <tr>
    <td style="text-align: center; font-weight: 600; color: #475569;">${i + 1}</td>
    <td style="font-weight: 700; color: #0f172a;">${g.course}</td>
    <td style="color: #334155; font-weight: 600;">${g.year}</td>
    <td style="text-align: center; font-weight: 800; color: #2563eb;">${g.students.length}</td>
  </tr>
`).join('');

let overallIndex = 1;
const groupSections = sortedGroups.map((g, gIdx) => {
  const rows = g.students.map((s, idx) => {
    const curIdx = overallIndex++;
    return `
      <tr>
        <td class="col-num">${curIdx}</td>
        <td class="col-roll"><code>${s.roll || '—'}</code></td>
        <td class="col-name">${s.name}</td>
        <td class="col-res"><span class="badge ${s.residence === 'Outside' ? 'badge-outside' : 'badge-hostel'}">${s.residence || 'Hostel'}</span></td>
        <td class="col-status">${s.status === 'Voted' ? '<span class="status-voted">VOTED</span>' : '<span class="status-pending">PENDING</span>'}</td>
        <td class="col-sign"><div class="sign-box"></div></td>
      </tr>
    `;
  }).join('');

  return `
    <div class="group-section ${gIdx > 0 ? 'page-break-before' : ''}">
      <div class="group-header">
        <div class="group-title-wrap">
          <span class="group-badge">${gIdx + 1}</span>
          <div>
            <h2 class="group-title">${g.course}</h2>
            <div class="group-subtitle">${g.year} &bull; Total Candidates: <strong>${g.students.length}</strong></div>
          </div>
        </div>
        <div class="group-meta">Official Female Roll</div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 45px; text-align: center;">#</th>
            <th style="width: 130px;">Roll Number</th>
            <th>Candidate Full Name</th>
            <th style="width: 90px; text-align: center;">Residence</th>
            <th style="width: 90px; text-align: center;">Poll Status</th>
            <th style="width: 140px; text-align: center;">Voter Signature</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}).join('');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Female Voters Roll - Course & Year Wise</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 14mm 10mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      color: #0f172a;
      line-height: 1.35;
      background: #ffffff;
      padding: 0;
    }

    /* Cover / Main Header */
    .header {
      border: 2px solid #0f172a;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left h1 {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .header-left .sub {
      font-size: 12px;
      font-weight: 600;
      color: #be185d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .header-left .desc {
      font-size: 10px;
      color: #475569;
      margin-top: 4px;
    }

    .header-right {
      text-align: right;
    }

    .stat-pill {
      background: #be185d;
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 20px;
      display: inline-block;
      text-align: center;
    }

    .stat-pill .num {
      font-size: 20px;
      font-weight: 800;
      line-height: 1;
    }

    .stat-pill .lbl {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
      opacity: 0.95;
    }

    /* Summary Card */
    .summary-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin-bottom: 18px;
      overflow: hidden;
      page-break-after: always;
    }

    .summary-title {
      background: #1e293b;
      color: #ffffff;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }

    .summary-table th {
      background: #f1f5f9;
      padding: 6px 10px;
      text-align: left;
      font-size: 9.5px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      border-bottom: 1px solid #cbd5e1;
    }

    .summary-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #e2e8f0;
    }

    .summary-table tr:last-child td {
      border-bottom: none;
    }

    .summary-table tr:nth-child(even) {
      background: #fafafa;
    }

    /* Group Sections */
    .group-section {
      margin-bottom: 18px;
      page-break-inside: auto;
    }

    .page-break-before {
      page-break-before: always;
    }

    .group-header {
      background: #0f172a;
      color: #ffffff;
      padding: 8px 12px;
      border-radius: 6px 6px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
    }

    .group-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .group-badge {
      background: #be185d;
      color: #ffffff;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 11px;
    }

    .group-title {
      font-size: 12.5px;
      font-weight: 800;
      letter-spacing: 0.2px;
    }

    .group-subtitle {
      font-size: 9.5px;
      color: #cbd5e1;
    }

    .group-meta {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #f472b6;
      background: rgba(244, 114, 182, 0.15);
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid rgba(244, 114, 182, 0.3);
    }

    /* Data Table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      border-top: none;
      font-size: 10.5px;
    }

    .data-table thead th {
      background: #f8fafc;
      color: #334155;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 6px 8px;
      border-bottom: 2px solid #cbd5e1;
      border-right: 1px solid #e2e8f0;
    }

    .data-table thead th:last-child {
      border-right: none;
    }

    .data-table tbody tr {
      page-break-inside: avoid;
    }

    .data-table tbody tr:nth-child(even) {
      background: #fdfdfe;
    }

    .data-table tbody td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      vertical-align: middle;
    }

    .data-table tbody td:last-child {
      border-right: none;
    }

    .col-num {
      text-align: center;
      font-weight: 600;
      color: #64748b;
    }

    .col-roll code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 700;
      color: #0f172a;
      font-size: 10px;
      background: #f1f5f9;
      padding: 2px 4px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }

    .col-name {
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.1px;
    }

    .col-res {
      text-align: center;
    }

    .badge {
      display: inline-block;
      font-size: 8.5px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .badge-hostel {
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }

    .badge-outside {
      background: #f3e8ff;
      color: #7e22ce;
      border: 1px solid #e9d5ff;
    }

    .col-status {
      text-align: center;
    }

    .status-voted {
      font-size: 8.5px;
      font-weight: 800;
      color: #15803d;
      background: #dcfce7;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #bbf7d0;
    }

    .status-pending {
      font-size: 8.5px;
      font-weight: 700;
      color: #92400e;
      background: #fef3c7;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #fde68a;
    }

    .sign-box {
      border-bottom: 1px dashed #94a3b8;
      height: 20px;
      margin: 2px 6px;
    }

    /* Footer Signatures */
    .officer-signatures {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
      padding: 10px 20px;
    }

    .officer-box {
      text-align: center;
      width: 220px;
    }

    .officer-line {
      border-top: 1.5px solid #0f172a;
      margin-bottom: 6px;
    }

    .officer-title {
      font-size: 10px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
    }

    .officer-desc {
      font-size: 8.5px;
      color: #64748b;
    }
  </style>
</head>
<body>

  <!-- Official Header -->
  <div class="header">
    <div class="header-left">
      <h1>Student Council Election 2026</h1>
      <div class="sub">Official Female Polling Roll & Turnout Register</div>
      <div class="desc">Department, Course & Academic Year-wise Verified Voter Roll &bull; Maulana Azad National Urdu University</div>
    </div>
    <div class="header-right">
      <div class="stat-pill">
        <div class="num">126</div>
        <div class="lbl">Female Voters</div>
      </div>
    </div>
  </div>

  <!-- Executive Summary -->
  <div class="summary-card">
    <div class="summary-title">Department & Academic Year Executive Summary</div>
    <table class="summary-table">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">#</th>
          <th>Academic Course / Department</th>
          <th style="width: 140px;">Academic Stage / Year</th>
          <th style="width: 110px; text-align: center;">Eligible Voters</th>
        </tr>
      </thead>
      <tbody>
        ${summaryRows}
        <tr style="background: #f1f5f9; font-weight: 800;">
          <td colspan="3" style="text-align: right; text-transform: uppercase; font-size: 10px;">Total Verified Female Voters:</td>
          <td style="text-align: center; font-size: 12px; color: #be185d;">126</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Detailed Course & Year Sections -->
  ${groupSections}

  <!-- Final Signature Section -->
  <div class="officer-signatures">
    <div class="officer-box">
      <div class="officer-line"></div>
      <div class="officer-title">Presiding Officer (Girls Booth)</div>
      <div class="officer-desc">Signature & Date Stamp</div>
    </div>
    <div class="officer-box">
      <div class="officer-line"></div>
      <div class="officer-title">Polling Agent / Observer</div>
      <div class="officer-desc">Student Council Election Desk</div>
    </div>
    <div class="officer-box">
      <div class="officer-line"></div>
      <div class="officer-title">Chief Election Officer</div>
      <div class="officer-desc">Official Certification Seal</div>
    </div>
  </div>

</body>
</html>
`;

// Save HTML to disk
const HTML_FILE = path.join(__dirname, 'girls_voters_course_year_wise.html');
fs.writeFileSync(HTML_FILE, htmlContent, 'utf8');
console.log(`Saved HTML report to: ${HTML_FILE}`);

// Print to PDF using headless Microsoft Edge
const PDF_FILE = path.join(__dirname, 'Female_Voters_Course_Year_Wise.pdf');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (fs.existsSync(edgePath)) {
  console.log('Generating PDF using Microsoft Edge headless...');
  const cmd = `"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${PDF_FILE}" --no-pdf-header-footer "${HTML_FILE}"`;
  execSync(cmd);
  console.log(`Successfully generated PDF: ${PDF_FILE}`);
  
  // Also copy to Desktop if exists
  const desktopPath = path.join('C:\\Users\\xisha\\Desktop', 'Female_Voters_Course_Year_Wise.pdf');
  try {
    fs.copyFileSync(PDF_FILE, desktopPath);
    console.log(`Copied PDF to Desktop: ${desktopPath}`);
  } catch (e) {
    console.log('Could not copy to desktop:', e.message);
  }
} else {
  console.error('Microsoft Edge not found at:', edgePath);
}

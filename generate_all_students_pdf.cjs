const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Read student data
const DATA_FILE = path.join(__dirname, 'data', 'election_store.json');
const raw = fs.readFileSync(DATA_FILE, 'utf8');
const allStudents = JSON.parse(raw);
console.log(`Loaded ${allStudents.length} total students.`);

// 2. Define preferred course order
const courseOrder = [
  'B.Tech (Computer Science)',
  'M.Tech (Computer Science)',
  'MCA',
  'B.Tech Civil (SF)',
  'B.Sc Fashion Technology',
  'Diploma Fashion Technology',
  'B.Sc Interior Design',
  'Diploma Interior Design'
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

// Group students by Course + Year
const groups = {};
allStudents.forEach(student => {
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

// Sort groups by courseOrder and yearOrder
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

// Calculate statistics
let totalStudents = allStudents.length;
let totalMale = allStudents.filter(s => s.gender === 'Male').length;
let totalFemale = allStudents.filter(s => s.gender === 'Female').length;
let totalHostel = allStudents.filter(s => s.residence === 'Hostel').length;
let totalOutside = allStudents.filter(s => s.residence === 'Outside').length;

// Executive Summary Table Rows
const summaryRows = sortedGroups.map((g, i) => {
  const mCount = g.students.filter(s => s.gender === 'Male').length;
  const fCount = g.students.filter(s => s.gender === 'Female').length;
  return `
    <tr>
      <td style="text-align: center; font-weight: 700; color: #475569;">${i + 1}</td>
      <td style="font-weight: 700; color: #0f172a;">${g.course}</td>
      <td style="color: #334155; font-weight: 600;">${g.year}</td>
      <td style="text-align: center; font-weight: 700; color: #0284c7;">${mCount}</td>
      <td style="text-align: center; font-weight: 700; color: #db2777;">${fCount}</td>
      <td style="text-align: center; font-weight: 800; color: #1e3a8a; background: #f8fafc;">${g.students.length}</td>
    </tr>
  `;
}).join('');

// Group Sections (Course + Year)
let overallIndex = 1;
const groupSections = sortedGroups.map((g, gIdx) => {
  const mCount = g.students.filter(s => s.gender === 'Male').length;
  const fCount = g.students.filter(s => s.gender === 'Female').length;

  const rows = g.students.map((s, idx) => {
    const curIdx = overallIndex++;
    const isFemale = s.gender === 'Female';
    const isVoted = s.status === 'Voted';
    return `
      <tr>
        <td class="col-num">${curIdx}</td>
        <td class="col-roll"><code>${s.roll || '—'}</code></td>
        <td class="col-name">${s.name}</td>
        <td class="col-gender"><span class="badge ${isFemale ? 'badge-female' : 'badge-male'}">${s.gender || 'Male'}</span></td>
        <td class="col-res"><span class="badge ${s.residence === 'Outside' ? 'badge-outside' : 'badge-hostel'}">${s.residence || 'Hostel'}</span></td>
        <td class="col-status">${isVoted ? '<span class="status-voted">VOTED</span>' : '<span class="status-pending">PENDING</span>'}</td>
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
            <div class="group-subtitle">
              <span>Academic Year: <strong>${g.year}</strong></span> &bull; 
              <span>Total Voters: <strong>${g.students.length}</strong></span> &bull; 
              <span style="color: #0369a1;">Male: <strong>${mCount}</strong></span> &bull; 
              <span style="color: #be185d;">Female: <strong>${fCount}</strong></span>
            </div>
          </div>
        </div>
        <div class="group-count-badge">
          ${g.students.length} Voters
        </div>
      </div>

      <table class="voters-table">
        <thead>
          <tr>
            <th class="col-num">#</th>
            <th class="col-roll">Roll / Enrolment No.</th>
            <th class="col-name">Student Full Name</th>
            <th class="col-gender">Gender</th>
            <th class="col-res">Residence</th>
            <th class="col-status">Status</th>
            <th class="col-sign">Voter Signature / Stamp</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}).join('');

// Full HTML Document Template
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Master Voter Roll - Course & Year Wise</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 12mm 14mm 12mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 9pt;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Top Institutional Header */
    .official-header {
      border-bottom: 2.5px solid #1e3a8a;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .emblem-wrap {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      background: #1e3a8a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 20px;
      letter-spacing: -0.5px;
      border: 2px solid #3b82f6;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      flex-shrink: 0;
    }

    .header-text {
      flex: 1;
    }

    .super-title {
      font-size: 8pt;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #1e3a8a;
      margin-bottom: 2px;
    }

    .main-title {
      font-size: 15pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.3px;
      line-height: 1.15;
    }

    .sub-title {
      font-size: 8.5pt;
      color: #475569;
      font-weight: 600;
      margin-top: 3px;
    }

    .header-pills {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      flex-shrink: 0;
    }

    .pill {
      font-size: 7.5pt;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .pill-blue {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }

    .pill-green {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    /* Stats Ribbon */
    .stats-ribbon {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }

    .stat-box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 8px;
      padding: 8px 10px;
      text-align: center;
    }

    .stat-label {
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #64748b;
      margin-bottom: 2px;
    }

    .stat-val {
      font-size: 13pt;
      font-weight: 900;
      color: #0f172a;
      font-family: "Segoe UI", Roboto, monospace;
    }

    .stat-sub {
      font-size: 6.5pt;
      font-weight: 700;
      color: #94a3b8;
    }

    /* Executive Summary Table */
    .summary-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      margin-bottom: 18px;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .summary-title {
      background: #1e3a8a;
      color: #ffffff;
      padding: 6px 12px;
      font-size: 8.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    .summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
    }

    .summary-table th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 7pt;
      letter-spacing: 0.5px;
      padding: 5px 8px;
      border-bottom: 1.5px solid #cbd5e1;
      text-align: left;
    }

    .summary-table td {
      padding: 4.5px 8px;
      border-bottom: 1px solid #f1f5f9;
    }

    .summary-table tr:nth-child(even) td {
      background: #fafafa;
    }

    /* Group Sections */
    .page-break-before {
      page-break-before: always;
    }

    .group-section {
      margin-bottom: 16px;
    }

    .group-header {
      background: linear-gradient(90deg, #1e293b, #334155);
      color: #ffffff;
      padding: 8px 12px;
      border-radius: 8px 8px 0 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 10px;
      page-break-after: avoid;
      page-break-inside: avoid;
    }

    .group-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .group-badge {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: #3b82f6;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 8pt;
      flex-shrink: 0;
    }

    .group-title {
      font-size: 10.5pt;
      font-weight: 800;
      letter-spacing: -0.2px;
      line-height: 1.2;
    }

    .group-subtitle {
      font-size: 7.5pt;
      color: #cbd5e1;
      margin-top: 1px;
    }

    .group-subtitle strong {
      color: #ffffff;
    }

    .group-count-badge {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 7.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Voters Table */
    .voters-table {
      width: 100%;
      border-collapse: collapse;
      border-left: 1px solid #cbd5e1;
      border-right: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      font-size: 8pt;
    }

    .voters-table thead {
      display: table-header-group;
    }

    .voters-table tr {
      page-break-inside: avoid;
    }

    .voters-table th {
      background: #f8fafc;
      color: #334155;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 6.8pt;
      letter-spacing: 0.5px;
      padding: 5px 6px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1.5px solid #cbd5e1;
      border-right: 1px solid #e2e8f0;
      text-align: left;
    }

    .voters-table td {
      padding: 4px 6px;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .voters-table tr:nth-child(even) td {
      background: #fbfcfe;
    }

    /* Columns */
    .col-num {
      width: 32px;
      text-align: center;
      font-weight: 700;
      color: #64748b;
      font-size: 7.5pt;
    }

    .col-roll {
      width: 95px;
      font-family: "Courier New", Courier, monospace;
      font-weight: 700;
      color: #0f172a;
      font-size: 7.8pt;
    }

    .col-name {
      font-weight: 700;
      color: #0f172a;
    }

    .col-gender {
      width: 55px;
      text-align: center;
    }

    .col-res {
      width: 60px;
      text-align: center;
    }

    .col-status {
      width: 65px;
      text-align: center;
    }

    .col-sign {
      width: 90px;
      text-align: center;
    }

    /* Badges */
    .badge {
      display: inline-block;
      font-size: 6.8pt;
      font-weight: 800;
      padding: 1.5px 5px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .badge-female {
      background: #fdf2f8;
      color: #be185d;
      border: 1px solid #fbcfe8;
    }

    .badge-male {
      background: #f0f9ff;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }

    .badge-hostel {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #dbeafe;
    }

    .badge-outside {
      background: #f5f3ff;
      color: #6d28d9;
      border: 1px solid #ede9fe;
    }

    .status-voted {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      padding: 1.5px 5px;
      border-radius: 4px;
      font-weight: 800;
      font-size: 6.8pt;
    }

    .status-pending {
      background: #f8fafc;
      color: #64748b;
      border: 1px solid #e2e8f0;
      padding: 1.5px 5px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 6.8pt;
    }

    .sign-box {
      border-bottom: 1px dashed #94a3b8;
      height: 16px;
      width: 80%;
      margin: 0 auto;
    }

    /* Signatures Block */
    .officer-signatures {
      margin-top: 25px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      page-break-inside: avoid;
      padding-top: 15px;
      border-top: 1.5px solid #cbd5e1;
    }

    .officer-box {
      text-align: center;
    }

    .officer-line {
      border-bottom: 1.5px solid #475569;
      height: 35px;
      margin-bottom: 6px;
    }

    .officer-title {
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
    }

    .officer-desc {
      font-size: 7pt;
      color: #64748b;
      margin-top: 1px;
    }
  </style>
</head>
<body>

  <!-- Official Header -->
  <div class="official-header">
    <div style="display: flex; align-items: center; gap: 12px;">
      <div class="emblem-wrap">ED</div>
      <div class="header-text">
        <div class="super-title">Official Student Council Election Desk &bull; 2026</div>
        <h1 class="main-title">Master Voter Roll & Turnout Register</h1>
        <div class="sub-title">Complete Department-Wise & Academic Year-Wise Voter Roster (All 492 Verified Voters)</div>
      </div>
    </div>
    <div class="header-pills">
      <span class="pill pill-blue">Official Electoral Register</span>
      <span class="pill pill-green">Verified & Certified</span>
    </div>
  </div>

  <!-- Stats Ribbon -->
  <div class="stats-ribbon">
    <div class="stat-box">
      <div class="stat-label">Total Registered</div>
      <div class="stat-val">${totalStudents}</div>
      <div class="stat-sub">100% Verified</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Male Voters</div>
      <div class="stat-val" style="color: #0284c7;">${totalMale}</div>
      <div class="stat-sub">${((totalMale / totalStudents) * 100).toFixed(1)}% Share</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Female Voters</div>
      <div class="stat-val" style="color: #db2777;">${totalFemale}</div>
      <div class="stat-sub">${((totalFemale / totalStudents) * 100).toFixed(1)}% Share</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Hostellers</div>
      <div class="stat-val" style="color: #1e40af;">${totalHostel}</div>
      <div class="stat-sub">Campus Residents</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Day Scholars</div>
      <div class="stat-val" style="color: #7c3aed;">${totalOutside}</div>
      <div class="stat-sub">Outside Commuters</div>
    </div>
  </div>

  <!-- Executive Summary -->
  <div class="summary-card">
    <div class="summary-title">Department & Academic Year Master Breakdown</div>
    <table class="summary-table">
      <thead>
        <tr>
          <th style="width: 35px; text-align: center;">#</th>
          <th>Academic Course / Department</th>
          <th style="width: 120px;">Academic Year</th>
          <th style="width: 80px; text-align: center;">Male</th>
          <th style="width: 80px; text-align: center;">Female</th>
          <th style="width: 100px; text-align: center;">Total Voters</th>
        </tr>
      </thead>
      <tbody>
        ${summaryRows}
        <tr style="background: #f1f5f9; font-weight: 800;">
          <td colspan="3" style="text-align: right; text-transform: uppercase; font-size: 8pt; color: #1e3a8a;">Grand Total (All Departments):</td>
          <td style="text-align: center; font-size: 9pt; color: #0284c7;">${totalMale}</td>
          <td style="text-align: center; font-size: 9pt; color: #db2777;">${totalFemale}</td>
          <td style="text-align: center; font-size: 10.5pt; color: #1e3a8a; background: #e2e8f0;">${totalStudents}</td>
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
      <div class="officer-title">Presiding Officer</div>
      <div class="officer-desc">Polling Desk Attendance Verification</div>
    </div>
    <div class="officer-box">
      <div class="officer-line"></div>
      <div class="officer-title">Polling Agent / Observer</div>
      <div class="officer-desc">Student Council Election Desk</div>
    </div>
    <div class="officer-box">
      <div class="officer-line"></div>
      <div class="officer-title">Chief Election Officer</div>
      <div class="officer-desc">Official Certification & Seal Stamp</div>
    </div>
  </div>

</body>
</html>
`;

// Save HTML to disk
const HTML_FILE = path.join(__dirname, 'all_students_course_year_wise.html');
fs.writeFileSync(HTML_FILE, htmlContent, 'utf8');
console.log(`Saved HTML report to: ${HTML_FILE}`);

// Print to PDF using headless Microsoft Edge
const PDF_FILE = path.join(__dirname, 'All_Students_Course_Year_Wise.pdf');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (fs.existsSync(edgePath)) {
  console.log('Generating PDF using Microsoft Edge headless...');
  const cmd = `"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${PDF_FILE}" --no-pdf-header-footer "${HTML_FILE}"`;
  execSync(cmd);
  console.log(`Successfully generated PDF: ${PDF_FILE}`);
  
  // Also copy to Desktop if exists
  const desktopPath = path.join('C:\\Users\\xisha\\Desktop', 'All_Students_Course_Year_Wise.pdf');
  try {
    fs.copyFileSync(PDF_FILE, desktopPath);
    console.log(`Copied PDF to Desktop: ${desktopPath}`);
  } catch (e) {
    console.log('Could not copy to desktop:', e.message);
  }
} else {
  console.error('Microsoft Edge not found at:', edgePath);
}

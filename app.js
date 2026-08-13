// ==== Constants & State ====
const ROSTER_KEY = 'sk2042_roster';
const ATTENDANCE_KEY = 'sk2042_attendance';

let rosterData = [];
let attendanceData = {}; // Format: { "YYYY-MM-DD": { memberId: true/false } }
function getLocalYMD(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function getWeekRange(dateStr) {
  const parts = dateStr.split('-');
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const day = d.getDay(); // 0 is Sunday
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 7); // Sunday to next Sunday
  return { start, end, key: getLocalYMD(start) };
}

let currentDate = getLocalYMD(new Date()); // Default to today 'YYYY-MM-DD'
let currentWeek = getWeekRange(currentDate);
let allData = []; // Combined roster + attendance for the current view

// ==== DOM refs ====
const tbody = document.querySelector('#resultTable tbody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const exportBtn = document.getElementById('exportBtn');
const todayDateEl = document.getElementById('todayDate');
const datePicker = document.getElementById('datePicker');
const lastUpdateEl = document.getElementById('lastUpdate');
const gaugeEl = document.getElementById('gauge');

// Member management DOM
const memberForm = document.getElementById('memberForm');
const membersTbody = document.querySelector('#membersTable tbody');
const btnCancelEdit = document.getElementById('btnCancelEdit');
const memberIdInput = document.getElementById('memberId');
const memberNameInput = document.getElementById('memberName');
const memberCensusInput = document.getElementById('memberCensus');
const memberMobileInput = document.getElementById('memberMobile');
const memberCategoryInput = document.getElementById('memberCategory');

// ==== Date display (Marathi) ====
const marathiMonths = ["जानेवारी","फेब्रुवारी","मार्च","एप्रिल","मे","जून","जुलै","ऑगस्ट","सप्टेंबर","ऑक्टोबर","नोव्हेंबर","डिसेंबर"];
const marathiDays = ["रविवार","सोमवार","मंगळवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"];
const marathiMonthsEn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtShort(d) {
  return `${d.getDate()} ${marathiMonths[d.getMonth()]} ${d.getFullYear()}`;
}

// ==== Data Initialization (LocalStorage) ====
function initData() {
  const savedRoster = localStorage.getItem(ROSTER_KEY);
  if (savedRoster) {
    rosterData = JSON.parse(savedRoster);
  } else {
    // Migrate from hardcoded roster.js
    let idCounter = 1;
    const generateId = () => 'm_' + (idCounter++) + '_' + Date.now().toString(36);
    
    rosterData = [
      ...maleRoster.map(i => ({ id: generateId(), name: i.name, census: i.census, mobile: i.mobile || '', category: 'पुरुष' })),
      ...femaleRoster.map(i => ({ id: generateId(), name: i.name, census: i.census, mobile: i.mobile || '', category: 'महिला' }))
    ];
    saveRoster();
  }

  const savedAttendance = localStorage.getItem(ATTENDANCE_KEY);
  if (savedAttendance) {
    attendanceData = JSON.parse(savedAttendance);
  } else {
    attendanceData = {};
  }
}

function saveRoster() {
  localStorage.setItem(ROSTER_KEY, JSON.stringify(rosterData));
}

function saveAttendance() {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendanceData));
  stampUpdate();
}

function prepareCurrentViewData() {
  const weekKey = currentWeek.key;
  if (!attendanceData[weekKey]) {
    attendanceData[weekKey] = {}; // Default absent
  }
  const currentAtt = attendanceData[weekKey];
  
  allData = rosterData.map((member, index) => ({
    ...member,
    sr: index + 1,
    present: !!currentAtt[member.id]
  }));
}

// ==== UI Updates ====
function renderToday() {
  datePicker.value = currentDate;
  updateWeekDisplay();
}

function updateWeekDisplay() {
  const weekRangeEl = document.getElementById('weekRange');
  if (weekRangeEl) {
    weekRangeEl.style.display = 'inline-block';
    weekRangeEl.textContent = `साप्ताहिक कालावधी: ${fmtShort(currentWeek.start)} ते ${fmtShort(currentWeek.end)}`;
  }
}

function stampUpdate() {
  const now = new Date();
  const hh = now.getHours() % 12 || 12;
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const dd = String(now.getDate()).padStart(2, '0');
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  lastUpdateEl.textContent = `${dd}/${mo}/${now.getFullYear()} ${hh}:${mm} ${ampm}`;
}

function updateStats(data) {
  const total = data.length;
  const present = data.filter(i => i.present).length;
  const absent = total - present;
  const pct = total ? Math.round((present / total) * 100) : 0;

  document.getElementById('totalCount').textContent = total;
  document.getElementById('presentCount').textContent = present;
  document.getElementById('todayAbsentCount').textContent = absent;
  document.getElementById('absentCount').textContent = absent;
  document.getElementById('percentCount').textContent = pct + '%';

  document.getElementById('sideTotalCount').textContent = total;
  document.getElementById('sidePresentCount').textContent = present;
  document.getElementById('sideAbsentCount').textContent = absent;

  gaugeEl.style.setProperty('--pct', pct);
}

// ==== Attendance Table rendering ====
function renderTable(data) {
  tbody.innerHTML = '';
  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.sr}</td>
      <td>${item.name}</td>
      <td>${item.census || '-'}</td>
      <td>${item.mobile || '-'}</td>
      <td><span class="badge ${item.present ? 'badge-present' : 'badge-absent'}">${item.present ? 'उपस्थित' : 'अनुपस्थित'}</span></td>
      <td><button class="toggle-btn ${item.present ? 'is-present' : ''}" data-id="${item.id}">
        ${item.present ? '✓ उपस्थित' : '✓ उपस्थित'}
      </button></td>
    `;
    tbody.appendChild(row);
  });
}

function applyFilters() {
  const term = searchInput.value.trim().toLowerCase();
  const filter = statusFilter.value;

  let filtered = allData.filter(i => {
    const matchesTerm = !term ||
      i.name.toLowerCase().includes(term) ||
      (i.census || '').toLowerCase().includes(term) ||
      (i.mobile || '').toLowerCase().includes(term);
    const matchesStatus = filter === 'all' || (filter === 'present' ? i.present : !i.present);
    return matchesTerm && matchesStatus;
  });

  renderTable(filtered);
  updateStats(allData); 
}

// ==== Toggle attendance ====
tbody.addEventListener('click', (e) => {
  const btn = e.target.closest('.toggle-btn');
  if (!btn) return;
  const { id } = btn.dataset;
  
  const weekKey = currentWeek.key;
  if (!attendanceData[weekKey]) attendanceData[weekKey] = {};
  
  attendanceData[weekKey][id] = !attendanceData[weekKey][id];
  saveAttendance();
  
  prepareCurrentViewData();
  applyFilters();
});

// ==== Search / filter listeners ====
searchInput.addEventListener('input', applyFilters);
statusFilter.addEventListener('change', applyFilters);
datePicker.addEventListener('change', (e) => {
  if(e.target.value) {
    currentDate = e.target.value;
    currentWeek = getWeekRange(currentDate);
    updateWeekDisplay();
    prepareCurrentViewData();
    applyFilters();
  }
});

function changeWeek(offsetDays) {
  const parts = currentDate.split('-');
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + offsetDays);
  currentDate = getLocalYMD(d);
  datePicker.value = currentDate;
  currentWeek = getWeekRange(currentDate);
  updateWeekDisplay();
  prepareCurrentViewData();
  applyFilters();
}

document.getElementById('prevWeekBtn').addEventListener('click', () => changeWeek(-7));
document.getElementById('nextWeekBtn').addEventListener('click', () => changeWeek(7));

// ==== Export ====
exportBtn.addEventListener('click', () => {
  const rangeLabel = `Attendance for: ${fmtShort(currentWeek.start)} to ${fmtShort(currentWeek.end)}`;

  const workbook = XLSX.utils.book_new();
  const format = (roster) => roster.map(i => ({
    "Sr. No.": i.sr,
    "Name": i.name,
    "Census No.": i.census || "-",
    "Mobile": i.mobile || "-",
    "Status": i.present ? "Present" : "Absent"
  }));
  const male = allData.filter(i => i.category === 'पुरुष');
  const female = allData.filter(i => i.category === 'महिला');

  const buildSheet = (roster) => {
    const rows = format(roster);
    const ws = XLSX.utils.json_to_sheet(rows, { origin: "A3" });
    XLSX.utils.sheet_add_aoa(ws, [[rangeLabel]], { origin: "A1" });
    return ws;
  };

  if(male.length > 0) XLSX.utils.book_append_sheet(workbook, buildSheet(male), "Male");
  if(female.length > 0) XLSX.utils.book_append_sheet(workbook, buildSheet(female), "Female");
  
  // Fallback if both empty
  if(male.length === 0 && female.length === 0) {
      XLSX.utils.book_append_sheet(workbook, buildSheet([]), "Empty");
  }

  const fileStamp = currentWeek.key;
  XLSX.writeFile(workbook, `Attendance_${fileStamp}.xlsx`);
});

const exportMonthlyBtn = document.getElementById('exportMonthlyBtn');
if (exportMonthlyBtn) {
  exportMonthlyBtn.addEventListener('click', () => {
    const parts = currentDate.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed

    const sundays = [];
    const d = new Date(year, month, 1);
    while (d.getMonth() === month) {
      if (d.getDay() === 0) {
        sundays.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }

    const monthLabel = marathiMonths[month] + " " + year;
    const rangeLabel = `Monthly Attendance: ${monthLabel}`;

    const workbook = XLSX.utils.book_new();
    const formatMonthly = (roster) => roster.map(i => {
      const row = {
        "Sr. No.": i.sr,
        "Name": i.name,
        "Census No.": i.census || "-",
        "Mobile": i.mobile || "-"
      };
      
      let presentCount = 0;
      sundays.forEach(sun => {
        const key = getLocalYMD(sun);
        const dateLabel = fmtShort(sun);
        const weekData = attendanceData[key] || {};
        const isPresent = !!weekData[i.id];
        
        row[dateLabel] = isPresent ? "Present" : "Absent";
        if (isPresent) presentCount++;
      });

      row["Total Present"] = presentCount;
      row["Total Absent"] = sundays.length - presentCount;
      
      return row;
    });

    const male = allData.filter(i => i.category === 'पुरुष');
    const female = allData.filter(i => i.category === 'महिला');

    const buildSheet = (roster) => {
      const rows = formatMonthly(roster);
      const ws = XLSX.utils.json_to_sheet(rows, { origin: "A3" });
      XLSX.utils.sheet_add_aoa(ws, [[rangeLabel]], { origin: "A1" });
      return ws;
    };

    if(male.length > 0) XLSX.utils.book_append_sheet(workbook, buildSheet(male), "Male");
    if(female.length > 0) XLSX.utils.book_append_sheet(workbook, buildSheet(female), "Female");
    
    if(male.length === 0 && female.length === 0) {
        XLSX.utils.book_append_sheet(workbook, buildSheet([]), "Empty");
    }

    XLSX.writeFile(workbook, `Monthly_Attendance_${monthLabel.replace(' ', '_')}.xlsx`);
  });
}

// ==== Nav Tabs Logic ====
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    const tabId = btn.dataset.tab;
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) {
      targetTab.classList.add('active');
    }
  });
});

// ==== Member Management ====
function renderMembersTable() {
  membersTbody.innerHTML = '';
  rosterData.forEach(member => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${member.name}</td>
      <td>${member.census || '-'}</td>
      <td>${member.mobile || '-'}</td>
      <td>${member.category}</td>
      <td>
        <button class="action-btn btn-edit" data-id="${member.id}">संपादित</button>
        <button class="action-btn btn-delete" data-id="${member.id}">काढून टाका</button>
      </td>
    `;
    membersTbody.appendChild(row);
  });
}

memberForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = memberIdInput.value;
  const name = memberNameInput.value.trim();
  const census = memberCensusInput.value.trim();
  const mobile = memberMobileInput.value.trim();
  const category = memberCategoryInput.value;

  if (id) {
    // Edit existing
    const member = rosterData.find(m => m.id === id);
    if (member) {
      member.name = name;
      member.census = census;
      member.mobile = mobile;
      member.category = category;
    }
  } else {
    // Add new
    rosterData.push({
      id: 'm_' + Date.now().toString(36),
      name,
      census,
      mobile,
      category
    });
  }
  
  saveRoster();
  memberForm.reset();
  memberIdInput.value = '';
  btnCancelEdit.style.display = 'none';
  
  renderMembersTable();
  prepareCurrentViewData();
  applyFilters();
});

btnCancelEdit.addEventListener('click', () => {
  memberForm.reset();
  memberIdInput.value = '';
  btnCancelEdit.style.display = 'none';
});

membersTbody.addEventListener('click', (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains('btn-delete')) {
    if (confirm('तुम्हाला खात्री आहे की तुम्हाला हा सदस्य काढून टाकायचा आहे?')) {
      rosterData = rosterData.filter(m => m.id !== id);
      saveRoster();
      renderMembersTable();
      prepareCurrentViewData();
      applyFilters();
    }
  } else if (e.target.classList.contains('btn-edit')) {
    const member = rosterData.find(m => m.id === id);
    if (member) {
      memberIdInput.value = member.id;
      memberNameInput.value = member.name;
      memberCensusInput.value = member.census;
      memberMobileInput.value = member.mobile;
      memberCategoryInput.value = member.category;
      btnCancelEdit.style.display = 'inline-block';
      memberForm.scrollIntoView({ behavior: 'smooth' });
    }
  }
});


// ==== Init ====
initData();
prepareCurrentViewData();
renderToday();
applyFilters();
renderMembersTable();
stampUpdate();

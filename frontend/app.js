const API = "http://localhost:8000/api";

const STATUS_LABEL = { todo: "할 일", in_progress: "진행 중", done: "완료" };
const STATUS_STYLE = {
  todo:        { badge: "bg-slate-100 text-slate-500",    dot: "bg-slate-400" },
  in_progress: { badge: "bg-amber-50 text-amber-600",     dot: "bg-amber-400" },
  done:        { badge: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-400" },
};
const NEXT_STATUS = { todo: "in_progress", in_progress: "done", done: "todo" };

const PRIORITY_STYLE = {
  high:   { label: "높음", dot: "🔴", badge: "bg-red-50 text-red-500" },
  medium: { label: "보통", dot: "🟡", badge: "bg-yellow-50 text-yellow-600" },
  low:    { label: "낮음", dot: "🟢", badge: "bg-green-50 text-green-600" },
};

let allTasks = [];
let currentFilter = "all";

function formatDate(d) {
  if (!d) return null;
  return d.slice(0, 10).replace(/-/g, ".");
}

function isOverdue(task) {
  if (!task.due_date || task.status === "done") return false;
  return new Date(task.due_date) < new Date(new Date().toDateString());
}

// ── 데이터 fetch ───────────────────────────────────────────
async function fetchTasks() {
  const res = await fetch(`${API}/tasks`);
  allTasks = await res.json();
  renderStats(allTasks);
  applyFilter();
}

// ── 통계 바 ────────────────────────────────────────────────
function renderStats(tasks) {
  const c = { todo: 0, in_progress: 0, done: 0 };
  tasks.forEach(t => c[t.status]++);
  document.getElementById("statsBar").innerHTML = [
    { key: "todo",        label: "할 일",   cls: "bg-slate-100 text-slate-600" },
    { key: "in_progress", label: "진행 중", cls: "bg-amber-50 text-amber-700" },
    { key: "done",        label: "완료",    cls: "bg-emerald-50 text-emerald-700" },
  ].map(s => `
    <div class="flex items-center gap-1.5 ${s.cls} rounded-xl px-3 py-1.5 text-xs font-medium">
      <span>${s.label}</span><span class="font-bold">${c[s.key]}</span>
    </div>`).join("");
}

// ── 필터 + 검색 ────────────────────────────────────────────
function setFilter(status) {
  currentFilter = status;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(`filter-${status}`).classList.add("active");
  applyFilter();
}

function applyFilter() {
  const keyword = document.getElementById("searchInput").value.trim().toLowerCase();
  const hideDone = document.getElementById("hideDone").checked;

  let tasks = allTasks.filter(t => {
    if (hideDone && t.status === "done") return false;
    if (currentFilter !== "all" && t.status !== currentFilter) return false;
    if (keyword && !t.title.toLowerCase().includes(keyword) && !(t.memo || "").toLowerCase().includes(keyword)) return false;
    return true;
  });
  renderTasks(tasks);
}

// ── 렌더링 ─────────────────────────────────────────────────
function renderTasks(tasks) {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  if (tasks.length === 0) {
    list.innerHTML = `<li class="text-center py-14 text-gray-300">
      <div class="text-5xl mb-3">📋</div>
      <div class="text-sm">표시할 업무가 없습니다</div>
    </li>`;
    return;
  }

  tasks.forEach(task => {
    const ss = STATUS_STYLE[task.status];
    const ps = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium;
    const overdue = isOverdue(task);
    const isDone = task.status === "done";
    const sd = formatDate(task.start_date);
    const dd = formatDate(task.due_date);

    const li = document.createElement("li");
    li.className = "task-card bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4";
    li.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-2.5 flex-1 min-w-0">
          <span class="mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${ss.dot}"></span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800 leading-snug ${isDone ? 'line-through text-gray-300' : ''}">${task.title}</p>
            ${task.memo ? `<p class="text-xs text-gray-400 mt-1 leading-relaxed">${task.memo}</p>` : ""}
          </div>
        </div>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <span class="text-xs px-2 py-0.5 rounded-full ${ps.badge}">${ps.dot} ${ps.label}</span>
          <button onclick="changeStatus(${task.id}, '${task.status}')"
            class="text-xs font-semibold px-3 py-1 rounded-full ${ss.badge} transition hover:opacity-70">
            ${STATUS_LABEL[task.status]}
          </button>
          <button onclick="deleteTask(${task.id})"
            class="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400 transition text-xl leading-none">
            ×
          </button>
        </div>
      </div>
      ${(sd || dd) ? `
      <div class="flex gap-4 mt-2.5 ml-4 text-xs text-gray-400">
        ${sd ? `<span>📅 시작 ${sd}</span>` : ""}
        ${dd ? `<span class="${overdue ? 'text-red-400 font-semibold' : ''}">⏰ 마감 ${dd}${overdue ? " · 초과" : ""}</span>` : ""}
      </div>` : ""}
    `;
    list.appendChild(li);
  });
}

// ── 업무 추가 ──────────────────────────────────────────────
async function addTask() {
  const title = document.getElementById("taskInput").value.trim();
  if (!title) return;

  await fetch(`${API}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      memo:       document.getElementById("memoInput").value.trim() || null,
      priority:   document.getElementById("priorityInput").value,
      start_date: document.getElementById("startDateInput").value || null,
      due_date:   document.getElementById("dueDateInput").value || null,
    }),
  });

  ["taskInput", "memoInput", "startDateInput", "dueDateInput"].forEach(id => {
    document.getElementById(id).value = "";
  });
  document.getElementById("priorityInput").value = "medium";
  fetchTasks();
}

// ── 상태 변경 ──────────────────────────────────────────────
async function changeStatus(taskId, currentStatus) {
  await fetch(`${API}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: NEXT_STATUS[currentStatus] }),
  });
  fetchTasks();
}

// ── 삭제 ───────────────────────────────────────────────────
async function deleteTask(taskId) {
  await fetch(`${API}/tasks/${taskId}`, { method: "DELETE" });
  fetchTasks();
}

// ── JSON 내보내기 ───────────────────────────────────────────
function exportTasks() {
  const exportData = allTasks.map(({ title, memo, priority, status, start_date, due_date }) => ({
    title, memo, priority, status, start_date, due_date,
  }));
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `taskflow_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── JSON 불러오기 ───────────────────────────────────────────
async function importTasks(event) {
  const file = event.target.files[0];
  if (!file) return;

  const text = await file.text();
  let tasks;
  try {
    tasks = JSON.parse(text);
  } catch {
    alert("올바른 JSON 파일이 아닙니다.");
    return;
  }

  await fetch(`${API}/tasks/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tasks),
  });

  event.target.value = "";
  fetchTasks();
}

// ── 초기화 ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("taskInput").addEventListener("keydown", e => {
    if (e.key === "Enter") addTask();
  });
  fetchTasks();
});

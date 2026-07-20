document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('taskDate').value = new Date().toISOString().split('T')[0];
    loadTasks();
});

let tasks = [];
let sortMode = 'proximity';

function loadTasks() {
    const saved = localStorage.getItem('tasks');
    if (saved) {
        try {
            tasks = JSON.parse(saved);
        } catch (e) {
            tasks = [];
        }
    }
    render();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function showStatus(text) {
    let el = document.getElementById('status');
    if (el) {
        el.textContent = text;
        el.style.display = 'block';
        setTimeout(function() { el.style.display = 'none'; }, 2000);
    }
}

function addTask() {
    let text = document.getElementById('taskText').value.trim();
    let date = document.getElementById('taskDate').value;
    let priority = document.getElementById('taskPriority').value;

    if (text === '') { showStatus('Введите текст задачи'); return; }

    let newId = 1;
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id >= newId) newId = tasks[i].id + 1;
    }

    tasks.push({
        id: newId,
        text: text,
        date: date,
        priority: priority,
        done: false
    });
    saveTasks();
    render();
    document.getElementById('taskText').value = '';
    showStatus('Задача добавлена');
}

function toggleDone(id) {
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === id) {
            tasks[i].done = !tasks[i].done;
            break;
        }
    }
    saveTasks();
    render();
}

function deleteTask(id) {
    tasks = tasks.filter(function(t) { return t.id !== id; });
    saveTasks();
    render();
    showStatus('Задача удалена');
}

function deleteSelected() {
    let checks = document.querySelectorAll('.chk:checked');
    if (checks.length === 0) { showStatus('Ничего не выделено'); return; }
    let ids = [];
    for (let i = 0; i < checks.length; i++) {
        ids.push(parseInt(checks[i].dataset.id));
    }
    tasks = tasks.filter(function(t) { return ids.indexOf(t.id) === -1; });
    saveTasks();
    render();
    showStatus('Удалено задач: ' + ids.length);
}

function moveTask(id, dir) {
    let idx = -1;
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === id) { idx = i; break; }
    }
    let newIdx = idx + dir;
    if (newIdx >= 0 && newIdx < tasks.length) {
        let tmp = tasks[idx];
        tasks[idx] = tasks[newIdx];
        tasks[newIdx] = tmp;
        saveTasks();
        render();
    }
}

function sortByProximity() {
    sortMode = 'proximity';
    render();
    showStatus('Сортировка: ближайшие задачи');
}

function sortByDateAsc() {
    sortMode = 'date_asc';
    render();
    showStatus('Сортировка: по дате (сначала старые)');
}

function sortByDateDesc() {
    sortMode = 'date_desc';
    render();
    showStatus('Сортировка: по дате (сначала новые)');
}

function clearDateFilter() {
    document.getElementById('filterDate').value = '';
    render();
    showStatus('Фильтр по дате сброшен');
}

function escapeHtml(text) {
    let div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function daysDifference(date1, date2) {
    if (!date1 || !date2) return 9999;
    let d1 = new Date(date1);
    let d2 = new Date(date2);
    let diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function render() {
    let list = document.getElementById('taskList');
    let filterPriority = document.getElementById('filterPriority').value;
    let filterDate = document.getElementById('filterDate').value;
    list.innerHTML = '';

    let filtered = tasks.filter(function(t) {
        let matchPriority = (filterPriority === 'all' || t.priority === filterPriority);
        let matchDate = (!filterDate || t.date === filterDate);
        return matchPriority && matchDate;
    });

    let today = new Date().toISOString().split('T')[0];

    if (sortMode === 'proximity') {
        filtered.sort(function(a, b) {
            let diffA = daysDifference(a.date, today);
            let diffB = daysDifference(b.date, today);
            return diffA - diffB;
        });
    } else if (sortMode === 'date_asc') {
        filtered.sort(function(a, b) {
            let da = a.date || '9999-12-31';
            let db = b.date || '9999-12-31';
            return da.localeCompare(db);
        });
    } else if (sortMode === 'date_desc') {
        filtered.sort(function(a, b) {
            let da = a.date || '9999-12-31';
            let db = b.date || '9999-12-31';
            return db.localeCompare(da);
        });
    }

    if (filtered.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#888;">Задач нет.</p>';
        return;
    }

    for (let i = 0; i < filtered.length; i++) {
        let t = filtered[i];
        let div = document.createElement('div');
        div.className = 'task priority-' + t.priority + (t.done ? ' done' : '');

        let dateStr = 'нет даты';
        let daysLeft = '';
        if (t.date) {
            let parts = t.date.split('-');
            dateStr = parts[2] + '.' + parts[1] + '.' + parts[0];

            let diff = daysDifference(t.date, today);
            let taskDate = new Date(t.date);
            let todayDate = new Date(today);

            if (taskDate < todayDate) {
                daysLeft = ' (просрочено на ' + diff + ' дн.)';
            } else if (diff === 0) {
                daysLeft = ' (сегодня!)';
            } else if (diff === 1) {
                daysLeft = ' (завтра)';
            } else {
                daysLeft = ' (через ' + diff + ' дн.)';
            }
        }

        let prioStr = {high: 'Высокий', medium: 'Средний', low: 'Низкий'}[t.priority];

        div.innerHTML =
            '<div class="task-head">' +
                '<input type="checkbox" class="chk" data-id="' + t.id + '">' +
                '<input type="checkbox" class="done-chk" data-id="' + t.id + '" ' +
                    (t.done ? 'checked' : '') + ' onchange="toggleDone(' + t.id + ')">' +
                '<span class="task-text">' + escapeHtml(t.text) + '</span>' +
            '</div>' +
            '<div class="task-meta">Дата: ' + dateStr + daysLeft + ' | Приоритет: ' + prioStr + '</div>' +
            '<div class="task-actions">' +
                '<button onclick="moveTask(' + t.id + ', -1)">Вверх</button>' +
                '<button onclick="moveTask(' + t.id + ', 1)">Вниз</button>' +
                '<button class="danger" onclick="deleteTask(' + t.id + ')">Удалить</button>' +
            '</div>';

        list.appendChild(div);
    }
}

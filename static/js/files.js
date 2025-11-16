let selectedFiles = new Set();
let allFiles = [];

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

const loadFilesBtn = document.getElementById('load-files-btn');
const genreSelect = document.getElementById('files-genre-select');
const filesListContainer = document.getElementById('files-list-container');
const filesList = document.getElementById('files-list');
const filesHeader = document.getElementById('files-header');
const selectAllCheckbox = document.getElementById('select-all-files');
const selectedCountSpan = document.getElementById('selected-files-count');
const downloadSelectedBtn = document.getElementById('download-selected-btn');
const deleteSelectedBtn = document.getElementById('delete-selected-btn');
const statusDiv = document.getElementById('files-status');

if (loadFilesBtn) {
    loadFilesBtn.addEventListener('click', loadFiles);
}

if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.file-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = this.checked;
            const filePath = cb.getAttribute('data-file');
            if (this.checked) {
                selectedFiles.add(filePath);
            } else {
                selectedFiles.delete(filePath);
            }
        });
        updateSelectedCount();
        updateActionButtons();
    });
}

if (downloadSelectedBtn) {
    downloadSelectedBtn.addEventListener('click', downloadSelectedFiles);
    downloadSelectedBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    downloadSelectedBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
}

if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener('click', deleteSelectedFiles);
    deleteSelectedBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    deleteSelectedBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
}

function loadFiles() {
    const genre = genreSelect.value;
    const url = genre ? `/files?genre=${encodeURIComponent(genre)}` : '/files';
    
    statusDiv.innerHTML = '<div style="padding: 12px 16px; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);">Загрузка файлов...</div>';
    
    fetch('/files-api' + (genre ? `?genre=${encodeURIComponent(genre)}` : ''))
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Получены данные:', data);
            allFiles = data.files || [];
            selectedFiles.clear();
            if (data.error) {
                console.error('Ошибка API:', data.error);
                statusDiv.innerHTML = `<div style="padding: 12px 16px; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);">Ошибка: ${data.error}</div>`;
            } else {
                displayFiles();
                if (allFiles.length === 0) {
                    statusDiv.innerHTML = '<div style="padding: 12px 16px; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(255, 152, 0, 0.3);">Файлы не найдены</div>';
                } else {
                    statusDiv.innerHTML = '';
                }
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки файлов:', error);
            statusDiv.innerHTML = `<div style="padding: 12px 16px; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);">Ошибка загрузки файлов: ${error.message}</div>`;
        });
}

function displayFiles() {
    if (allFiles.length === 0) {
        filesList.innerHTML = '<p style="text-align: center; padding: 20px; color: #546e7a; font-style: italic;">Файлы не найдены</p>';
        filesListContainer.style.display = 'block';
        filesHeader.style.display = 'none';
        downloadSelectedBtn.style.display = 'none';
        deleteSelectedBtn.style.display = 'none';
        return;
    }
    
    filesList.innerHTML = allFiles.map((file, index) => {
        const displayName = file.title || file.artist || file.path.split('/').pop() || `Файл ${index + 1}`;
        const fileInfo = [];
        if (file.artist) fileInfo.push(`Исполнитель: ${escapeHtml(file.artist)}`);
        if (file.album) fileInfo.push(`Альбом: ${escapeHtml(file.album)}`);
        if (file.genre) fileInfo.push(`Жанр: ${escapeHtml(file.genre)}`);
        if (file.year) fileInfo.push(`Год: ${escapeHtml(file.year)}`);
        
        return `
            <div class="file-item-row" style="display: flex; align-items: center; gap: 15px; padding: 12px 16px; background: rgba(255, 255, 255, 0.7); border-radius: 6px; border: 2px solid #e3f2fd;">
                <input type="checkbox" class="file-checkbox" data-file="${escapeHtml(file.path)}" style="width: 20px; height: 20px; cursor: pointer;">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: #1565c0; font-size: 15px; margin-bottom: 5px;">${escapeHtml(displayName)}</div>
                    ${fileInfo.length > 0 ? `<div style="color: #546e7a; font-size: 13px; line-height: 1.4;">${fileInfo.join('<br>')}</div>` : ''}
                    <div style="color: #78909c; font-size: 12px; margin-top: 5px; word-break: break-all;">${escapeHtml(file.path)}</div>
                </div>
                <button type="button" class="download-single-btn" data-file="${escapeHtml(file.path)}" style="padding: 8px 16px; background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3); transition: transform 0.2s;">Скачать</button>
            </div>
        `;
    }).join('');
    
    filesListContainer.style.display = 'block';
    filesHeader.style.display = 'block';
    
    document.querySelectorAll('.file-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const filePath = this.getAttribute('data-file');
            if (this.checked) {
                selectedFiles.add(filePath);
            } else {
                selectedFiles.delete(filePath);
            }
            updateSelectedCount();
            updateActionButtons();
            selectAllCheckbox.checked = selectedFiles.size === allFiles.length;
        });
    });
    
    document.querySelectorAll('.download-single-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filePath = this.getAttribute('data-file');
            window.location.href = `/download-file?file_path=${encodeURIComponent(filePath)}`;
        });
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    updateSelectedCount();
    updateActionButtons();
}

function updateSelectedCount() {
    selectedCountSpan.textContent = `Выбрано: ${selectedFiles.size}`;
}

function updateActionButtons() {
    if (selectedFiles.size > 0) {
        downloadSelectedBtn.style.display = 'inline-block';
        deleteSelectedBtn.style.display = 'inline-block';
    } else {
        downloadSelectedBtn.style.display = 'none';
        deleteSelectedBtn.style.display = 'none';
    }
}

function downloadSelectedFiles() {
    if (selectedFiles.size === 0) {
        alert('Выберите файлы для скачивания');
        return;
    }
    
    if (selectedFiles.size === 1) {
        const filePath = Array.from(selectedFiles)[0];
        window.location.href = `/download-file?file_path=${encodeURIComponent(filePath)}`;
        return;
    }
    
    statusDiv.innerHTML = '<div style="padding: 12px 16px; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);">Создание архива...</div>';
    
    const formData = new FormData();
    formData.append('files', JSON.stringify(Array.from(selectedFiles)));
    
    fetch('/download-files', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            return response.blob();
        }
        throw new Error('Ошибка создания архива');
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'acoverflow_files.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        statusDiv.innerHTML = '<div style="padding: 12px 16px; background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);">Файлы успешно скачаны</div>';
    })
    .catch(error => {
        console.error('Ошибка скачивания:', error);
        statusDiv.innerHTML = '<div style="padding: 12px 16px; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);">Ошибка скачивания файлов</div>';
    });
}

function deleteSelectedFiles() {
    if (selectedFiles.size === 0) {
        alert('Выберите файлы для удаления');
        return;
    }
    
    const count = selectedFiles.size;
    if (!confirm(`Вы уверены, что хотите удалить ${count} файл(ов)?\n\nЭто действие необратимо!`)) {
        return;
    }
    
    statusDiv.innerHTML = '<div style="padding: 12px 16px; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);">Удаление файлов...</div>';
    
    const formData = new FormData();
    formData.append('files', JSON.stringify(Array.from(selectedFiles)));
    
    fetch('/delete-files', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const deletedCount = data.deleted_count || 0;
            const errorsCount = data.errors_count || 0;
            let message = `Удалено файлов: ${deletedCount}`;
            if (errorsCount > 0) {
                message += `, ошибок: ${errorsCount}`;
            }
            
            statusDiv.innerHTML = `<div style="padding: 12px 16px; background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);">${message}</div>`;
            
            selectedFiles.clear();
            loadFiles();
        } else {
            statusDiv.innerHTML = `<div style="padding: 12px 16px; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);">Ошибка: ${data.detail || 'Неизвестная ошибка'}</div>`;
        }
    })
    .catch(error => {
        console.error('Ошибка удаления:', error);
        statusDiv.innerHTML = '<div style="padding: 12px 16px; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);">Ошибка удаления файлов</div>';
    });
}


let selectedFiles = new Set();
let allFiles = [];

document.getElementById('load-files').addEventListener('click', loadFiles);
document.getElementById('select-all').addEventListener('change', toggleSelectAll);
document.getElementById('genre-filter').addEventListener('change', loadFiles);
document.getElementById('upload-form').addEventListener('submit', handleUpload);
document.getElementById('process-all-btn').addEventListener('click', handleProcessAll);
document.getElementById('process-selected-btn').addEventListener('click', handleProcessSelected);
document.getElementById('use-custom-cover').addEventListener('change', function() {
    const coverUpload = document.getElementById('custom-cover-upload');
    coverUpload.style.display = this.checked ? 'block' : 'none';
});

const showCreateGenreBtn = document.getElementById('show-create-genre-btn');
const createGenreForm = document.getElementById('create-genre-form');
const cancelCreateGenreBtn = document.getElementById('cancel-create-genre-btn');
const genreForm = document.getElementById('genre-form');
const addSubstyleBtn = document.getElementById('add-substyle-btn');

if (showCreateGenreBtn) {
    showCreateGenreBtn.addEventListener('click', function() {
        createGenreForm.style.display = createGenreForm.style.display === 'none' ? 'block' : 'none';
    });
}

if (cancelCreateGenreBtn) {
    cancelCreateGenreBtn.addEventListener('click', function() {
        createGenreForm.style.display = 'none';
        genreForm.reset();
        document.getElementById('substyles-container').innerHTML = '<div class="substyle-item" style="margin-bottom: 12px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;"><input type="text" placeholder="Название подстиля" class="substyle-name" style="flex: 1; min-width: 150px; padding: 10px; border: 2px solid #90caf9; border-radius: 6px; background: white; font-size: 14px;"><input type="text" placeholder="Описание" class="substyle-desc" style="flex: 2; min-width: 200px; padding: 10px; border: 2px solid #90caf9; border-radius: 6px; background: white; font-size: 14px;"><button type="button" class="remove-substyle-btn" style="padding: 10px 16px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 4px rgba(238, 90, 111, 0.3); transition: transform 0.2s;">Удалить</button></div>';
        document.getElementById('genre-status').innerHTML = '';
    });
}

if (addSubstyleBtn) {
    addSubstyleBtn.addEventListener('click', function() {
        const container = document.getElementById('substyles-container');
        const newItem = document.createElement('div');
        newItem.className = 'substyle-item';
        newItem.style.cssText = 'margin-bottom: 12px; display: flex; gap: 10px; align-items: center;';
        newItem.innerHTML = `
            <input type="text" placeholder="Название подстиля" class="substyle-name" style="flex: 1; min-width: 150px; padding: 10px; border: 2px solid #90caf9; border-radius: 6px; background: white; font-size: 14px;">
            <input type="text" placeholder="Описание" class="substyle-desc" style="flex: 2; min-width: 200px; padding: 10px; border: 2px solid #90caf9; border-radius: 6px; background: white; font-size: 14px;">
            <button type="button" class="remove-substyle-btn" style="padding: 10px 16px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 4px rgba(238, 90, 111, 0.3); transition: transform 0.2s;">Удалить</button>
        `;
        newItem.style.cssText = 'margin-bottom: 12px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;';
        container.appendChild(newItem);
        
        const removeBtn = newItem.querySelector('.remove-substyle-btn');
        removeBtn.addEventListener('click', function() {
            if (container.children.length > 1) {
                newItem.remove();
            }
        });
        removeBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        removeBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-substyle-btn')) {
        const container = document.getElementById('substyles-container');
        if (container.children.length > 1) {
            e.target.closest('.substyle-item').remove();
        }
    }
});

if (genreForm) {
    genreForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('genre-name').value.trim();
        const description = document.getElementById('genre-description').value.trim();
        const statusDiv = document.getElementById('genre-status');
        
        if (!name) {
            statusDiv.innerHTML = '<div style="padding: 12px 16px; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);">Название жанра обязательно</div>';
            return;
        }
        
        const substyleItems = document.querySelectorAll('.substyle-item');
        const substyles = {};
        
        substyleItems.forEach(item => {
            const nameInput = item.querySelector('.substyle-name');
            const descInput = item.querySelector('.substyle-desc');
            const substyleName = nameInput.value.trim();
            const substyleDesc = descInput.value.trim();
            
            if (substyleName) {
                substyles[substyleName] = substyleDesc || '';
            }
        });
        
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        
        if (Object.keys(substyles).length > 0) {
            formData.append('substyles', JSON.stringify(substyles));
        }
        
        statusDiv.innerHTML = '<div style="padding: 12px 16px; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);">Создание жанра...</div>';
        
        fetch('/create-genre', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                statusDiv.innerHTML = `<div style="padding: 12px 16px; background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);">${data.message}</div>`;
                
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                statusDiv.innerHTML = `<div style="padding: 12px 16px; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);">Ошибка: ${data.detail || data.message || 'Неизвестная ошибка'}</div>`;
            }
        })
        .catch(error => {
            console.error('Ошибка создания жанра:', error);
            statusDiv.innerHTML = '<div style="padding: 12px 16px; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);">Ошибка создания жанра</div>';
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const genresListToggle = document.getElementById('genres-list-toggle');
    const genresListContainer = document.getElementById('genres-list-container');
    const genresListArrow = document.getElementById('genres-list-arrow');
    
    if (genresListToggle && genresListContainer) {
        genresListToggle.addEventListener('click', function() {
            const isVisible = genresListContainer.style.display !== 'none';
            genresListContainer.style.display = isVisible ? 'none' : 'block';
            genresListArrow.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
        });
    }
    
    document.querySelectorAll('.delete-genre-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const genreName = this.getAttribute('data-genre');
            const statusDiv = document.getElementById('genre-delete-status');
            
            if (!confirm(`Вы уверены, что хотите удалить жанр "${genreName}"?\n\nЭто действие удалит:\n- Папку жанра со всеми файлами\n- Все промпты жанра\n- Запись о жанре из системы\n\nДействие необратимо!`)) {
                return;
            }
            
            statusDiv.innerHTML = '<div style="padding: 12px 16px; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);">Удаление жанра...</div>';
            
            try {
                const response = await fetch(`/delete-genre/${encodeURIComponent(genreName)}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    statusDiv.innerHTML = `<div style="padding: 12px 16px; background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);">${data.message}</div>`;
                    
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                } else {
                    statusDiv.innerHTML = `<div style="padding: 12px 16px; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);">Ошибка: ${data.detail || data.message || 'Неизвестная ошибка'}</div>`;
                }
            } catch (error) {
                console.error('Ошибка удаления жанра:', error);
                statusDiv.innerHTML = '<div style="padding: 12px 16px; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);">Ошибка удаления жанра</div>';
            }
        });
        
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
});

function loadFiles() {
    const genre = document.getElementById('genre-filter').value;
    const url = '/files-api' + (genre ? `?genre=${encodeURIComponent(genre)}` : '');
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            allFiles = data.files;
            displayFiles(allFiles);
            updateSelectedCount();
        })
        .catch(error => {
            console.error('Ошибка загрузки файлов:', error);
            showMessage('Ошибка загрузки файлов', 'error');
        });
}

function displayFiles(files) {
    const container = document.getElementById('files-list');
    
    if (files.length === 0) {
        container.innerHTML = '<p>Файлы не найдены</p>';
        return;
    }
    
    container.innerHTML = files.map((file, index) => {
        const coverImg = file.cover_data 
            ? `<img src="data:image/jpeg;base64,${file.cover_data}" class="cover-thumb" alt="Cover">`
            : '<div class="cover-thumb" style="display: flex; align-items: center; justify-content: center; color: #999; font-size: 12px;">Нет обложки</div>';
        
        const tagsHtml = buildTagsHtml(file);
        
        return `
            <div class="file-item" data-index="${index}">
                <input type="checkbox" class="file-checkbox" data-path="${file.path}" ${selectedFiles.has(file.path) ? 'checked' : ''}>
                ${coverImg}
                <div class="file-info">
                    <h4>${file.title || file.path}</h4>
                    <div class="file-tags">
                        ${tagsHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.file-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleFileSelection);
    });
}

function handleFileSelection(event) {
    const path = event.target.dataset.path;
    if (event.target.checked) {
        selectedFiles.add(path);
    } else {
        selectedFiles.delete(path);
    }
    updateSelectedCount();
}

function toggleSelectAll(event) {
    const checked = event.target.checked;
    document.querySelectorAll('.file-checkbox').forEach(checkbox => {
        checkbox.checked = checked;
        const path = checkbox.dataset.path;
        if (checked) {
            selectedFiles.add(path);
        } else {
            selectedFiles.delete(path);
        }
    });
    updateSelectedCount();
}

function updateSelectedCount() {
    const count = selectedFiles.size;
    document.getElementById('selected-count').textContent = `Выбрано: ${count}`;
    const processSelectedBtn = document.getElementById('process-selected-btn');
    processSelectedBtn.disabled = count === 0;
}

function buildTagsHtml(file) {
    const tags = [];
    
    if (file.title) tags.push({label: 'Title', value: file.title});
    if (file.artist) tags.push({label: 'Artist', value: file.artist});
    if (file.album) tags.push({label: 'Album', value: file.album});
    if (file.genre) tags.push({label: 'Genre', value: file.genre});
    if (file.year) tags.push({label: 'Year', value: file.year});
    if (file.original_artist) tags.push({label: 'Original Artist', value: file.original_artist});
    if (file.copyright) tags.push({label: 'Copyright', value: file.copyright});
    if (file.encoder) tags.push({label: 'Encoder', value: file.encoder});
    if (file.comment) {
        const shortComment = file.comment.length > 50 ? file.comment.substring(0, 50) + '...' : file.comment;
        tags.push({label: 'Comment', value: shortComment});
    }
    if (file.lyrics) {
        const shortLyrics = file.lyrics.length > 50 ? file.lyrics.substring(0, 50) + '...' : file.lyrics;
        tags.push({label: 'Lyrics', value: shortLyrics});
    }
    
    if (tags.length === 0) {
        return '<span class="no-tags">Теги отсутствуют</span>';
    }
    
    return tags.map(tag => 
        `<span class="tag-item"><span class="tag-label">${tag.label}:</span> <span class="tag-value">${escapeHtml(tag.value)}</span></span>`
    ).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function handleUpload(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('file-input');
    const genreSelect = document.getElementById('upload-genre');
    const statusDiv = document.getElementById('upload-status');
    const progressDiv = document.getElementById('upload-progress');
    const uploadBtn = document.getElementById('upload-btn');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        showUploadStatus('Выберите файл(ы)', 'error');
        return;
    }
    
    if (!genreSelect.value) {
        showUploadStatus('Выберите жанр', 'error');
        return;
    }
    
    const files = Array.from(fileInput.files);
    const isMultiple = files.length > 1;
    const useCustomCover = document.getElementById('use-custom-cover').checked;
    const coverFile = useCustomCover ? document.getElementById('cover-input').files[0] : null;
    const imageFormat = document.getElementById('cover-format') ? document.getElementById('cover-format').value : 'jpeg';
    
    uploadBtn.disabled = true;
    progressDiv.innerHTML = '';
    
    if (isMultiple) {
        // Обработка нескольких файлов
        handleMultipleUpload(files, genreSelect.value, useCustomCover, coverFile, imageFormat, statusDiv, progressDiv, uploadBtn, fileInput, genreSelect);
    } else {
        // Обработка одного файла (старый способ)
        handleSingleUpload(files[0], genreSelect.value, useCustomCover, coverFile, imageFormat, statusDiv, uploadBtn, fileInput, genreSelect);
    }
}

function handleSingleUpload(file, genre, useCustomCover, coverFile, imageFormat, statusDiv, uploadBtn, fileInput, genreSelect) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('genre', genre);
    formData.append('use_custom_cover', useCustomCover ? 'true' : 'false');
    formData.append('image_format', imageFormat);
    
    if (useCustomCover && coverFile) {
        formData.append('cover', coverFile);
    }
    
    showUploadStatus('Загрузка и обработка файла...', 'progress');
    
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showUploadStatus(`Файл "${data.filename}" успешно загружен и обработан!`, 'success');
            fileInput.value = '';
            genreSelect.value = '';
            document.getElementById('use-custom-cover').checked = false;
            document.getElementById('custom-cover-upload').style.display = 'none';
            document.getElementById('cover-input').value = '';
            setTimeout(() => {
                loadFiles();
                showUploadStatus('', '');
            }, 2000);
        } else {
            showUploadStatus('Ошибка: ' + (data.message || 'Неизвестная ошибка'), 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки:', error);
        showUploadStatus('Ошибка загрузки файла', 'error');
    })
    .finally(() => {
        uploadBtn.disabled = false;
    });
}

async function handleMultipleUpload(files, genre, useCustomCover, coverFile, imageFormat, statusDiv, progressDiv, uploadBtn, fileInput, genreSelect) {
    showUploadStatus(`Загрузка и обработка ${files.length} файлов...`, 'progress');
    
    // Показываем список файлов для обработки
    progressDiv.innerHTML = '<div class="progress-list">' + 
        files.map((file, idx) => 
            `<div class="progress-item" id="progress-${idx}">
                <span class="progress-filename">${escapeHtml(file.name)}</span>
                <span class="progress-status">Ожидание...</span>
            </div>`
        ).join('') + 
        '</div>';
    
    let processed = 0;
    let errors = [];
    
    // Обрабатываем файлы последовательно
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progressItem = document.getElementById(`progress-${i}`);
        const statusSpan = progressItem.querySelector('.progress-status');
        
        statusSpan.textContent = 'Обработка...';
        statusSpan.className = 'progress-status';
        progressItem.classList.remove('completed', 'error');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('genre', genre);
            formData.append('use_custom_cover', useCustomCover ? 'true' : 'false');
            formData.append('image_format', imageFormat);
            
            if (useCustomCover && coverFile) {
                formData.append('cover', coverFile);
            }
            
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                statusSpan.textContent = '✓ Обработан';
                statusSpan.className = 'progress-status success';
                progressItem.classList.add('completed');
                processed++;
                
                // Обновляем список файлов после каждого обработанного файла
                setTimeout(() => {
                    loadFiles();
                }, 500);
            } else {
                statusSpan.textContent = '✗ Ошибка';
                statusSpan.className = 'progress-status error';
                progressItem.classList.add('error');
                errors.push(`${file.name}: ${data.message || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error(`Ошибка обработки файла ${file.name}:`, error);
            statusSpan.textContent = '✗ Ошибка';
            statusSpan.className = 'progress-status error';
            progressItem.classList.add('error');
            errors.push(`${file.name}: Ошибка загрузки`);
        }
    }
    
    // Показываем итоговый статус
    if (errors.length > 0) {
        showUploadStatus(`Обработано файлов: ${processed} из ${files.length}. Ошибок: ${errors.length}`, 'error');
    } else {
        showUploadStatus(`Все файлы успешно обработаны: ${processed} из ${files.length}`, 'success');
    }
    
            // Очищаем форму через 3 секунды
            setTimeout(() => {
                fileInput.value = '';
                genreSelect.value = '';
                document.getElementById('use-custom-cover').checked = false;
                document.getElementById('custom-cover-upload').style.display = 'none';
                document.getElementById('cover-input').value = '';
                progressDiv.innerHTML = '';
                showUploadStatus('', '');
            }, 3000);
    
    uploadBtn.disabled = false;
}

function showUploadStatus(message, type) {
    const statusDiv = document.getElementById('upload-status');
    statusDiv.textContent = message;
    statusDiv.className = `upload-status ${type}`;
    if (!message) {
        statusDiv.style.display = 'none';
    }
}

function showMessage(text, type) {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    document.querySelector('main').insertBefore(message, document.querySelector('main').firstChild);
    setTimeout(() => message.remove(), 3000);
}

function handleProcessAll() {
    const processBtn = document.getElementById('process-all-btn');
    const statusDiv = document.getElementById('process-status');
    
    processBtn.disabled = true;
    showProcessStatus('Обработка файлов... Это может занять некоторое время.', 'progress');
    
    fetch('/process-all', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            let message = `Обработано файлов: ${data.processed}`;
            if (data.errors && data.errors.length > 0) {
                message += `\nОшибок: ${data.errors.length}`;
                console.error('Ошибки обработки:', data.errors);
            }
            showProcessStatus(message, 'success');
            
            // Обновляем список файлов после обработки
            setTimeout(() => {
                loadFiles();
                showProcessStatus('', '');
            }, 2000);
        } else {
            showProcessStatus('Ошибка: ' + (data.message || 'Неизвестная ошибка'), 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка обработки:', error);
        showProcessStatus('Ошибка при обработке файлов', 'error');
    })
    .finally(() => {
        processBtn.disabled = false;
    });
}

function showProcessStatus(message, type) {
    const statusDiv = document.getElementById('process-status');
    statusDiv.textContent = message;
    statusDiv.className = `process-status ${type}`;
    if (!message) {
        statusDiv.style.display = 'none';
    } else {
        statusDiv.style.display = 'block';
    }
}

function handleProcessSelected() {
    if (selectedFiles.size === 0) {
        showMessage('Выберите файлы для обработки', 'error');
        return;
    }
    
    const processBtn = document.getElementById('process-selected-btn');
    const fileList = Array.from(selectedFiles);
    
    processBtn.disabled = true;
    showMessage(`Обработка ${fileList.length} выбранных файлов...`, 'progress');
    
    const formData = new FormData();
    formData.append('files', JSON.stringify(fileList));
    
    fetch('/process-selected', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            let message = `Обработано файлов: ${data.processed}`;
            if (data.errors && data.errors.length > 0) {
                message += `\nОшибок: ${data.errors.length}`;
                console.error('Ошибки обработки:', data.errors);
            }
            showMessage(message, 'success');
            
            // Обновляем список файлов после обработки
            setTimeout(() => {
                loadFiles();
                selectedFiles.clear();
                updateSelectedCount();
            }, 2000);
        } else {
            showMessage('Ошибка: ' + (data.message || 'Неизвестная ошибка'), 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка обработки:', error);
        showMessage('Ошибка при обработке выбранных файлов', 'error');
    })
    .finally(() => {
        processBtn.disabled = false;
    });
}

// Управление промптами
let currentPrompts = [];
let originalPrompts = [];

// Загрузка промптов при выборе жанра
const promptGenreSelect = document.getElementById('prompt-genre-select');
if (promptGenreSelect) {
    promptGenreSelect.addEventListener('change', async function() {
        const genre = this.value;
        const editor = document.getElementById('prompts-editor');
        const promptsList = document.getElementById('prompts-list');
        
        if (!genre) {
            editor.style.display = 'none';
            return;
        }
        
        editor.style.display = 'block';
        promptsList.innerHTML = '<p style="text-align: center; padding: 20px; color: #546e7a;">Загрузка промптов...</p>';
        
        try {
            const response = await fetch(`/prompts/${encodeURIComponent(genre)}`);
            const data = await response.json();
            
            const prompts = data.prompts || [];
            currentPrompts = [...prompts];
            originalPrompts = [...prompts];
            
            renderPrompts();
        } catch (error) {
            console.error('Ошибка загрузки промптов:', error);
            promptsList.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Ошибка загрузки промптов</p>';
        }
    });
}

function renderPrompts() {
    const promptsList = document.getElementById('prompts-list');
    
    if (currentPrompts.length === 0) {
        promptsList.innerHTML = '<p style="text-align: center; padding: 20px; color: #546e7a; font-style: italic;">Промпты отсутствуют. Добавьте первый промпт.</p>';
        return;
    }
    
    promptsList.innerHTML = currentPrompts.map((prompt, index) => `
        <div class="prompt-item" data-index="${index}" style="padding: 15px; background: rgba(255, 255, 255, 0.7); border-radius: 8px; border: 2px solid #e3f2fd; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <label style="font-weight: 600; color: #1565c0; font-size: 14px;">Промпт ${index + 1}:</label>
                <button type="button" class="remove-prompt-btn" data-index="${index}" style="padding: 6px 12px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; box-shadow: 0 2px 4px rgba(238, 90, 111, 0.3); transition: transform 0.2s;">Удалить</button>
            </div>
            <textarea class="prompt-textarea" data-index="${index}" style="width: 100%; padding: 12px; border: 2px solid #90caf9; border-radius: 6px; background: white; font-size: 13px; min-height: 100px; font-family: monospace; resize: vertical; box-sizing: border-box;">${escapeHtml(prompt)}</textarea>
        </div>
    `).join('');
    
    // Добавляем обработчики для удаления
    document.querySelectorAll('.remove-prompt-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            if (currentPrompts.length > 1) {
                currentPrompts.splice(index, 1);
                renderPrompts();
            } else {
                alert('Должен остаться хотя бы один промпт');
            }
        });
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Добавляем обработчики для изменения
    document.querySelectorAll('.prompt-textarea').forEach(textarea => {
        textarea.addEventListener('input', function() {
            const index = parseInt(this.getAttribute('data-index'));
            currentPrompts[index] = this.value;
        });
    });
}

// Добавление нового промпта
const addPromptBtn = document.getElementById('add-prompt-btn');
if (addPromptBtn) {
    addPromptBtn.addEventListener('click', function() {
        const defaultPrompt = `Create a square album cover (1024×1024) in the {genre} visual style.
Use the substyle: {substyle_desc}.
Reflect the mood and meaning of the music title: "{track_title}".
No text, letters, numbers or logos.
Abstract, atmospheric, soft lighting, high quality.`;
        currentPrompts.push(defaultPrompt);
        renderPrompts();
        
        // Прокручиваем к новому промпту
        setTimeout(() => {
            const lastItem = document.querySelectorAll('.prompt-item').item(currentPrompts.length - 1);
            if (lastItem) {
                lastItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                const textarea = lastItem.querySelector('.prompt-textarea');
                if (textarea) {
                    textarea.focus();
                }
            }
        }, 100);
    });
    addPromptBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    addPromptBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
}

// Сохранение промптов
const savePromptsBtn = document.getElementById('save-prompts-btn');
if (savePromptsBtn) {
    savePromptsBtn.addEventListener('click', async function() {
        const genre = document.getElementById('prompt-genre-select').value;
        if (!genre) {
            alert('Выберите жанр');
            return;
        }
        
        // Обновляем промпты из textarea
        document.querySelectorAll('.prompt-textarea').forEach(textarea => {
            const index = parseInt(textarea.getAttribute('data-index'));
            currentPrompts[index] = textarea.value.trim();
        });
        
        // Удаляем пустые промпты
        currentPrompts = currentPrompts.filter(p => p.trim().length > 0);
        
        if (currentPrompts.length === 0) {
            alert('Добавьте хотя бы один промпт');
            return;
        }
        
        const statusDiv = document.getElementById('prompts-status');
        statusDiv.innerHTML = '<div style="padding: 12px 16px; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);">Сохранение промптов...</div>';
        
        const formData = new FormData();
        formData.append('genre', genre);
        formData.append('prompts', JSON.stringify(currentPrompts));
        
        try {
            const response = await fetch('/save-prompts', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                originalPrompts = [...currentPrompts];
                statusDiv.innerHTML = `<div style="padding: 12px 16px; background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);">${data.message} (сохранено промптов: ${data.count})</div>`;
            } else {
                statusDiv.innerHTML = `<div style="padding: 12px 16px; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);">Ошибка: ${data.detail || data.message || 'Неизвестная ошибка'}</div>`;
            }
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            statusDiv.innerHTML = `<div style="padding: 12px 16px; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; border-radius: 8px; font-weight: 500; box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);">Ошибка сохранения промптов</div>`;
        }
    });
    savePromptsBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    savePromptsBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
}

// Сброс изменений
const resetPromptsBtn = document.getElementById('reset-prompts-btn');
if (resetPromptsBtn) {
    resetPromptsBtn.addEventListener('click', function() {
        if (confirm('Сбросить все изменения и вернуться к сохраненным промптам?')) {
            currentPrompts = [...originalPrompts];
            renderPrompts();
            document.getElementById('prompts-status').innerHTML = '';
        }
    });
    resetPromptsBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    resetPromptsBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
}


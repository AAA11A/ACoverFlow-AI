let selectedFiles = new Set();
let allFiles = [];

document.getElementById('load-files-btn').addEventListener('click', loadFiles);
document.getElementById('apply-changes-btn').addEventListener('click', applyChanges);
document.getElementById('select-all-files').addEventListener('change', toggleSelectAll);
document.getElementById('cover-upload').addEventListener('change', () => {
    if (document.getElementById('cover-upload').checked) {
        document.getElementById('cover-file').click();
    }
});
document.getElementById('cover-file').addEventListener('change', handleCoverPreview);

function loadFiles() {
    const genre = document.getElementById('genre-select').value;
    const url = genre ? `/files?genre=${encodeURIComponent(genre)}` : '/files';
    
    // Очищаем выбранные файлы при загрузке нового списка
    selectedFiles.clear();
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            allFiles = data.files;
            displayFiles(allFiles);
        })
        .catch(error => {
            console.error('Ошибка загрузки файлов:', error);
            showMessage('Ошибка загрузки файлов', 'error');
        });
}

function displayFiles(files) {
    const container = document.getElementById('selected-files-list');
    
    if (files.length === 0) {
        container.innerHTML = '<p>Файлы не найдены. Выберите файлы для редактирования.</p>';
        updateSelectedFilesDisplay();
        return;
    }
    
    const filesList = document.createElement('div');
    filesList.className = 'files-list';
    filesList.innerHTML = files.map(file => {
        const isSelected = selectedFiles.has(file.path);
        const coverImg = file.cover_data 
            ? `<img src="data:image/jpeg;base64,${file.cover_data}" class="cover-thumb" alt="Cover">`
            : '<div class="cover-thumb" style="display: flex; align-items: center; justify-content: center; color: #999; font-size: 12px;">Нет обложки</div>';
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        const tags = [];
        if (file.title) tags.push({label: 'Title', value: file.title});
        if (file.artist) tags.push({label: 'Artist', value: file.artist});
        if (file.album) tags.push({label: 'Album', value: file.album});
        if (file.genre) tags.push({label: 'Genre', value: file.genre});
        if (file.year) tags.push({label: 'Year', value: file.year});
        if (file.comment) tags.push({label: 'Comment', value: file.comment.length > 50 ? file.comment.substring(0, 50) + '...' : file.comment});
        if (file.lyrics) tags.push({label: 'Lyrics', value: file.lyrics.length > 50 ? file.lyrics.substring(0, 50) + '...' : file.lyrics});
        if (file.original_artist) tags.push({label: 'Original Artist', value: file.original_artist});
        if (file.copyright) tags.push({label: 'Copyright', value: file.copyright});
        if (file.encoder) tags.push({label: 'Encoder', value: file.encoder});
        
        const tagsHtml = tags.length > 0 
            ? tags.map(tag => `<div class="tag-item"><span class="tag-label">${tag.label}:</span><span class="tag-value">${escapeHtml(tag.value)}</span></div>`).join('')
            : '<div class="no-tags">Теги отсутствуют</div>';
        
        return `
            <div class="file-item">
                <input type="checkbox" class="file-checkbox" data-path="${file.path}" ${isSelected ? 'checked' : ''}>
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
    
    container.innerHTML = '';
    container.appendChild(filesList);
    
    document.querySelectorAll('.file-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleFileSelection);
    });
    
    updateSelectedFilesDisplay();
    updateSelectAllCheckbox();
}

function handleFileSelection(event) {
    const path = event.target.dataset.path;
    if (event.target.checked) {
        selectedFiles.add(path);
    } else {
        selectedFiles.delete(path);
    }
    updateSelectedFilesDisplay();
    updateSelectAllCheckbox();
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
    updateSelectedFilesDisplay();
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('select-all-files');
    const allCheckboxes = document.querySelectorAll('.file-checkbox');
    if (allCheckboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
        return;
    }
    
    const checkedCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
    if (checkedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === allCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

function updateSelectedFilesDisplay() {
    const selected = Array.from(selectedFiles);
    const summary = document.getElementById('selected-summary');
    const countSpan = document.getElementById('selected-count');
    
    if (selected.length === 0) {
        if (summary) summary.style.display = 'none';
        return;
    }
    
    if (summary) {
        summary.style.display = 'block';
        if (countSpan) countSpan.textContent = selected.length;
    }
}

function applyChanges(event) {
    if (event) {
        event.preventDefault();
    }
    
    if (selectedFiles.size === 0) {
        showMessage('Выберите файлы для редактирования', 'error');
        return;
    }
    
    const files = Array.from(selectedFiles);
    const promises = [];
    
    const form = document.getElementById('tags-form');
    const inputs = form.querySelectorAll('input[type="text"], textarea');
    const hasTagChanges = Array.from(inputs).some(input => {
        const value = input.value.trim();
        return value !== '';
    });
    
    if (hasTagChanges) {
        const formData = new FormData();
        formData.append('files', JSON.stringify(files));
        
        inputs.forEach(input => {
            const value = input.value.trim();
            formData.append(input.name, value);
        });
        
        promises.push(
            fetch('/edit', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.errors && data.errors.length > 0) {
                    return { type: 'tags', success: false, errors: data.errors };
                } else {
                    return { type: 'tags', success: true, updated: data.updated.length };
                }
            })
            .catch(error => {
                console.error('Ошибка сохранения тегов:', error);
                return { type: 'tags', success: false, error: 'Ошибка сохранения тегов' };
            })
        );
    }
    
    const coverAction = document.querySelector('input[name="cover-action"]:checked').value;
    
    if (coverAction !== 'none') {
        if (coverAction === 'delete') {
            promises.push(...deleteCovers(files));
        } else if (coverAction === 'upload') {
            const fileInput = document.getElementById('cover-file');
            if (!fileInput.files || fileInput.files.length === 0) {
                showMessage('Выберите файл обложки', 'error');
                return;
            }
            promises.push(...uploadCovers(files, fileInput.files[0]));
        } else if (coverAction === 'generate') {
            promises.push(...generateCovers(files));
        }
    }
    
    if (promises.length === 0) {
        showMessage('Нет изменений для применения', 'error');
        return;
    }
    
    Promise.all(promises)
        .then(results => {
            const tagResult = results.find(r => r && r.type === 'tags');
            const coverResults = results.filter(r => r && r.type !== 'tags');
            
            const messages = [];
            
            if (tagResult) {
                if (tagResult.success) {
                    messages.push(`Теги обновлены: ${tagResult.updated} файлов`);
                } else {
                    messages.push(`Ошибки тегов: ${tagResult.errors ? tagResult.errors.join(', ') : tagResult.error}`);
                }
            }
            
            if (coverResults.length > 0) {
                const successCount = coverResults.filter(r => r.success).length;
                if (successCount > 0) {
                    messages.push(`Обложки применены: ${successCount} файлов`);
                }
                const errorCount = coverResults.filter(r => !r.success).length;
                if (errorCount > 0) {
                    messages.push(`Ошибки обложек: ${errorCount}`);
                }
            }
            
            if (messages.length > 0) {
                const hasErrors = messages.some(m => m.includes('Ошибки'));
                showMessage(messages.join('; '), hasErrors ? 'error' : 'success');
            }
            
            if (tagResult && tagResult.success) {
                form.reset();
            }
            
            if (coverResults.some(r => r.success)) {
                loadFiles();
            }
        })
        .catch(error => {
            console.error('Ошибка применения изменений:', error);
            showMessage('Ошибка применения изменений', 'error');
        });
}

function deleteCovers(files) {
    return files.map(file => {
        const formData = new FormData();
        formData.append('file', file);
        return fetch('/delete-cover', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => ({ type: 'cover', success: data.success }))
        .catch(error => {
            console.error('Ошибка удаления:', error);
            return { type: 'cover', success: false };
        });
    });
}

function uploadCovers(files, coverFile) {
    const imageFormat = document.getElementById('editor-cover-format') ? document.getElementById('editor-cover-format').value : 'jpeg';
    return files.map(file => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('cover_file', coverFile);
        formData.append('image_format', imageFormat);
        return fetch('/upload-cover', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => ({ type: 'cover', success: data.success }))
        .catch(error => {
            console.error('Ошибка загрузки:', error);
            return { type: 'cover', success: false };
        });
    });
}

function generateCovers(files) {
    if (files.length === 0) return [];
    
    return files.map(filePath => {
        const file = allFiles.find(f => f.path === filePath);
        if (!file) {
            return Promise.resolve({ type: 'cover', success: false, error: 'Файл не найден' });
        }
        
        const trackTitle = file.title || filePath.split(/[/\\]/).pop().replace(/\.mp3$/i, '');
        const genre = file.genre || document.getElementById('genre-select').value || 'Ambient';
        
        const imageFormat = document.getElementById('editor-cover-format') ? document.getElementById('editor-cover-format').value : 'jpeg';
        const formData = new FormData();
        formData.append('file', filePath);
        formData.append('track_title', trackTitle);
        formData.append('genre', genre);
        formData.append('image_format', imageFormat);
        
        return fetch('/generate-cover', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => ({ type: 'cover', success: data.success }))
        .catch(error => {
            console.error('Ошибка генерации:', error);
            return { type: 'cover', success: false };
        });
    });
}

function handleCoverPreview(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('cover-preview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Cover preview">`;
        };
        reader.readAsDataURL(file);
    }
}

function showMessage(text, type) {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    const main = document.querySelector('main');
    main.insertBefore(message, main.firstChild);
    setTimeout(() => message.remove(), 5000);
}


// Управление промптами
let currentPrompts = [];
let originalPrompts = [];

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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


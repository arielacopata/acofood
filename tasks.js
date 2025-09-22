console.log('tasks.js loading...');

// ===== API FUNCTIONS =====
window.taskAPI = {
    getUserTasks: async function(userCode) {
        const { data, error } = await supabase
            .from('user_tasks')
			.select('*, task_types (*), custom_name') // ← agregar custom_name
            .select('*, task_types (*)')
            .eq('user_code', userCode)
            .eq('is_enabled', true);
        
        if (error) throw error;
        return data || [];
    },

    getAllTaskTypes: async function() {
        const { data, error } = await supabase
            .from('task_types')
            .select('*')
            .order('name');
        
        if (error) throw error;
        return data || [];
    },

updateUserTask: async function(userCode, taskTypeId, isEnabled, customName = null) {
    const { data, error } = await supabase
        .from('user_tasks')
        .upsert({
            user_code: userCode,
            task_type_id: taskTypeId,
            is_enabled: isEnabled,
            custom_name: customName
        }, { 
            onConflict: 'user_code,task_type_id'
        });
    
    if (error) throw error;
    return data;
},

    completeTask: async function(userCode, taskTypeId) {
        const { data, error } = await supabase
            .from('task_completions')
            .insert({
                user_code: userCode,
                task_type_id: taskTypeId
            });
        if (error) throw error;
        return data;
    },

    isTaskCompletedToday: async function(userCode, taskTypeId) {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('task_completions')
            .select('id')
            .eq('user_code', userCode)
            .eq('task_type_id', taskTypeId)
            .eq('date', today)
            .limit(1);
        if (error) throw error;
        return data.length > 0;
    }
};

// ===== UI FUNCTIONS =====
window.taskUI = {
renderTaskSettings: async function() {
    const container = document.getElementById('task-settings-container');
    if (!container) return;
    
    try {
        const allTasks = await window.taskAPI.getAllTaskTypes();
        const userTasks = await window.taskAPI.getUserTasks(userCode);
        
        const enabledTasks = new Set(userTasks.map(ut => ut.task_type_id));
        
        const tasksHTML = allTasks.map(task => `
            <div class="task-settings-item">
                <div class="task-info">
                    <span class="task-emoji">${task.emoji}</span>
                    <span>${task.name}</span>
                </div>
                <label class="task-toggle">
                    <input type="checkbox" 
                           data-task-id="${task.id}"
                           ${enabledTasks.has(task.id) ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `).join('');
        
        const existingText = container.querySelector('p');
        container.innerHTML = '';
        if (existingText) container.appendChild(existingText);
        container.innerHTML += tasksHTML;
        
        container.querySelectorAll('input[type="checkbox"]').forEach((checkbox, index) => { 
            const task = allTasks[index];
            
            checkbox.addEventListener('change', async (e) => { 
                const taskId = parseInt(e.target.dataset.taskId);
                const isEnabled = e.target.checked;
                
                try { 
                    if (task.name === 'Custom Task' && isEnabled) { 
                        const customName = prompt('¿Qué tarea personalizada quieres agregar?', 'Tocar Guitarra');
                        if (customName && customName.trim()) { 
                            await window.taskAPI.updateUserTask(userCode, taskId, isEnabled, customName.trim());
                            console.log(`Custom task "${customName}" enabled`);
                        } else { 
                            e.target.checked = false;
                            return;
                        } 
                    } else { 
                        await window.taskAPI.updateUserTask(userCode, taskId, isEnabled);
                        console.log(`Task ${taskId} ${isEnabled ? 'enabled' : 'disabled'}`);
                    } 
                } catch (error) { 
                    console.error('Error updating task:', error);
                } 
            }); 
        });
        
    } catch (error) {
        console.error('Error in renderTaskSettings:', error);
        container.innerHTML += '<p style="color: var(--bad);">Error cargando tareas</p>';
    }
}
}  // ← Este cierre faltaba
// ===== EXERCISE CATEGORIES =====
window.exerciseCategories = [
    { name: 'HIIT', emoji: '💪' },
    { name: 'Correr', emoji: '🏃‍♂️' },
    { name: 'Fútbol', emoji: '⚽' },
    { name: 'Básquetbol', emoji: '🏀' },
    { name: 'Gimnasio', emoji: '🏋️‍♂️' },
    { name: 'Caminar', emoji: '🚶‍♂️' },
    { name: 'Bicicleta', emoji: '🚴‍♂️' },
    { name: 'Ejercicio General', emoji: '🏃‍♂️' }
];

console.log('tasks.js loaded successfully');
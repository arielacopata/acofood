// --- DATA START ---
// Para añadir todos los alimentos, reemplaza el contenido de las dos
// constantes de abajo con los archivos foods-data.js y nutrients-data.js
document.addEventListener("DOMContentLoaded", () => {
const searchInput = document.querySelector('#search-input');
const searchBar = document.querySelector('.searchbar');

if (searchInput && searchBar) {
    // Solo ejecutar si ambos elementos existen
    searchInput.addEventListener('focus', ()=> floatSearch(true));
    searchInput.addEventListener('blur', ()=> floatSearch(false));
}


  function floatSearch(on){
    searchBar?.classList.toggle('is-floating', !!on);
    if(on){
      setTimeout(()=> searchInput.scrollIntoView({block:'start', behavior:'smooth'}), 50);
    }
  }

  searchInput.addEventListener('focus', ()=> floatSearch(true));
  searchInput.addEventListener('blur',  ()=> floatSearch(false));
});


// Crear/ingresar código de usuario
function showUserCodeModal() {
    // Eliminar modales existentes
    document.querySelectorAll('[data-modal="user-code"]').forEach(el => el.remove());
    
    const modal = document.createElement('div');
    modal.setAttribute('data-modal', 'user-code');
    modal.innerHTML = `
        <div class="modal">
            <h3>Código Personal</h3>
            <input type="text" id="userCodeInput" placeholder="Ej: juan2024" style="width: 100%; padding: 12px; margin: 16px 0; font-size: 16px;">
            <div style="text-align: center; margin-top: 20px;">
                <button id="createCodeBtn" style="background: #007bff; color: white; border: none; padding: 10px 20px; margin: 0 8px; border-radius: 6px; cursor: pointer;">Acceder</button>
                <button id="cancelCodeBtn" style="background: #6c757d; color: white; border: none; padding: 10px 20px; margin: 0 8px; border-radius: 6px; cursor: pointer;">Cancelar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners inmediatos
    const input = modal.querySelector('#userCodeInput');
    const createBtn = modal.querySelector('#createCodeBtn');
    const cancelBtn = modal.querySelector('#cancelCodeBtn');
    
    input.focus();
    
    createBtn.addEventListener('click', async () => {
        const code = input.value.trim();
        if (code.length >= 6) {
            await loginWithCode(code);
            modal.remove();
        } else {
            alert('Mínimo 6 caracteres');
        }
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    // Cerrar con clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Cerrar con ESC
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
	// AGREGAR ESTO después de los otros event listeners:

// Enter para enviar
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Evitar comportamiento por defecto
        
        // Misma lógica que el botón "Acceder"
        const code = input.value.trim();
        if (code.length >= 6) {
            loginWithCode(code).then(() => {
                modal.remove();
            });
        } else {
            alert('Mínimo 6 caracteres');
        }
    }
});
}
// Login con código
async function loginWithCode(code) {
    try {
        // PRIMERO verificar si es admin - USANDO BYPASS
        try {
            const adminData = await window.directSupabaseQuery('admin_users', {
                select: 'admin_code,name',
                admin_code: `eq.${code}`
            });
            
            if (adminData && adminData.length > 0) {
                // Es admin - mostrar panel
                showAdminPanel();
                showToast(`Acceso admin: ${adminData[0].name}`);
                return;
            }
        } catch (adminError) {
            console.log('Admin check failed (expected for normal users):', adminError);
        }
        
        // NO es admin - proceder como usuario normal
        userCode = code.toLowerCase();
        localStorage.setItem('acofood_usercode', userCode);
        await loadUserData();
        updateUIForLoggedUser();
        showToast(`Conectado: ${code}`);
        
    } catch (error) {
        console.error('Error en login:', error);
        showToast('Error al conectar');
    }
}

function showAdminPanel() {
    // Remover panel existente si lo hay
    const existingPanel = document.querySelector('[data-modal="admin-panel"]');
    if (existingPanel) existingPanel.remove();
    
    const modal = document.createElement('div');
    modal.className = 'backdrop';
    modal.setAttribute('data-modal', 'admin-panel');
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal">
            <h3>Panel de Admin</h3>
            <input type="text" id="searchCodeInput" placeholder="Buscar código parcial..." style="width: 100%; padding: 12px; margin: 16px 0;">
            <button id="searchCodesBtn" class="btn" style="margin: 8px;">Buscar</button>
            <div id="searchResults" style="max-height: 300px; overflow-y: auto; margin: 16px 0;"></div>
            <button id="closeAdminBtn" class="btn" style="margin: 8px;">Cerrar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    document.getElementById('searchCodesBtn').onclick = searchUserCodes;
    document.getElementById('closeAdminBtn').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

function showAdminPanel() {
    // Remover panel existente si lo hay
    const existingPanel = document.querySelector('[data-modal="admin-panel"]');
    if (existingPanel) existingPanel.remove();
    
    const modal = document.createElement('div');
    modal.className = 'backdrop';
    modal.setAttribute('data-modal', 'admin-panel');
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal">
            <h3>Panel de Admin</h3>
            <input type="text" id="searchCodeInput" placeholder="Buscar código parcial..." style="width: 100%; padding: 12px; margin: 16px 0;">
            <button id="searchCodesBtn" class="btn" style="margin: 8px;">Buscar</button>
            <div id="searchResults" style="max-height: 300px; overflow-y: auto; margin: 16px 0;"></div>
            <button id="closeAdminBtn" class="btn" style="margin: 8px;">Cerrar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    document.getElementById('searchCodesBtn').onclick = searchUserCodes;
    document.getElementById('closeAdminBtn').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

async function searchUserCodes() {
    const partialCode = document.getElementById('searchCodeInput').value.trim();
    if (!partialCode) return;
    
    try {
        const { data: profiles } = await supabase
            .from('user_data')
            .select('user_code, data')
            .ilike('user_code', `%${partialCode}%`)
            .eq('data_type', 'profile');
        
        const resultsDiv = document.getElementById('searchResults');
        if (!profiles || profiles.length === 0) {
            resultsDiv.innerHTML = '<p>No se encontraron códigos</p>';
        } else {
            resultsDiv.innerHTML = profiles.map(item => 
                `<div style="padding: 8px; border-bottom: 1px solid #333;">
                    <strong>${item.user_code}</strong><br>
                    <small>${item.data.profile?.name || 'Sin nombre'}</small>
                </div>`
            ).join('');
        }
        
    } catch (error) {
        console.error('Error buscando códigos:', error);
        document.getElementById('searchResults').innerHTML = '<p>Error en la búsqueda</p>';
    }
}
// Cargar datos del usuario desde Supabase
async function loadUserData() {
    if (!userCode || !supabase) return;
    
    try {
        // Cargar perfil del usuario - USANDO BYPASS
        try {
            const profileData = await window.directSupabaseQuery('user_data', {
                select: '*',
                user_code: `eq.${userCode}`,
                data_type: 'eq.profile'
            });
            
            if (profileData && profileData.length > 0) {
                const profile = profileData[0];
                state.profile = profile.data.profile || {};
                state.goals = profile.data.goals || { carbs: 65, protein: 20, fat: 15 };
            }
        } catch (profileError) {
            console.log('Profile load failed:', profileError);
        }
        
        // Cargar historial del día actual - USANDO BYPASS
        try {
            const historyData = await window.directSupabaseQuery('user_data', {
                select: '*',
                user_code: `eq.${userCode}`,
                data_type: 'eq.daily',
                date: `eq.${todayKey}`
            });
            
            if (historyData && historyData.length > 0) {
                const history = historyData[0];
                state.history = history.data.history || [];
                dailyTotals = history.data.totals || {};
                state.b12Taken = history.data.b12Taken || false;
                state.b12DailyTask = history.data.b12DailyTask || false;
            }
        } catch (historyError) {
            console.log('History load failed:', historyError);
        }
        
        populateProfileForm();
        populateGoalsForm();
        renderFoods();
        
    } catch (error) {
        console.log('Error cargando datos del usuario:', error);
    }
}

// Guardar datos en Supabase
async function saveUserData() {
    if (!userCode || !supabase) return;
    
    try {
        // Guardar perfil
        await supabase
            .from('user_data')
            .upsert({
                user_code: userCode,
                data_type: 'profile',
                data: {
                    profile: state.profile,
                    goals: state.goals
                }
            });
        
        // Guardar datos del día
        await supabase
            .from('user_data')
            .upsert({
                user_code: userCode,
                data_type: 'daily',
                date: todayKey,
                data: {
                    history: state.history,
                    totals: dailyTotals,
                    b12Taken: state.b12Taken,
                    b12DailyTask: state.b12DailyTask
                }
            });
            
    } catch (error) {
        console.log('Error guardando datos:', error);
    }
}

// Actualizar UI para usuario logueado
function updateUIForLoggedUser() {
    const authSection = document.getElementById('auth-section');
    if (authSection) {
        authSection.innerHTML = `
            <span class="sub">Código: ${userCode}</span>
            <button id="logoutBtn" class="btn" style="margin-left: 8px;">Cerrar Sesión</button>
        `;
        document.getElementById('logoutBtn').onclick = logout;
    }
}

function updateUIForLoggedOut() {
    const authSection = document.getElementById('auth-section');
    if (authSection) {
        authSection.innerHTML = `
            <button id="loginCodeBtn" class="btn">Acceder con Código</button>
        `;
        document.getElementById('loginCodeBtn').onclick = showUserCodeModal;
    }
}
// Cerrar sesión
function logout() {
    userCode = null;
    localStorage.removeItem('acofood_usercode');
    
    // Limpiar datos locales
    state.history = [];
    dailyTotals = {};
    state.profile = {};
    state.goals = { carbs: 65, protein: 20, fat: 15 };
    
    updateUIForLoggedOut();
    renderFoods();
    showToast('Sesión cerrada');
}

// Modificar saveState para usar base de datos
function saveState() {
    if (userCode) {
        saveUserData();
    } else {
        // Mantener localStorage como backup
        localStorage.setItem('acofood_history_' + todayKey, JSON.stringify(state.history));
        localStorage.setItem('acofood_totals_' + todayKey, JSON.stringify(dailyTotals));
		localStorage.setItem('acofood_usage', JSON.stringify(foodUsage));
        localStorage.setItem('acofood_profile', JSON.stringify(state.profile));
        localStorage.setItem('acofood_goals', JSON.stringify(state.goals));
        localStorage.setItem('acofood_b12_' + todayKey, JSON.stringify(state.b12Taken));
        localStorage.setItem('acofood_b12Daily_' + todayKey, JSON.stringify(state.b12DailyTask));
    }
    renderHistoryAndTotals();
}



function createMobileSearchElements() {
    // Crear backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'search-backdrop';
    backdrop.addEventListener('click', closeMobileSearch);
    document.body.appendChild(backdrop);
    
    // Crear contenedor de resultados móvil
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'search-results-mobile';
    resultsContainer.id = 'mobile-search-results';
	resultsContainer.style.display = 'none'; // Agregar esta línea
    document.body.appendChild(resultsContainer);
}

// Detectar si es móvil
function isMobile() {
    return window.innerWidth <= 768;
}


// Función para buscar alimentos con búsqueda flexible
window.buscarAlimentoEnDB = async function(termino) {
    if (!supabase) {
        console.log('Supabase aún no está listo');
        return [];
    }
    
    try {
        // Traer más resultados para filtrar en el cliente
        const { data, error } = await supabase
            .from('alimentos')
            .select('*')
            .ilike('nombre', `%${termino}%`)
            .limit(30);
        
        if (error) throw error;
        
        // Filtrar en el cliente para mayor flexibilidad
        const normalizedSearch = normalizeText(termino);
        const allResults = (data || []).filter(food => {
            const normalizedName = normalizeText(food.nombre);
            const originalName = food.nombre.toLowerCase();
            
   return normalizedName.includes(normalizedSearch);
        });
        
        // Ordenar por relevancia (coincidencias exactas primero)
        const sorted = allResults.sort((a, b) => {
            const aName = a.nombre.toLowerCase();
            const bName = b.nombre.toLowerCase();
            const searchLower = termino.toLowerCase();
            
            // Priorizar coincidencias que empiecen con el término
            if (aName.startsWith(searchLower) && !bName.startsWith(searchLower)) return -1;
            if (!aName.startsWith(searchLower) && bName.startsWith(searchLower)) return 1;
            
            return aName.localeCompare(bName);
        });
        
        const finalResults = sorted.slice(0, 10);
        console.log('Encontrados:', finalResults);
        return finalResults;
    } catch (error) {
        console.error('Error en búsqueda:', error);
        return [];
    }
};
// --- DATA END ---

const supplements = [
    { name: 'Vitamina B12', emoji: '💊' },
    { name: 'Vitamina D', emoji: '☀️' },
    { name: 'Omega 3 (Algas)', emoji: '🌿' }
];

const nutrientUnits = {
    "Calorías": "kcal", "Proteínas": "g", "Carbohidratos": "g", "Fibra": "g", "Azúcares totales": "g",
    "Azúcares añadidos": "g", "Grasas totales": "g", "Grasas saturadas": "g", "Grasas trans": "g",
    "Calcio": "mg", "Hierro": "mg", "Magnesio": "mg", "Fósforo": "mg", "Potasio": "mg", "Sodio": "mg", "Zinc": "mg",
    "Vitamina A": "mcg", "Vitamina C": "mg", "Vitamina D": "mcg", "Vitamina E": "mg", "Vitamina K": "mcg",
    "Vitamina B1 (Tiamina)": "mg", "Vitamina B2 (Riboflavina)": "mg", "Vitamina B3 (Niacina)": "mg",
    "Vitamina B4 (Colina)": "mg", "Vitamina B6": "mg", "Vitamina B9 (Folato)": "mcg", "Vitamina B12": "mcg",
    "Omega-3": "g", "Omega-6": "g", "Omega-9": "g", "Colesterol": "mg", "Cafeína": "mg"
};
const nutrientRDAs = {
    "Fibra": 30, "Vitamina A": 900, "Vitamina C": 90, "Vitamina D": 15, "Vitamina E": 15, "Vitamina K": 120,
    "Calcio": 1000, "Hierro": 18, "Magnesio": 420, "Fósforo": 700, "Potasio": 3400, "Sodio": 2300, "Zinc": 11,
    "Vitamina B1 (Tiamina)": 1.2, "Vitamina B2 (Riboflavina)": 1.3, "Vitamina B3 (Niacina)": 16, "Vitamina B6": 1.7, "Vitamina B9 (Folato)": 400
};

const exerciseLevels = {
    1: ["1: Sedentario", "2: Bajo (1-2 días/sem)"],
    2: ["2: Bajo (1-2 días/sem)", "3: Medio (3-4 días/sem)", "4: Alto (4-5 días/sem)"],
    3: ["3: Medio (3-4 días/sem)", "4: Alto (4-5 días/sem)", "5: Diario"],
    4: ["4: Alto (4-5 días/sem)", "5: Diario", "6: Diario (Doble Turno)"]
};

const todayKey = new Date().toISOString().slice(0, 10);
let state = {
  layout: 'B', 
  theme: 'light',
  sortOrder: 'alpha',
  history: [],
  foods: groupedFoods,
  profile: {},
  goals: { carbs: 65, protein: 20, fat: 15 },
  b12Taken: false,
  b12DailyTask: false
};
let dailyTotals = {};
let foodUsage = {};
let currentFoodSelection = null;
const gramsPresets = [10, 50, 100, 150, 200, 250];

// --- UTILITIES ---
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copiado al portapapeles');
        }).catch(err => {
            showToast('Error al copiar');
        });
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('Copiado al portapapeles');
        } catch (err) {
            showToast('Error al copiar');
        }
        document.body.removeChild(textArea);
    }
}

function downloadFile(filename, content) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function addRecord(food, text, isSupplement = false) {
  let record = {
    ts: new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }),
    food: food.fullName || food.name,
    emoji: food.emoji,
    qty: text,
    isSupplement: isSupplement,
    id: food.id // Store id for calorie calculation
  };
  
  state.history.unshift(record);

  if (!isSupplement) {
    const grams = parseFloat(text);
    if (!isNaN(grams) && grams > 0) {
      const nutrients = nutrientsData[food.id];
      if (nutrients) {
        for (const nutrientName in nutrients) {
          const valuePer100g = nutrients[nutrientName];
          const valueForPortion = (valuePer100g / 100) * grams;
          dailyTotals[nutrientName] = (dailyTotals[nutrientName] || 0) + valueForPortion;
        }
      }
      const foodKey = food.groupName || food.name;
      foodUsage[foodKey] = (foodUsage[foodKey] || 0) + 1;
    }
  }
  saveState();
  closeModal();
  document.getElementById('search-input').value = '';
  renderFoods();
}

function normalizeText(text) {
    return (text || "")
        .normalize("NFD")
        .replace(/[̀-\u036f]/g, "")
        .toLowerCase();
}

function handleOnlineFoodClick(food) {
    const tempFood = {
        id: 'online_' + food.id,
        name: food.nombre,
        isOnline: true,
        calorias: food.calorias_por_100g,
        proteinas: food.proteinas_por_100g,
        carbohidratos: food.carbohidratos_por_100g,
        grasas: food.grasas_totales_por_100g
    };
    showFoodModal(tempFood);
}

async function renderMobileSearchResults(filter) {
    const container = document.getElementById('mobile-search-results');
    if (!container) return;
    
    // Mostrar estado de búsqueda
    document.body.classList.add('searching-mobile');
    container.style.display = 'block';
    container.innerHTML = '<div style="padding: 16px; text-align: center; color: #999;">Buscando...</div>';
    
    // Buscar localmente primero
    const filterLower = filter.toLowerCase();
    let foodsToRender = [...state.foods];
const filteredFoods = foodsToRender.filter(f => {
    const groupNameMatch = (f.groupName || f.name).toLowerCase().includes(filterLower);

    // si hay variants, buscamos también ahí
    const variantMatch = f.variants?.some(v => 
        v.name.toLowerCase().includes(filterLower) || 
        v.fullName?.toLowerCase().includes(filterLower)
    );

    return groupNameMatch || variantMatch;
});

    
    let allResults = [];

// Revisar cada grupo
foodsToRender.forEach(f => {
    const groupNameMatch = (f.groupName || f.name).toLowerCase().includes(filterLower);

    // Si matchea el grupo, lo agregamos como está
    if (groupNameMatch) {
        allResults.push(f);
    }

    // Si matchean las variantes, las agregamos como resultados individuales
    f.variants?.forEach(v => {
        if (
            v.name.toLowerCase().includes(filterLower) || 
            v.fullName?.toLowerCase().includes(filterLower)
        ) {
            allResults.push({
                ...v,
                emoji: f.emoji,   // heredamos emoji del grupo
                parent: f.groupName
            });
        }
    });
});

    
    // Buscar online si hay pocos resultados
    if (filter && filteredFoods.length < 3 && window.buscarAlimentoEnDB) {
        try {
            const onlineResults = await window.buscarAlimentoEnDB(filter);
            onlineResults.forEach(food => {
                const existsLocal = filteredFoods.some(f => 
                    (f.name || f.groupName).toLowerCase() === food.nombre.toLowerCase()
                );
                if (!existsLocal) {
                    allResults.push({
                        id: 'online_' + food.id,
                        name: food.nombre,
                        isOnline: true,
                        calorias: food.calorias_por_100g,
                        emoji: '🌐'
                    });
                }
            });
        } catch (error) {
            console.log('Error búsqueda online:', error);
        }
    }
    
		allResults.sort((a, b) => {
			if (a.isOnline && !b.isOnline) return -1;  // Online va arriba
			if (!a.isOnline && b.isOnline) return 1;   // Local va abajo  
			return 0; // mantener orden dentro de cada grupo
		});
	
	
    // Renderizar resultados
    if (allResults.length === 0) {
        container.innerHTML = '<div style="padding: 16px; text-align: center; color: #999;">No se encontraron resultados</div>';
        return;
    }
    
    container.innerHTML = '';
    allResults.slice(0, 8).forEach(food => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        
        const name = food.groupName || food.name;
        const calories = food.isOnline ? food.calorias : 
            (food.variants ? nutrientsData[food.variants[0].id]?.Calorías : nutrientsData[food.id]?.Calorías);
        const calText = calories ? ` (${calories.toFixed(0)} kcal/100g)` : '';
        const onlineText = food.isOnline ? ' • Online' : '';
        
        item.innerHTML = `
            <div class="result-emoji">${food.emoji}</div>
            <div class="result-text">
                <div class="result-name">${name}</div>
                <div class="result-calories">${calText}${onlineText}</div>
            </div>
        `;
        
        item.addEventListener('click', () => {
            if (food.isOnline) {
                // Convertir a formato esperado para alimentos online
                const tempFood = {
                    id: food.id,
                    nombre: food.name,
                    calorias_por_100g: food.calorias
                };
                handleOnlineFoodClick(tempFood);
            } else {
                handleFoodClick(food);
            }
            closeMobileSearch();
        });
        
        container.appendChild(item);
    });
}

// Cerrar búsqueda móvil
function closeMobileSearch() {
    document.body.classList.remove('searching-mobile');
    const container = document.getElementById('mobile-search-results');
    if (container) {
        container.style.display = 'none';
    }
    
    // Limpiar búsqueda y mostrar grid normal
    const searchInput = document.getElementById('search-input');
	console.log(searchInput); // ¿Existe el elemento?
    if (searchInput) {
        searchInput.value = '';
        renderFoods(); // Tu función original
    }
}

// Modificar el event listener del input de búsqueda
function setupMobileSearchInput() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    // Remover listeners existentes si los hay
    searchInput.removeEventListener('input', originalInputHandler);
    
    searchInput.addEventListener('input', (e) => {
        const value = e.target.value;
        
        if (isMobile() && value.length > 0) {
            // En móvil, usar búsqueda hacia arriba
            renderMobileSearchResults(value);
        } else if (!isMobile()) {
            // En desktop, usar método original
            renderFoods(value);
        } else {
            // Sin filtro, cerrar búsqueda móvil
            closeMobileSearch();
        }
    });
    
    // Cerrar con ESC
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileSearch();
        }
    });
}


async function renderFoods(filter = '') {
     // Si es móvil y hay filtro, mostrar resultados hacia arriba
    if (isMobile() && filter) {
        await renderMobileSearchResults(filter);
        return;
    }	
	const grid = document.getElementById('grid');
    grid.className = 'grid';
    if(state.layout === 'B') grid.classList.add('layoutB');
    grid.innerHTML = '';
    
	
	// En la sección de B12 de renderFoods()
console.log('=== B12 DEBUG ===');
console.log('userCode:', userCode);
console.log('state.b12DailyTask:', state.b12DailyTask);
console.log('localStorage B12:', localStorage.getItem('acofood_b12Daily_' + todayKey));

if (!state.b12DailyTask && userCode) {
    console.log('Debería mostrar B12');
    // crear botón B12
} else {
    console.log('NO mostrar B12 porque:', {
        b12DailyTask: state.b12DailyTask,
        userCode: userCode
    });
}
	

    // Add B12 daily task if not completed
    if (!state.b12DailyTask && userCode) {
        const taskCard = document.createElement('div');
        taskCard.className = 'card btn wide-tasks';
        taskCard.innerHTML = `<div class="emoji">💊</div><div>Vitamina B12</div>`;
        taskCard.addEventListener('click', () => {
            openB12Modal();
            state.b12DailyTask = true;
            saveState();
            renderFoods(document.getElementById('search-input').value);
        });
        grid.appendChild(taskCard);
    }
    
    const filterLower = filter.toLowerCase();
    let foodsToRender = [...state.foods];
    if (state.sortOrder === 'usage') {
        foodsToRender.sort((a, b) => (foodUsage[b.groupName || b.name] || 0) - (foodUsage[a.groupName || a.name] || 0));
    } else {
        foodsToRender.sort((a, b) => (a.groupName || a.name).localeCompare(b.groupName || b.name));
    }
    
   const filteredFoods = foodsToRender.filter(f => {
    const groupNameMatch = (f.groupName || f.name).toLowerCase().includes(filterLower);

    // si hay variants, buscamos también ahí
    const variantMatch = f.variants?.some(v => 
        v.name.toLowerCase().includes(filterLower) || 
        v.fullName?.toLowerCase().includes(filterLower)
    );

    return groupNameMatch || variantMatch;
});

filteredFoods.forEach(f => {
    const groupNameMatch = (f.groupName || f.name).toLowerCase().includes(filterLower);

    // Mostrar el grupo si coincide o si no hay filtro (exploración general)
    if (!filter || groupNameMatch) {
        const card = document.createElement('div');
        card.className = 'card btn';
        const name = f.groupName || f.name;
        const calories = f.variants ? nutrientsData[f.variants[0].id]?.Calorías : nutrientsData[f.id]?.Calorías;
        const calText = calories ? `<div class="sub">(${calories.toFixed(0)} kcal/100g)</div>` : '';
        card.innerHTML = `<div class="emoji">${f.emoji}</div><div>${name}${calText}</div>`;
        card.addEventListener('click', () => handleFoodClick(f));
        grid.appendChild(card);
    }

    // Solo expandir variantes cuando HAY búsqueda
    if (filter) {
        f.variants?.forEach(v => {
            if (
                v.name.toLowerCase().includes(filterLower) || 
                v.fullName?.toLowerCase().includes(filterLower)
            ) {
                const card = document.createElement('div');
                card.className = 'card btn';
                const calories = nutrientsData[v.id]?.Calorías;
                const calText = calories ? `<div class="sub">(${calories.toFixed(0)} kcal/100g)</div>` : '';
                card.innerHTML = `<div class="emoji">${f.emoji}</div><div>${v.fullName || v.name}${calText}</div>`;
                card.addEventListener('click', () => handleFoodClick(v));
                grid.appendChild(card);
            }
        });
    }
});

    
   // Buscar en Supabase si hay filtro y pocos resultados locales
if (filter && filteredFoods.length < 3 && window.buscarAlimentoEnDB) {
    try {
        const normalizedFilter = normalizeText(filter);
        
        // Buscar tanto el texto original como el normalizado
        const searches = [
            window.buscarAlimentoEnDB(filter),           // Búsqueda original
            window.buscarAlimentoEnDB(normalizedFilter)  // Búsqueda sin acentos
        ];
        
        const results = await Promise.all(searches);
        const allResults = [...results[0], ...results[1]];
        
        // Eliminar duplicados por ID
        const uniqueResults = allResults.filter((food, index, arr) => 
            arr.findIndex(f => f.id === food.id) === index
        );
        
        uniqueResults.forEach(food => {
            const existsLocal = filteredFoods.some(f => 
                (f.name || f.groupName).toLowerCase() === food.nombre.toLowerCase()
            );
            if (!existsLocal) {
                const card = document.createElement('div');
                card.className = 'card btn';
                card.style.border = '1px solid #6366f1';
                const calText = `<div class="sub">(${food.calorias_por_100g} kcal/100g) • Online</div>`;
                card.innerHTML = `<div class="emoji">🌐</div><div>${food.nombre}${calText}</div>`;
                card.addEventListener('click', () => handleOnlineFoodClick(food));
                grid.appendChild(card);
            }
        });
    } catch (error) {
        console.log('Error búsqueda online:', error);
		}
	}
}


console.log('Llegué hasta aquí - antes de renderSupplements');

function renderSupplements() {
    const grid = document.getElementById('supplements-grid');
    grid.innerHTML = '';
    
    // All supplements always available
    const allSupplements = [
        { name: 'Vitamina B12', emoji: '💊' },
        { name: 'Vitamina D', emoji: '☀️' },
        { name: 'Omega 3 (Algas)', emoji: '🌿' }
    ];
    
    allSupplements.forEach(s => {
        const card = document.createElement('div');
        card.className = 'card btn';
        card.innerHTML = `<div class="emoji">${s.emoji}</div><div>${s.name}</div>`;
        card.addEventListener('click', () => openSupplementModal(s));
        grid.appendChild(card);
    });
}

function addB12(dose) {
    const supplement = { name: 'Vitamina B12', emoji: '💊' };
    addRecord(supplement, dose, true);
    state.b12Taken = true;
    saveState();
    renderSupplements();
}

window.addB12 = addB12; // Make it globally available

function getBarColor(value, rda) {
    if (!rda) return 'var(--muted)';
    const ratio = value / rda;
    if (ratio < 0.5) return 'var(--yellow)';
    if (ratio < 0.8) return 'var(--green-light)';
    if (ratio <= 1.2) return 'var(--green)';
    if (ratio <= 2) return 'var(--green-dark)';
    if (ratio <= 3) return 'var(--red-light)';
    return 'var(--red)';
}

// --- MODALS ---
function openB12Modal() {
    document.getElementById('modalTitle').textContent = 'Vitamina B12';
    document.getElementById('sectionVariants').style.display = 'none';
    document.getElementById('sectionGrams').style.display = 'none';
    document.getElementById('sectionSupplement').style.display = 'none';
    document.getElementById('sectionB12').style.display = 'block';
    document.getElementById('backdrop').style.display = 'flex';
}


window.addB12 = addB12;

function handleFoodClick(foodItem) {
    if (foodItem.variants) {
        openVariantModal(foodItem);
    } else {
        openGramsModal(foodItem);
    }
}

function openVariantModal(foodGroup) {
    document.getElementById('modalTitle').textContent = foodGroup.groupName;
    const variantsRow = document.getElementById('variantsRow');
    variantsRow.innerHTML = '';
    foodGroup.variants.forEach(variant => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.textContent = variant.name;
        chip.addEventListener('click', () => {
            openGramsModal({...variant, emoji: foodGroup.emoji});
        });
        variantsRow.appendChild(chip);
    });
    document.getElementById('sectionVariants').style.display = 'block';
    document.getElementById('sectionGrams').style.display = 'none';
    document.getElementById('sectionSupplement').style.display = 'none';
	document.getElementById('sectionB12').style.display = 'none'; 
    document.getElementById('backdrop').style.display = 'flex';
}

function openGramsModal(food) {
    currentFoodSelection = food;
    document.getElementById('modalTitle').textContent = food.fullName;
    const gramsRow = document.getElementById('gramsRow');
    gramsRow.innerHTML = '';
    gramsPresets.forEach(g => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.textContent = `${g} g`;
        chip.addEventListener('click', () => addRecord(currentFoodSelection, `${g} g`));
        gramsRow.appendChild(chip);
    });
    const gramsInput = document.getElementById('gramsInput');
    gramsInput.value = '';
    document.getElementById('sectionVariants').style.display = 'none';
    document.getElementById('sectionGrams').style.display = 'block';
    document.getElementById('sectionSupplement').style.display = 'none';
	document.getElementById('sectionB12').style.display = 'none';
    document.getElementById('backdrop').style.display = 'flex';
    gramsInput.focus();
}

function openSupplementModal(supplement) {
    currentFoodSelection = supplement;
    document.getElementById('modalTitle').textContent = supplement.name;
    document.getElementById('sectionVariants').style.display = 'none';
    document.getElementById('sectionGrams').style.display = 'none';
    document.getElementById('sectionSupplement').style.display = 'block';
	document.getElementById('sectionB12').style.display = 'none';
    const supplementInput = document.getElementById('supplementInput');
    supplementInput.value = '';
    document.getElementById('backdrop').style.display = 'flex';
    supplementInput.focus();
}

function closeModal() {
  document.getElementById('backdrop').style.display = 'none';
  document.getElementById('report-backdrop').style.display = 'none';
  document.getElementById('io-backdrop').style.display = 'none';
}

// --- HISTORY & REPORT & GOALS ---
function calculateMacroPercentages() {
    const totalCalories = dailyTotals['Calorías'] || 0;
    if (totalCalories === 0) return { protein: 0, carbs: 0, fat: 0 };
    const proteinCals = (dailyTotals['Proteínas'] || 0) * 4;
    const carbCals = (dailyTotals['Carbohidratos'] || 0) * 4;
    const fatCals = (dailyTotals['Grasas totales'] || 0) * 9;
    const totalMacroCals = proteinCals + carbCals + fatCals;
    if (totalMacroCals === 0) return { protein: 0, carbs: 0, fat: 0 };
    return {
        protein: (proteinCals / totalMacroCals) * 100,
        carbs: (carbCals / totalMacroCals) * 100,
        fat: (fatCals / totalMacroCals) * 100
    };
}

function calculateMacroScore() {
    const recommendedCal = calculateRecommendedCalories();
    const actualCal = dailyTotals['Calorías'] || 0;
    
    if (actualCal === 0 || recommendedCal === 0) return 0;
    
    // Calculate target grams based on goals and recommended calories
    const targetCarbGrams = (recommendedCal * (state.goals.carbs / 100)) / 4;
    const targetProteinGrams = (recommendedCal * (state.goals.protein / 100)) / 4;
    const targetFatGrams = (recommendedCal * (state.goals.fat / 100)) / 9;
    
    // Calculate actual grams
    const actualCarbGrams = dailyTotals['Carbohidratos'] || 0;
    const actualProteinGrams = dailyTotals['Proteínas'] || 0;
    const actualFatGrams = dailyTotals['Grasas totales'] || 0;
    
    // Calculate scores (0-100% for each macro)
    const carbScore = targetCarbGrams > 0 ? Math.min((actualCarbGrams / targetCarbGrams) * 100, 100) : 0;
    const proteinScore = targetProteinGrams > 0 ? Math.min((actualProteinGrams / targetProteinGrams) * 100, 100) : 0;
    const fatScore = targetFatGrams > 0 ? Math.min((actualFatGrams / targetFatGrams) * 100, 100) : 0;
    
    // Return average score
    return (carbScore + proteinScore + fatScore) / 3;
}

function renderHistoryAndTotals() {
    const historyPanel = document.getElementById('history-panel');
    if(historyPanel.style.display === 'none') return;
    
    const itemsContainer = document.getElementById('history-items-container');
    itemsContainer.innerHTML = state.history.map(i => {
      let calText = '';
      if (!i.isSupplement) {
        const grams = parseFloat(i.qty);
        const foodData = nutrientsData[i.id];
        if (!isNaN(grams) && foodData) {
          const portionCals = (foodData['Calorías'] / 100) * grams;
          calText = `(${portionCals.toFixed(0)} Cal)`;
        }
      }
      return `
        <div class="item">
        <div class="inline"><div class="emoji">${i.emoji}</div><div>${i.food} <span class="sub">${calText}</span></div></div>
        <div class="sub">${i.qty} · ${i.ts}</div>
        </div>
    `}).join('');
    
    const totalsContainer = document.getElementById('totals-summary-container');
    const cal = (dailyTotals['Calorías'] || 0);
    const recommended_cal = calculateRecommendedCalories();
    const calPercent = recommended_cal > 0 ? Math.min((cal / recommended_cal) * 100, 100) : 0;
    
    const macroPcts = calculateMacroPercentages();
    const goalPcts = state.goals;
    const macroScore = calculateMacroScore();
    
    const microScores = Object.keys(nutrientRDAs).map(nutrient => {
    const consumed = dailyTotals[nutrient] || 0;
    const rda = nutrientRDAs[nutrient];
    const percentage = (consumed / rda) * 100;
    return Math.min(percentage, 100);
	});
	const microScore = microScores.reduce((sum, score) => sum + score, 0) / microScores.length;

    const circumference = 2 * Math.PI * 36;

    totalsContainer.innerHTML = `
      <div id="totals-summary">
        <div class="title row" style="font-size:14px; margin-bottom: 8px; padding: 8px 2px; border-bottom:1px solid var(--border);">
            <span>Totales / <b style="color:var(--good)">${recommended_cal.toFixed(0)} kcal</b></span>
            <div class="inline">
                <button class="iconbtn" id="reportBtn" style="font-size:12px; padding: 4px 8px;">Reporte</button>
                <button class="iconbtn" id="ioBtn" style="font-size:12px; padding: 4px 8px;">In/Out</button>
            </div>
        </div>
        <div class="progress-circles">
            <div class="circle-wrap">
                <svg width="80" height="80"><circle class="circle-bg" cx="40" cy="40" r="36"></circle><circle class="circle-progress" id="cal-circle" cx="40" cy="40" r="36" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"></circle></svg>
                <div class="circle-text"><div class="circle-percent">${calPercent.toFixed(0)}%</div><div class="circle-label">Calorías</div></div>
            </div>
            <div class="circle-wrap">
                <svg width="80" height="80"><circle class="circle-bg" cx="40" cy="40" r="36"></circle><circle class="circle-progress" id="macro-circle" cx="40" cy="40" r="36" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"></circle></svg>
                <div class="circle-text"><div class="circle-percent">${macroScore.toFixed(0)}%</div><div class="circle-label">Macros</div></div>
            </div>
            <div class="circle-wrap">
                <svg width="80" height="80"><circle class="circle-bg" cx="40" cy="40" r="36"></circle><circle class="circle-progress" id="micro-circle" cx="40" cy="40" r="36" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"></circle></svg>
                <div class="circle-text"><div class="circle-percent">${microScore.toFixed(0)}%</div><div class="circle-label">Micros</div></div>
            </div>
        </div>
        <div id="detailed-macros" style="padding: 10px 0; display: none;"></div>
        <div style="text-align:center;"><button id="expand-macros" class="sub btn" style="border:0; background: none;">Expandir</button></div>
      </div>
    `;
    
    document.getElementById('cal-circle').style.strokeDashoffset = circumference - (calPercent / 100) * circumference;
    document.getElementById('macro-circle').style.strokeDashoffset = circumference - (macroScore / 100) * circumference;
    document.getElementById('micro-circle').style.strokeDashoffset = circumference - (microScore / 100) * circumference;

    document.getElementById('reportBtn').onclick = () => {
        renderFullReport();
        document.getElementById('report-backdrop').style.display = 'flex';
    };
    document.getElementById('ioBtn').onclick = () => {
        document.getElementById('io-backdrop').style.display = 'flex';
    };
    document.getElementById('expand-macros').onclick = (e) => {
        const detailDiv = document.getElementById('detailed-macros');
        const isHidden = detailDiv.style.display === 'none';
        detailDiv.style.display = isHidden ? 'block' : 'none';
        e.target.textContent = isHidden ? 'Compactar' : 'Expandir';
        if (isHidden) {
            renderDetailedMacros();
        }
    };
}

function renderDetailedMacros() {
    const container = document.getElementById('detailed-macros');
    const macros = [
        { name: 'Carbohidratos', color: 'var(--progress-carbs)', value: dailyTotals['Carbohidratos'] || 0, goal: (calculateRecommendedCalories() * (state.goals.carbs/100)) / 4 },
        { name: 'Proteínas', color: 'var(--progress-protein)', value: dailyTotals['Proteínas'] || 0, goal: (calculateRecommendedCalories() * (state.goals.protein/100)) / 4 },
        { name: 'Grasas totales', color: 'var(--progress-fat)', value: dailyTotals['Grasas totales'] || 0, goal: (calculateRecommendedCalories() * (state.goals.fat/100)) / 9 }
    ];

    container.innerHTML = macros.map(macro => {
        const percent = macro.goal > 0 ? Math.min((macro.value / macro.goal) * 100, 100) : 0;
        return `
            <div class="macro-bar-container">
                <div class="row sub" style="font-size:12px;">
                    <span>${macro.name}</span>
                    <span>${macro.value.toFixed(1)}g / ${macro.goal.toFixed(1)}g</span>
                </div>
                <div class="macro-bar">
                    <div class="macro-bar-fill" style="width: ${percent}%; background-color: ${macro.color};"></div>
                </div>
            </div>
        `;
    }).join('');
}


function renderFullReport() {
    const contentDiv = document.getElementById('report-content');
    const sortedNutrients = Object.keys(dailyTotals).sort((a, b) => a.localeCompare(b));
    let html = '';

    sortedNutrients.forEach(key => {
        if (dailyTotals[key] > 0) {
            const value = dailyTotals[key];
            const unit = nutrientUnits[key] || '';
            const rda = nutrientRDAs[key];
            let formattedValue = parseFloat(value.toFixed(3)).toString();
            
            const barColor = getBarColor(value, rda);
            const percentage = rda ? Math.min((value / rda) * 100, 200) : 0;
            
            html += `<div class="report-item">
                        <span>${key}</span>
                        <span><b>${formattedValue}</b> ${unit}${rda ? ` / ${rda} ${unit}` : ''}</span>
                        ${rda ? `<div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${Math.min(percentage, 100)}%; background-color: ${barColor};"></div>
                        </div>` : ''}
                     </div>`;
        }
    });

    const takenSupplements = state.history.filter(item => item.isSupplement);
    if(takenSupplements.length > 0){
        html += '<div class="section-title" style="margin-top: 20px;">Suplementos</div>';
        takenSupplements.forEach(sup => {
             html += `<div class="report-item">
                        <span>${sup.food}</span>
                        <span><b>${sup.qty}</b></span>
                     </div>`;
        });
    }

    contentDiv.innerHTML = html || '<div class="sub" style="text-align:center; padding: 20px 0;">No hay datos para mostrar.</div>';
}

// --- IMPORT / EXPORT ---
function exportHistoryAsText() {
    if(state.history.length === 0) {
        showToast("No hay historial para exportar");
        return;
    }
    const text = state.history.map(item => `${item.food} - ${item.qty}`).join('\n');
    copyToClipboard(text);
}

function exportHistoryAsJSON() {
    if(state.history.length === 0 && Object.keys(state.profile).length === 0) {
        showToast("No hay datos para exportar");
        return;
    }
    const dataToExport = {
        profile: state.profile,
        goals: state.goals,
        days: {
            [todayKey]: {
                history: state.history,
                totals: dailyTotals
            }
        }
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    downloadFile(`acofood_backup_${todayKey}.json`, jsonString);
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if(confirm(`¿Quieres importar los datos del archivo?`)) {
                if(importedData.profile) {
                    state.profile = importedData.profile;
                    populateProfileForm();
                }
                if(importedData.goals) {
                    state.goals = importedData.goals;
                    populateGoalsForm();
                }
                if(importedData.days && importedData.days[todayKey]) {
                    state.history = importedData.days[todayKey].history;
                    dailyTotals = importedData.days[todayKey].totals;
                }
                saveState();
                showToast(`Datos importados.`);
            }
        } catch (error) {
            showToast("Error al leer el archivo.");
            console.error("Import error:", error);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

function exportReport() {
    if(Object.keys(dailyTotals).length === 0 && state.history.filter(i => i.isSupplement).length === 0) {
        showToast("No hay reporte para exportar");
        return;
    }
    let reportText = `Reporte Nutricional - ${todayKey}\n\n`;
    const sortedNutrients = Object.keys(dailyTotals).sort((a, b) => a.localeCompare(b));
    sortedNutrients.forEach(key => {
        if (dailyTotals[key] > 0) {
            const value = parseFloat(dailyTotals[key].toFixed(3)).toString();
            const unit = nutrientUnits[key] || '';
            reportText += `${key}: ${value} ${unit}\n`;
        }
    });

    const takenSupplements = state.history.filter(item => item.isSupplement);
    if(takenSupplements.length > 0){
        reportText += '\nSuplementos:\n';
        takenSupplements.forEach(sup => {
             reportText += `${sup.food}: ${sup.qty}\n`;
        });
    }
    copyToClipboard(reportText);
}


// --- PROFILE & SETTINGS ---
function calculateRecommendedCalories() {
    const { dob, gender, weight, height, lifestyle, exercise } = state.profile;
    if (!dob || !gender || !weight || !height || !lifestyle || !exercise) {
        return 2000; // Default value
    }
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    let bmr;
    if (gender === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    const activityFactors = [1.2, 1.375, 1.55, 1.725, 1.9, 2.2]; // Based on exercise level 1-6
    const activityFactor = activityFactors[parseInt(exercise) - 1] || 1.2;

    return bmr * activityFactor;
}

function updateExerciseOptions(lifestyleValue) {
    const exerciseSelect = document.getElementById('profile-exercise');
    const currentExerciseValue = state.profile.exercise;
    exerciseSelect.innerHTML = '';
    const options = exerciseLevels[lifestyleValue] || [];
    options.forEach(opt => {
        const optionEl = document.createElement('option');
        const [value, text] = opt.split(': ');
        optionEl.value = value;
        optionEl.textContent = text;
        exerciseSelect.appendChild(optionEl);
    });
    if (options.some(opt => opt.startsWith(currentExerciseValue + ':'))) {
        exerciseSelect.value = currentExerciseValue;
    } else if(options.length > 0) {
        exerciseSelect.value = options[0].split(':')[0];
    }
}

function populateProfileForm() {
    document.getElementById('profile-name').value = state.profile.name || '';
    document.getElementById('profile-email').value = state.profile.email || '';
    document.getElementById('profile-dob').value = state.profile.dob || '';
    document.getElementById('profile-gender').value = state.profile.gender || '';
    document.getElementById('profile-weight').value = state.profile.weight || '';
    document.getElementById('profile-height').value = state.profile.height || '';
    document.getElementById('profile-lifestyle').value = state.profile.lifestyle || '1';
    updateExerciseOptions(state.profile.lifestyle || '1');
    document.getElementById('profile-exercise').value = state.profile.exercise || '1';
    document.getElementById('profile-expenditure').value = state.profile.expenditure || '';
}

function populateGoalsForm() {
    document.getElementById('goal-carbs').value = state.goals.carbs;
    document.getElementById('goal-protein').value = state.goals.protein;
    document.getElementById('goal-fat').value = state.goals.fat;
    updateMacroHint();
}

function handleMacroSliderChange() {
    updateMacroHint();
}

function updateMacroHint() {
    const carbs = parseInt(document.getElementById('goal-carbs').value);
    const protein = parseInt(document.getElementById('goal-protein').value);
    const fat = parseInt(document.getElementById('goal-fat').value);
    const total = carbs + protein + fat;
    const hint = document.getElementById('macro-total-hint');
    hint.textContent = `Total: ${total}%`;
    hint.style.color = (total === 100) ? 'var(--good)' : 'var(--bad)';

    document.getElementById('carbs-value').textContent = `${carbs}%`;
    document.getElementById('protein-value').textContent = `${protein}%`;
    document.getElementById('fat-value').textContent = `${fat}%`;
    
    document.getElementById('saveGoalsBtn').disabled = (total !== 100);
}


function toggleTheme() {
    state.theme = (state.theme === 'light') ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
    document.getElementById('themeBtn').textContent = (state.theme === 'dark') ? '🌙' : '☀️';
    localStorage.setItem('acofood_theme', state.theme);
}

function renderLayout() {
  renderFoods(document.getElementById('search-input').value);
}

function toggleLayout() {
    state.layout = (state.layout === 'A') ? 'B' : 'A';
    showToast(`Vista cambiada a ${state.layout === 'B' ? 'Grilla' : 'Lista'}`);
    renderLayout();
}

function resetAppData() {
    if (confirm('¿Estás seguro? Se borrará TODO el historial y los datos guardados en el navegador. Esta acción no se puede deshacer.')) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i).startsWith('acofood_')) {
                keysToRemove.push(localStorage.key(i));
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        showToast('Todos los datos han sido borrados. La aplicación se reiniciará.');
        setTimeout(() => location.reload(), 1500);
    }
}

// --- INITIALIZATION ---
async function init() {
    // Load saved state
    dailyTotals = JSON.parse(localStorage.getItem('acofood_totals_' + todayKey) || '{}');
    state.history = JSON.parse(localStorage.getItem('acofood_history_' + todayKey) || '[]');
    state.theme = localStorage.getItem('acofood_theme') || 'light';
    state.sortOrder = localStorage.getItem('acofood_sortOrder') || 'alpha';
    state.profile = JSON.parse(localStorage.getItem('acofood_profile') || '{}');
    state.goals = JSON.parse(localStorage.getItem('acofood_goals') || '{"carbs": 65, "protein": 20, "fat": 15}');
	state.b12Taken = JSON.parse(localStorage.getItem('acofood_b12_' + todayKey) || 'false');
	state.b12DailyTask = JSON.parse(localStorage.getItem('acofood_b12Daily_' + todayKey) || 'false');
    const savedUsage = localStorage.getItem('acofood_usage');
    if(savedUsage){
        foodUsage = JSON.parse(savedUsage);
    } else {
        foodUsage = { "Avena": 94, "Banana": 76, "Maní": 66, "Nueces": 45, "Zanahoria": 32, "Mandarina": 28, "Soja texturizada": 25, "Calabaza": 25, "Cebolla": 16, "Batata / Boniato": 32, "Lentejas": 17, "Palta": 16, "Tomate": 15, "Garbanzos": 14, "Papa": 14 };
    }


    if(state.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.getElementById('themeBtn').textContent = '🌙';
    }
    
    document.getElementById('today').textContent = new Date().toLocaleDateString('es-UY', { weekday: 'long', month: 'long', day: 'numeric' });
    
    // Attach event listeners
    document.getElementById('appTitle').onclick = toggleLayout;
    document.getElementById('themeBtn').onclick = toggleTheme;
    
	document.getElementById('search-input').addEventListener('input', (e) => {
    const value = e.target.value;
    
    if (window.innerWidth <= 768 && value.length > 0) {
        // En móvil con búsqueda activa
        renderMobileSearchResults(value);
    } else if (window.innerWidth <= 768 && value.length === 0) {
        // En móvil sin búsqueda
        closeMobileSearch();
    } else {
        // En desktop siempre usar el método original
        renderFoods(value);
    }
});	
	
    document.getElementById('historyBtn').onclick = () => {
        const panel = document.getElementById('history-panel');
        const isHidden = panel.style.display === 'none' || !panel.style.display;
        panel.style.display = isHidden ? 'block' : 'none';
        if(isHidden){
          renderHistoryAndTotals();
        }
    };
    document.getElementById('gramsAdd').onclick = () => {
      const v = parseFloat(document.getElementById('gramsInput').value);
      if (!isNaN(v) && v > 0 && currentFoodSelection) {
        addRecord(currentFoodSelection, `${v} g`);
      }
    };
     document.getElementById('supplementAdd').onclick = () => {
      const v = document.getElementById('supplementInput').value;
      if (v && currentFoodSelection) {
        addRecord(currentFoodSelection, v, true);
      }
    };
    document.getElementById('closeModal').onclick = closeModal;
    document.getElementById('closeReportModal').onclick = () => document.getElementById('report-backdrop').style.display = 'none';
    document.getElementById('closeIOModal').onclick = () => document.getElementById('io-backdrop').style.display = 'none';

    // Settings Menu listeners
    const settingsMenu = document.getElementById('settings-menu');
    const settingsBackdrop = document.getElementById('settings-backdrop');
    document.getElementById('menuBtn').onclick = () => {
        settingsMenu.classList.add('open');
        settingsBackdrop.style.display = 'block';
    };
    settingsBackdrop.onclick = () => {
        settingsMenu.classList.remove('open');
        settingsBackdrop.style.display = 'none';
    };
    document.getElementById('sort-order-segmented').addEventListener('click', (e) => {
        if(e.target.tagName === 'BUTTON') {
            state.sortOrder = e.target.dataset.value;
            localStorage.setItem('acofood_sortOrder', state.sortOrder);
            document.querySelectorAll('#sort-order-segmented button').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderFoods();
        }
    });
    document.querySelector(`#sort-order-segmented button[data-value="${state.sortOrder}"]`).classList.add('active');
    document.getElementById('resetUsageBtn').onclick = () => {
        if(confirm('¿Seguro que quieres reiniciar el contador de uso de alimentos?')) {
            foodUsage = {};
            localStorage.setItem('acofood_usage', '{}');
            showToast('Contador de uso reiniciado.');
            renderFoods();
        }
    };
    document.getElementById('resetAppBtn').onclick = resetAppData;

    // Profile Listeners
    document.getElementById('saveProfileBtn').onclick = () => {
        const profileInputs = ['name', 'email', 'dob', 'gender', 'weight', 'height', 'lifestyle', 'exercise', 'expenditure'];
        profileInputs.forEach(id => {
            state.profile[id] = document.getElementById(`profile-${id}`).value;
        });
        saveState();
        showToast("Perfil guardado.");
    };
    document.getElementById('profile-lifestyle').onchange = (e) => updateExerciseOptions(e.target.value);


    // Goals Listeners
    const sliders = ['goal-carbs', 'goal-protein', 'goal-fat'];
    sliders.forEach(id => document.getElementById(id).addEventListener('input', handleMacroSliderChange));
    
    document.getElementById('saveGoalsBtn').onclick = () => {
        const carbs = parseInt(document.getElementById('goal-carbs').value);
        const protein = parseInt(document.getElementById('goal-protein').value);
        const fat = parseInt(document.getElementById('goal-fat').value);
        if (carbs + protein + fat !== 100) {
            showToast("El total de macros debe ser 100%");
            return;
        }
        state.goals = { carbs, protein, fat };
        saveState();
        showToast("Metas guardadas");
    };


    // I/O listeners
    document.getElementById('exportTxtBtn').onclick = exportHistoryAsText;
    document.getElementById('exportJsonBtn').onclick = exportHistoryAsJSON;
    document.getElementById('importJsonInput').onchange = handleFileImport;
    document.getElementById('exportReportBtn').onclick = exportReport;
    
    populateProfileForm();
    populateGoalsForm();
    renderLayout();
    renderSupplements();
	createMobileSearchElements();
	
	const savedCode = localStorage.getItem('acofood_usercode');
		if (savedCode) {
			await loginWithCode(savedCode);
		} else {
			updateUIForLoggedOut();
		}

}

window.addEventListener('load', init);


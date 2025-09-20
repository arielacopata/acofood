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
}
// Login con código
async function loginWithCode(code) {
    userCode = code.toLowerCase();
    localStorage.setItem('acofood_usercode', userCode);
    
    await loadUserData();
    updateUIForLoggedUser();
    showToast(`Acceso con código: ${code}`);
}

// Cargar datos del usuario desde Supabase
async function loadUserData() {
    if (!userCode || !supabase) return;
    
    try {
        // Cargar perfil del usuario
        const { data: profile } = await supabase
            .from('user_data')
            .select('*')
            .eq('user_code', userCode)
            .eq('data_type', 'profile')
            .single();
        
        if (profile) {
            state.profile = profile.data.profile || {};
            state.goals = profile.data.goals || { carbs: 65, protein: 20, fat: 15 };
        }
        
        // Cargar historial del día actual
        const { data: history } = await supabase
            .from('user_data')
            .select('*')
            .eq('user_code', userCode)
            .eq('data_type', 'daily')
            .eq('date', todayKey)
            .single();
        
        if (history) {
            state.history = history.data.history || [];
            dailyTotals = history.data.totals || {};
            state.b12Taken = history.data.b12Taken || false;
            state.b12DailyTask = history.data.b12DailyTask || false;
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



// Configuración Supabase
// Configuración Supabase (con timing fix)
let supabase = null;
// Variables de estado de usuario
let userCode = null;

window.addEventListener('load', function() {
    const SUPABASE_URL = 'https://odqjwkdpqdwgkwztvzoi.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kcWp3a2RwcWR3Z2t3enR2em9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMzkxMjksImV4cCI6MjA3MzkxNTEyOX0.Qp2QHG4ozfzEndhkXlYbUtpHDR_7plMZEAKCnMJbB_Q';
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
});

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

const groupedFoods = [
  {"groupName": "Avena", "emoji": "🍚", "variants": [
    {"id": 1, "name": "Arrollada", "fullName": "Avena (Arrollada)"},
    {"id": 2, "name": "Laminada", "fullName": "Avena (Laminada)"}
  ]},
  {"id": 3, "name": "Banana", "fullName": "Banana", "emoji": "🍌"},
  {"groupName": "Batata / Boniato", "emoji": "🍠", "variants": [
    {"id": 18, "name": "Batata (Al horno)", "fullName": "Batata (Al horno)"},
    {"id": 17, "name": "Batata", "fullName": "Batata (Cocido)"},
    {"id": 16, "name": "Boniato (Al horno)", "fullName": "Boniato (Al horno)"},
    {"id": 15, "name": "Boniato", "fullName": "Boniato (Cocido)"}
  ]},
  {"groupName": "Calabaza", "emoji": "🎃", "variants": [
    {"id": 12, "name": "Cocida", "fullName": "Calabaza (Cocida)"},
    {"id": 14, "name": "Cruda", "fullName": "Calabaza (Cruda)"},
    {"id": 13, "name": "Sopa", "fullName": "Calabaza (Sopa)"}
  ]},
  {"groupName": "Cebolla", "emoji": "🧅", "variants": [
    {"id": 8, "name": "Cocida", "fullName": "Cebolla (Cocida)"},
    {"id": 7, "name": "Cruda", "fullName": "Cebolla (Cruda)"},
    {"id": 9, "name": "Salteada", "fullName": "Cebolla (Salteada)"}
  ]},
  {"groupName": "Garbanzos", "emoji": "🥣", "variants": [
    {"id": 11, "name": "Brotes (germinados)", "fullName": "Garbanzos (Brotes (germinados))"},
    {"id": 10, "name": "Cocidos", "fullName": "Garbanzos (Cocidos)"},
    {"id": 43, "name": "Tostados (pre-hidratados)", "fullName": "Garbanzos (Tostados (pre-hidratados))"}
  ]},
  {"id": 21, "name": "Lechuga", "fullName": "Lechuga", "emoji": "🥬"},
  {"groupName": "Lentejas", "emoji": "🥣", "variants": [
    {"id": 49, "name": "Lenteja (Marrón)", "fullName": "Lenteja (Marrón)"},
    {"id": 50, "name": "Lenteja Roja", "fullName": "Lenteja Roja"},
    {"id": 51, "name": "Lentejón (Lenteja verde)", "fullName": "Lentejón (Lenteja verde)"}
  ]},
  {"id": 5, "name": "Mandarina", "fullName": "Mandarina", "emoji": "🍊"},
  {"id": 48, "name": "Naranja", "fullName": "Naranja", "emoji": "🍊"},
  {"id": 4, "name": "Maní", "fullName": "Maní", "emoji": "🥜"},
  {"id": 52, "name": "Manzana", "fullName": "Manzana", "emoji": "🍎"},
  {"id": 6, "name": "Nueces", "fullName": "Nueces", "emoji": "🌰"},
  {"groupName": "Palta", "emoji": "🥑", "variants": [
    {"id": 22, "name": "Hass", "fullName": "Palta (Hass)"},
    {"id": 42, "name": "Brasilera", "fullName": "Palta (Brasilera)"}
  ]},
  {"groupName": "Papa", "emoji": "🥔", "variants": [
    {"id": 24, "name": "Al horno", "fullName": "Papa (Al horno)"},
    {"id": 23, "name": "Cocida", "fullName": "Papa (Cocida)"}
  ]},
  {"groupName": "Porotos", "emoji": "🥣", "variants": [
    {"id": 44, "name": "Blanco (Alubia)", "fullName": "Poroto Blanco (Alubia)"},
    {"id": 47, "name": "Frutilla (Pinto)", "fullName": "Poroto Frutilla (Pinto)"},
    {"id": 45, "name": "Negro", "fullName": "Poroto Negro"},
    {"id": 46, "name": "Rojo", "fullName": "Poroto Rojo"}
  ]},
  {"id": 20, "name": "Quinoa (Cocida)", "fullName": "Quinoa (Cocida)", "emoji": "🍚"},
  {"groupName": "Remolacha", "emoji": "🍠", "variants": [
    {"id": 28, "name": "Al horno", "fullName": "Remolacha (Al horno)"},
    {"id": 27, "name": "Hervida", "fullName": "Remolacha (Hervida)"},
    {"id": 26, "name": "Rallada", "fullName": "Remolacha (Rallada)"}
  ]},
  {"id": 29, "name": "Rúcula", "fullName": "Rúcula", "emoji": "🌿"},
  {"id": 30, "name": "Semillas de lino", "fullName": "Semillas de lino", "emoji": "🌱"},
  {"id": 41, "name": "Soja texturizada", "fullName": "Soja texturizada", "emoji": "🥣"},
  {"id": 31, "name": "Tomate", "fullName": "Tomate", "emoji": "🍅"},
  {"groupName": "Zanahoria", "emoji": "🥕", "variants": [
    {"id": 25, "name": "Cocida", "fullName": "Zanahoria (Cocida)"},
    {"id": 33, "name": "Entera", "fullName": "Zanahoria (Entera)"},
    {"id": 32, "name": "Rallada", "fullName": "Zanahoria (Rallada)"}
  ]}
];
const nutrientsData = {
  "1": {"Calorías": 371, "Proteínas": 13.1, "Carbohidratos": 68.4, "Fibra": 10.4, "Azúcares totales": 1.2, "Azúcares añadidos": 0, "Grasas totales": 6.8, "Grasas saturadas": 1.2, "Grasas trans": 0, "Calcio": 54, "Hierro": 4.7, "Magnesio": 177, "Fósforo": 523, "Potasio": 550, "Sodio": 2, "Zinc": 4, "Vitamina A": 0, "Vitamina C": 0, "Vitamina D": 0, "Vitamina E": 0.6, "Vitamina K": 1.9, "Vitamina B1 (Tiamina)": 0.8, "Vitamina B2 (Riboflavina)": 0.1, "Vitamina B3 (Niacina)": 0.9, "Vitamina B4 (Colina)": 32.2, "Vitamina B6": 0.1, "Vitamina B9 (Folato)": 38, "Vitamina B12": 0, "Omega-3": 0.11, "Omega-6": 1.7, "Omega-9": 1.6, "Colesterol": 0, "Cafeína": 0},
  "2": {"Calorías": 375, "Proteínas": 13.5, "Carbohidratos": 67.5, "Fibra": 10.1, "Azúcares totales": 0, "Azúcares añadidos": 0, "Grasas totales": 7.5, "Grasas saturadas": 1.4, "Grasas trans": 0, "Calcio": 47, "Hierro": 4.25, "Magnesio": 138, "Fósforo": 410, "Potasio": 370, "Sodio": 6, "Zinc": 3.1, "Vitamina A": 0, "Vitamina C": 0, "Vitamina D": 0, "Vitamina E": 0, "Vitamina K": 0, "Vitamina B1 (Tiamina)": 0.46, "Vitamina B2 (Riboflavina)": 0.15, "Vitamina B3 (Niacina)": 1.125, "Vitamina B4 (Colina)": 0, "Vitamina B6": 0.1, "Vitamina B9 (Folato)": 32, "Vitamina B12": 0, "Omega-3": 0, "Omega-6": 0, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "3": {"Calorías": 89, "Proteínas": 1.09, "Carbohidratos": 22.84, "Fibra": 2.6, "Azúcares totales": 12.23, "Azúcares añadidos": 0, "Grasas totales": 0.33, "Grasas saturadas": 0.112, "Grasas trans": 0, "Calcio": 5, "Hierro": 0.26, "Magnesio": 27, "Fósforo": 22, "Potasio": 358, "Sodio": 1, "Zinc": 0.15, "Vitamina A": 3, "Vitamina C": 8.7, "Vitamina D": 0, "Vitamina E": 0.1, "Vitamina K": 0.5, "Vitamina B1 (Tiamina)": 0.031, "Vitamina B2 (Riboflavina)": 0.073, "Vitamina B3 (Niacina)": 0.665, "Vitamina B4 (Colina)": 9.8, "Vitamina B6": 0.367, "Vitamina B9 (Folato)": 20, "Vitamina B12": 0, "Omega-3": 0.027, "Omega-6": 0.046, "Omega-9": 0.032, "Colesterol": 0, "Cafeína": 0},
  "4": {"Calorías": 587, "Proteínas": 24.35, "Carbohidratos": 21.26, "Fibra": 8, "Azúcares totales": 4.8, "Azúcares añadidos": 0, "Grasas totales": 50.45, "Grasas saturadas": 7.7, "Grasas trans": 0, "Calcio": 62, "Hierro": 2.26, "Magnesio": 176, "Fósforo": 390, "Potasio": 658, "Sodio": 5, "Zinc": 3.31, "Vitamina A": 0, "Vitamina C": 0, "Vitamina D": 0, "Vitamina E": 6.6, "Vitamina K": 0, "Vitamina B1 (Tiamina)": 0.23, "Vitamina B2 (Riboflavina)": 0.1, "Vitamina B3 (Niacina)": 13.53, "Vitamina B4 (Colina)": 55.4, "Vitamina B6": 0.45, "Vitamina B9 (Folato)": 145, "Vitamina B12": 0, "Omega-3": 0, "Omega-6": 15.69, "Omega-9": 25.04, "Colesterol": 0, "Cafeína": 0},
  "5": {"Calorías": 53, "Proteínas": 0.81, "Carbohidratos": 13.34, "Fibra": 1.8, "Azúcares totales": 10.58, "Azúcares añadidos": 0, "Grasas totales": 0.31, "Grasas saturadas": 0.039, "Grasas trans": 0, "Calcio": 37, "Hierro": 0.15, "Magnesio": 12, "Fósforo": 20, "Potasio": 166, "Sodio": 2, "Zinc": 0.07, "Vitamina A": 34, "Vitamina C": 26.7, "Vitamina D": 0, "Vitamina E": 0.2, "Vitamina K": 0, "Vitamina B1 (Tiamina)": 0.058, "Vitamina B2 (Riboflavina)": 0.036, "Vitamina B3 (Niacina)": 0.376, "Vitamina B4 (Colina)": 10.2, "Vitamina B6": 0.078, "Vitamina B9 (Folato)": 16, "Vitamina B12": 0, "Omega-3": 0.012, "Omega-6": 0.065, "Omega-9": 0.053, "Colesterol": 0, "Cafeína": 0},
  "6": {"Calorías": 654, "Proteínas": 15.23, "Carbohidratos": 13.71, "Fibra": 6.7, "Azúcares totales": 2.61, "Azúcares añadidos": 0, "Grasas totales": 65.21, "Grasas saturadas": 6.126, "Grasas trans": 0, "Calcio": 98, "Hierro": 2.91, "Magnesio": 158, "Fósforo": 346, "Potasio": 441, "Sodio": 2, "Zinc": 3.09, "Vitamina A": 1, "Vitamina C": 1.3, "Vitamina D": 0, "Vitamina E": 0.7, "Vitamina K": 2.7, "Vitamina B1 (Tiamina)": 0.341, "Vitamina B2 (Riboflavina)": 0.15, "Vitamina B3 (Niacina)": 1.125, "Vitamina B4 (Colina)": 39.2, "Vitamina B6": 0.537, "Vitamina B9 (Folato)": 98, "Vitamina B12": 0, "Omega-3": 9.08, "Omega-6": 38.09, "Omega-9": 8.79, "Colesterol": 0, "Cafeína": 0},
  "7": {"Calorías": 40, "Proteínas": 1.1, "Carbohidratos": 9.34, "Fibra": 1.7, "Azúcares totales": 4.24, "Azúcares añadidos": 0, "Grasas totales": 0.1, "Grasas saturadas": 0.042, "Grasas trans": 0, "Calcio": 23, "Hierro": 0.21, "Magnesio": 10, "Fósforo": 29, "Potasio": 146, "Sodio": 4, "Zinc": 0.17, "Vitamina A": 0, "Vitamina C": 7.4, "Vitamina D": 0, "Vitamina E": 0.02, "Vitamina K": 0.4, "Vitamina B1 (Tiamina)": 0.046, "Vitamina B2 (Riboflavina)": 0.027, "Vitamina B3 (Niacina)": 0.116, "Vitamina B4 (Colina)": 6.1, "Vitamina B6": 0.12, "Vitamina B9 (Folato)": 19, "Vitamina B12": 0, "Omega-3": 0, "Omega-6": 0.019, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "8": {"Calorías": 44, "Proteínas": 1.36, "Carbohidratos": 10.27, "Fibra": 1.4, "Azúcares totales": 4.73, "Azúcares añadidos": 0, "Grasas totales": 0.19, "Grasas saturadas": 0.046, "Grasas trans": 0, "Calcio": 20, "Hierro": 0.24, "Magnesio": 10, "Fósforo": 33, "Potasio": 157, "Sodio": 3, "Zinc": 0.17, "Vitamina A": 0, "Vitamina C": 4.7, "Vitamina D": 0, "Vitamina E": 0.02, "Vitamina K": 0.4, "Vitamina B1 (Tiamina)": 0.02, "Vitamina B2 (Riboflavina)": 0.02, "Vitamina B3 (Niacina)": 0.1, "Vitamina B4 (Colina)": 6.1, "Vitamina B6": 0.05, "Vitamina B9 (Folato)": 15, "Vitamina B12": 0, "Omega-3": 0, "Omega-6": 0.08, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "9": {"Calorías": 86, "Proteínas": 1.5, "Carbohidratos": 8.7, "Fibra": 2.1, "Azúcares totales": 4.7, "Azúcares añadidos": 0, "Grasas totales": 5.3, "Grasas saturadas": 0.7, "Grasas trans": 0, "Calcio": 33, "Hierro": 0.4, "Magnesio": 13, "Fósforo": 40, "Potasio": 162, "Sodio": 8, "Zinc": 0.2, "Vitamina A": 1, "Vitamina C": 2.8, "Vitamina D": 0, "Vitamina E": 0.6, "Vitamina K": 2.2, "Vitamina B1 (Tiamina)": 0.05, "Vitamina B2 (Riboflavina)": 0.03, "Vitamina B3 (Niacina)": 0.1, "Vitamina B4 (Colina)": 6.3, "Vitamina B6": 0.13, "Vitamina B9 (Folato)": 10, "Vitamina B12": 0, "Omega-3": 0.01, "Omega-6": 0.6, "Omega-9": 3.6, "Colesterol": 0, "Cafeína": 0},
  "10": {"Calorías": 139, "Proteínas": 8.86, "Carbohidratos": 27.42, "Fibra": 7.6, "Azúcares totales": 4.8, "Azúcares añadidos": 0, "Grasas totales": 2.59, "Grasas saturadas": 0.269, "Grasas trans": 0, "Calcio": 49, "Hierro": 2.89, "Magnesio": 48, "Fósforo": 168, "Potasio": 291, "Sodio": 7, "Zinc": 1.53, "Vitamina A": 1, "Vitamina C": 1.3, "Vitamina D": 0, "Vitamina E": 0.35, "Vitamina K": 4, "Vitamina B1 (Tiamina)": 0.116, "Vitamina B2 (Riboflavina)": 0.063, "Vitamina B3 (Niacina)": 0.526, "Vitamina B4 (Colina)": 42.9, "Vitamina B6": 0.139, "Vitamina B9 (Folato)": 172, "Vitamina B12": 0, "Omega-3": 0.041, "Omega-6": 1.155, "Omega-9": 0.702, "Colesterol": 0, "Cafeína": 0},
  "11": {"Calorías": 114, "Proteínas": 8.4, "Carbohidratos": 21.2, "Fibra": 8, "Azúcares totales": 2.9, "Azúcares añadidos": 0, "Grasas totales": 1.1, "Grasas saturadas": 0.1, "Grasas trans": 0, "Calcio": 57, "Hierro": 2.7, "Magnesio": 79, "Fósforo": 252, "Potasio": 440, "Sodio": 11, "Zinc": 1.8, "Vitamina A": 4, "Vitamina C": 12.5, "Vitamina D": 0, "Vitamina E": 0.8, "Vitamina K": 30, "Vitamina B1 (Tiamina)": 0.2, "Vitamina B2 (Riboflavina)": 0.1, "Vitamina B3 (Niacina)": 1.2, "Vitamina B4 (Colina)": 61.2, "Vitamina B6": 0.2, "Vitamina B9 (Folato)": 155, "Vitamina B12": 0, "Omega-3": 0.03, "Omega-6": 0.44, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "12": {"Calorías": 20, "Proteínas": 1.14, "Carbohidratos": 4.41, "Fibra": 1.5, "Azúcares totales": 2.22, "Azúcares añadidos": 0, "Grasas totales": 0.4, "Grasas saturadas": 0.08, "Grasas trans": 0, "Calcio": 21, "Hierro": 0.5, "Magnesio": 22, "Fósforo": 50, "Potasio": 295, "Sodio": 3, "Zinc": 0.36, "Vitamina A": 13, "Vitamina C": 11.3, "Vitamina D": 0, "Vitamina E": 0.12, "Vitamina K": 4.8, "Vitamina B1 (Tiamina)": 0.039, "Vitamina B2 (Riboflavina)": 0.038, "Vitamina B3 (Niacina)": 0.49, "Vitamina B4 (Colina)": 9.5, "Vitamina B6": 0.08, "Vitamina B9 (Folato)": 20, "Vitamina B12": 0, "Omega-3": 0.062, "Omega-6": 0.076, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "13": {"Calorías": 20, "Proteínas": 1.14, "Carbohidratos": 4.41, "Fibra": 1.5, "Azúcares totales": 2.22, "Azúcares añadidos": 0, "Grasas totales": 0.4, "Grasas saturadas": 0.08, "Grasas trans": 0, "Calcio": 21, "Hierro": 0.5, "Magnesio": 22, "Fósforo": 50, "Potasio": 295, "Sodio": 3, "Zinc": 0.36, "Vitamina A": 13, "Vitamina C": 11.3, "Vitamina D": 0, "Vitamina E": 0.12, "Vitamina K": 4.8, "Vitamina B1 (Tiamina)": 0.039, "Vitamina B2 (Riboflavina)": 0.038, "Vitamina B3 (Niacina)": 0.49, "Vitamina B4 (Colina)": 9.5, "Vitamina B6": 0.08, "Vitamina B9 (Folato)": 20, "Vitamina B12": 0, "Omega-3": 0.062, "Omega-6": 0.076, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "14": {"Calorías": 16, "Proteínas": 1.21, "Carbohidratos": 3.11, "Fibra": 1, "Azúcares totales": 2.5, "Azúcares añadidos": 0, "Grasas totales": 0.32, "Grasas saturadas": 0.083, "Grasas trans": 0, "Calcio": 16, "Hierro": 0.37, "Magnesio": 18, "Fósforo": 38, "Potasio": 261, "Sodio": 8, "Zinc": 0.29, "Vitamina A": 10, "Vitamina C": 17.9, "Vitamina D": 0, "Vitamina E": 0.12, "Vitamina K": 4.3, "Vitamina B1 (Tiamina)": 0.045, "Vitamina B2 (Riboflavina)": 0.094, "Vitamina B3 (Niacina)": 0.451, "Vitamina B4 (Colina)": 9.5, "Vitamina B6": 0.163, "Vitamina B9 (Folato)": 24, "Vitamina B12": 0, "Omega-3": 0.062, "Omega-6": 0.076, "Omega-9": 0.038, "Colesterol": 0, "Cafeína": 0},
  "15": {"Calorías": 86, "Proteínas": 1.57, "Carbohidratos": 20.12, "Fibra": 3, "Azúcares totales": 4.18, "Azúcares añadidos": 0, "Grasas totales": 0.05, "Grasas saturadas": 0.018, "Grasas trans": 0, "Calcio": 30, "Hierro": 0.61, "Magnesio": 25, "Fósforo": 47, "Potasio": 337, "Sodio": 55, "Zinc": 0.3, "Vitamina A": 4, "Vitamina C": 2.4, "Vitamina D": 0, "Vitamina E": 0.26, "Vitamina K": 1.8, "Vitamina B1 (Tiamina)": 0.078, "Vitamina B2 (Riboflavina)": 0.061, "Vitamina B3 (Niacina)": 0.557, "Vitamina B4 (Colina)": 12.3, "Vitamina B6": 0.209, "Vitamina B9 (Folato)": 11, "Vitamina B12": 0, "Omega-3": 0, "Omega-6": 0, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "16": {"Calorías": 94, "Proteínas": 1.6, "Carbohidratos": 22.5, "Fibra": 3.1, "Azúcares totales": 4.5, "Azúcares añadidos": 0, "Grasas totales": 0.1, "Grasas saturadas": 0.02, "Grasas trans": 0, "Calcio": 33, "Hierro": 0.65, "Magnesio": 27, "Fósforo": 50, "Potasio": 355, "Sodio": 60, "Zinc": 0.33, "Vitamina A": 4, "Vitamina C": 2.6, "Vitamina D": 0, "Vitamina E": 0.28, "Vitamina K": 2, "Vitamina B1 (Tiamina)": 0.08, "Vitamina B2 (Riboflavina)": 0.06, "Vitamina B3 (Niacina)": 0.6, "Vitamina B4 (Colina)": 12.5, "Vitamina B6": 0.22, "Vitamina B9 (Folato)": 12, "Vitamina B12": 0, "Omega-3": 0, "Omega-6": 0, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "17": {"Calorías": 76, "Proteínas": 1.37, "Carbohidratos": 17.7, "Fibra": 2.5, "Azúcares totales": 5.74, "Azúcares añadidos": 0, "Grasas totales": 0.14, "Grasas saturadas": 0.02, "Grasas trans": 0, "Calcio": 27, "Hierro": 0.69, "Magnesio": 18, "Fósforo": 32, "Potasio": 230, "Sodio": 27, "Zinc": 0.22, "Vitamina A": 787, "Vitamina C": 12.8, "Vitamina D": 0, "Vitamina E": 0.7, "Vitamina K": 2.1, "Vitamina B1 (Tiamina)": 0.057, "Vitamina B2 (Riboflavina)": 0.05, "Vitamina B3 (Niacina)": 0.53, "Vitamina B4 (Colina)": 11.2, "Vitamina B6": 0.165, "Vitamina B9 (Folato)": 6, "Vitamina B12": 0, "Omega-3": 0, "Omega-6": 0, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "18": {"Calorías": 90, "Proteínas": 2.01, "Carbohidratos": 20.71, "Fibra": 3.3, "Azúcares totales": 6.48, "Azúcares añadidos": 0, "Grasas totales": 0.15, "Grasas saturadas": 0.05, "Grasas trans": 0, "Calcio": 38, "Hierro": 0.69, "Magnesio": 27, "Fósforo": 54, "Potasio": 475, "Sodio": 36, "Zinc": 0.32, "Vitamina A": 961, "Vitamina C": 19.6, "Vitamina D": 0, "Vitamina E": 0.71, "Vitamina K": 2.3, "Vitamina B1 (Tiamina)": 0.107, "Vitamina B2 (Riboflavina)": 0.106, "Vitamina B3 (Niacina)": 1.487, "Vitamina B4 (Colina)": 13.1, "Vitamina B6": 0.286, "Vitamina B9 (Folato)": 14, "Vitamina B12": 0, "Omega-3": 0, "Omega-6": 0, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "20": {"Calorías": 120, "Proteínas": 4.4, "Carbohidratos": 21.3, "Fibra": 2.8, "Azúcares totales": 0.9, "Azúcares añadidos": 0, "Grasas totales": 1.9, "Grasas saturadas": 0.23, "Grasas trans": 0, "Calcio": 17, "Hierro": 1.5, "Magnesio": 64, "Fósforo": 152, "Potasio": 172, "Sodio": 7, "Zinc": 1.1, "Vitamina A": 1, "Vitamina C": 0, "Vitamina D": 0, "Vitamina E": 0.6, "Vitamina K": 0, "Vitamina B1 (Tiamina)": 0.107, "Vitamina B2 (Riboflavina)": 0.11, "Vitamina B3 (Niacina)": 0.41, "Vitamina B4 (Colina)": 23, "Vitamina B6": 0.123, "Vitamina B9 (Folato)": 42, "Vitamina B12": 0, "Omega-3": 0.085, "Omega-6": 0.97, "Omega-9": 0.49, "Colesterol": 0, "Cafeína": 0},
  "21": {"Calorías": 17, "Proteínas": 1.23, "Carbohidratos": 3.29, "Fibra": 2.1, "Azúcares totales": 1.19, "Azúcares añadidos": 0, "Grasas totales": 0.3, "Grasas saturadas": 0.038, "Grasas trans": 0, "Calcio": 33, "Hierro": 0.97, "Magnesio": 14, "Fósforo": 30, "Potasio": 247, "Sodio": 8, "Zinc": 0.23, "Vitamina A": 436, "Vitamina C": 4, "Vitamina D": 0, "Vitamina E": 0.13, "Vitamina K": 102.5, "Vitamina B1 (Tiamina)": 0.072, "Vitamina B2 (Riboflavina)": 0.067, "Vitamina B3 (Niacina)": 0.313, "Vitamina B4 (Colina)": 9.3, "Vitamina B6": 0.074, "Vitamina B9 (Folato)": 136, "Vitamina B12": 0, "Omega-3": 0.048, "Omega-6": 0.05, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "22": {"Calorías": 160, "Proteínas": 2, "Carbohidratos": 8.53, "Fibra": 6.7, "Azúcares totales": 0.66, "Azúcares añadidos": 0, "Grasas totales": 14.66, "Grasas saturadas": 2.13, "Grasas trans": 0, "Calcio": 12, "Hierro": 0.55, "Magnesio": 29, "Fósforo": 52, "Potasio": 485, "Sodio": 7, "Zinc": 0.64, "Vitamina A": 7, "Vitamina C": 10, "Vitamina D": 0, "Vitamina E": 2.07, "Vitamina K": 21, "Vitamina B1 (Tiamina)": 0.067, "Vitamina B2 (Riboflavina)": 0.13, "Vitamina B3 (Niacina)": 1.738, "Vitamina B4 (Colina)": 14.2, "Vitamina B6": 0.257, "Vitamina B9 (Folato)": 81, "Vitamina B12": 0, "Omega-3": 0.111, "Omega-6": 1.68, "Omega-9": 9.8, "Colesterol": 0, "Cafeína": 0},
  "23": {"Calorías": 87, "Proteínas": 1.87, "Carbohidratos": 20.13, "Fibra": 1.8, "Azúcares totales": 0.82, "Azúcares añadidos": 0, "Grasas totales": 0.1, "Grasas saturadas": 0.026, "Grasas trans": 0, "Calcio": 8, "Hierro": 0.52, "Magnesio": 22, "Fósforo": 54, "Potasio": 379, "Sodio": 5, "Zinc": 0.3, "Vitamina A": 0, "Vitamina C": 13.1, "Vitamina D": 0, "Vitamina E": 0.01, "Vitamina K": 2.1, "Vitamina B1 (Tiamina)": 0.081, "Vitamina B2 (Riboflavina)": 0.042, "Vitamina B3 (Niacina)": 1.32, "Vitamina B4 (Colina)": 13.5, "Vitamina B6": 0.27, "Vitamina B9 (Folato)": 10, "Vitamina B12": 0, "Omega-3": 0.01, "Omega-6": 0.036, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "24": {"Calorías": 93, "Proteínas": 2.5, "Carbohidratos": 21.15, "Fibra": 2.2, "Azúcares totales": 1.18, "Azúcares añadidos": 0, "Grasas totales": 0.13, "Grasas saturadas": 0.033, "Grasas trans": 0, "Calcio": 12, "Hierro": 0.78, "Magnesio": 28, "Fósforo": 70, "Potasio": 535, "Sodio": 6, "Zinc": 0.36, "Vitamina A": 1, "Vitamina C": 19.7, "Vitamina D": 0, "Vitamina E": 0.01, "Vitamina K": 1.9, "Vitamina B1 (Tiamina)": 0.08, "Vitamina B2 (Riboflavina)": 0.03, "Vitamina B3 (Niacina)": 1.55, "Vitamina B4 (Colina)": 14.8, "Vitamina B6": 0.3, "Vitamina B9 (Folato)": 28, "Vitamina B12": 0, "Omega-3": 0.012, "Omega-6": 0.043, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "25": {"Calorías": 35, "Proteínas": 0.76, "Carbohidratos": 8.22, "Fibra": 3, "Azúcares totales": 3.45, "Azúcares añadidos": 0, "Grasas totales": 0.18, "Grasas saturadas": 0.029, "Grasas trans": 0, "Calcio": 27, "Hierro": 0.38, "Magnesio": 11, "Fósforo": 30, "Potasio": 235, "Sodio": 240, "Zinc": 0.19, "Vitamina A": 852, "Vitamina C": 3.6, "Vitamina D": 0, "Vitamina E": 0.45, "Vitamina K": 14.4, "Vitamina B1 (Tiamina)": 0.017, "Vitamina B2 (Riboflavina)": 0.04, "Vitamina B3 (Niacina)": 0.64, "Vitamina B4 (Colina)": 8.9, "Vitamina B6": 0.15, "Vitamina B9 (Folato)": 7, "Vitamina B12": 0, "Omega-3": 0, "Omega-6": 0.07, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "26": {"Calorías": 43, "Proteínas": 1.61, "Carbohidratos": 9.56, "Fibra": 2.8, "Azúcares totales": 6.76, "Azúcares añadidos": 0, "Grasas totales": 0.17, "Grasas saturadas": 0.027, "Grasas trans": 0, "Calcio": 16, "Hierro": 0.8, "Magnesio": 23, "Fósforo": 40, "Potasio": 325, "Sodio": 78, "Zinc": 0.35, "Vitamina A": 2, "Vitamina C": 4.9, "Vitamina D": 0, "Vitamina E": 0.04, "Vitamina K": 0.2, "Vitamina B1 (Tiamina)": 0.031, "Vitamina B2 (Riboflavina)": 0.04, "Vitamina B3 (Niacina)": 0.334, "Vitamina B4 (Colina)": 6, "Vitamina B6": 0.067, "Vitamina B9 (Folato)": 109, "Vitamina B12": 0, "Omega-3": 0.003, "Omega-6": 0.063, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "27": {"Calorías": 44, "Proteínas": 1.68, "Carbohidratos": 9.96, "Fibra": 2, "Azúcares totales": 7.96, "Azúcares añadidos": 0, "Grasas totales": 0.18, "Grasas saturadas": 0.028, "Grasas trans": 0, "Calcio": 16, "Hierro": 0.79, "Magnesio": 23, "Fósforo": 38, "Potasio": 305, "Sodio": 213, "Zinc": 0.35, "Vitamina A": 2, "Vitamina C": 3.6, "Vitamina D": 0, "Vitamina E": 0.04, "Vitamina K": 0.2, "Vitamina B1 (Tiamina)": 0.027, "Vitamina B2 (Riboflavina)": 0.04, "Vitamina B3 (Niacina)": 0.331, "Vitamina B4 (Colina)": 6.3, "Vitamina B6": 0.067, "Vitamina B9 (Folato)": 80, "Vitamina B12": 0, "Omega-3": 0, "Omega-6": 0, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "28": {"Calorías": 52, "Proteínas": 2.1, "Carbohidratos": 11.5, "Fibra": 3.4, "Azúcares totales": 8.1, "Azúcares añadidos": 0, "Grasas totales": 0.2, "Grasas saturadas": 0.03, "Grasas trans": 0, "Calcio": 18, "Hierro": 0.9, "Magnesio": 25, "Fósforo": 45, "Potasio": 350, "Sodio": 88, "Zinc": 0.4, "Vitamina A": 2, "Vitamina C": 4.5, "Vitamina D": 0, "Vitamina E": 0.1, "Vitamina K": 0.2, "Vitamina B1 (Tiamina)": 0.03, "Vitamina B2 (Riboflavina)": 0.05, "Vitamina B3 (Niacina)": 0.4, "Vitamina B4 (Colina)": 6.1, "Vitamina B6": 0.07, "Vitamina B9 (Folato)": 115, "Vitamina B12": 0, "Omega-3": 0, "Omega-6": 0, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "29": {"Calorías": 25, "Proteínas": 2.58, "Carbohidratos": 3.65, "Fibra": 1.6, "Azúcares totales": 2.05, "Azúcares añadidos": 0, "Grasas totales": 0.66, "Grasas saturadas": 0.086, "Grasas trans": 0, "Calcio": 160, "Hierro": 1.46, "Magnesio": 47, "Fósforo": 52, "Potasio": 369, "Sodio": 27, "Zinc": 0.47, "Vitamina A": 119, "Vitamina C": 15, "Vitamina D": 0, "Vitamina E": 0.43, "Vitamina K": 108.6, "Vitamina B1 (Tiamina)": 0.044, "Vitamina B2 (Riboflavina)": 0.086, "Vitamina B3 (Niacina)": 0.305, "Vitamina B4 (Colina)": 15.3, "Vitamina B6": 0.073, "Vitamina B9 (Folato)": 97, "Vitamina B12": 0, "Omega-3": 0.17, "Omega-6": 0.13, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "30": {"Calorías": 534, "Proteínas": 18.29, "Carbohidratos": 28.88, "Fibra": 27.3, "Azúcares totales": 1.55, "Azúcares añadidos": 0, "Grasas totales": 42.16, "Grasas saturadas": 3.66, "Grasas trans": 0, "Calcio": 255, "Hierro": 5.73, "Magnesio": 392, "Fósforo": 642, "Potasio": 813, "Sodio": 30, "Zinc": 4.34, "Vitamina A": 0, "Vitamina C": 0.6, "Vitamina D": 0, "Vitamina E": 0.31, "Vitamina K": 4.3, "Vitamina B1 (Tiamina)": 1.644, "Vitamina B2 (Riboflavina)": 0.161, "Vitamina B3 (Niacina)": 3.08, "Vitamina B4 (Colina)": 78.7, "Vitamina B6": 0.473, "Vitamina B9 (Folato)": 87, "Vitamina B12": 0, "Omega-3": 22.81, "Omega-6": 5.9, "Omega-9": 7.53, "Colesterol": 0, "Cafeína": 0},
  "31": {"Calorías": 18, "Proteínas": 0.88, "Carbohidratos": 3.89, "Fibra": 1.2, "Azúcares totales": 2.63, "Azúcares añadidos": 0, "Grasas totales": 0.2, "Grasas saturadas": 0.028, "Grasas trans": 0, "Calcio": 10, "Hierro": 0.27, "Magnesio": 11, "Fósforo": 24, "Potasio": 237, "Sodio": 5, "Zinc": 0.17, "Vitamina A": 42, "Vitamina C": 13.7, "Vitamina D": 0, "Vitamina E": 0.54, "Vitamina K": 7.9, "Vitamina B1 (Tiamina)": 0.037, "Vitamina B2 (Riboflavina)": 0.019, "Vitamina B3 (Niacina)": 0.594, "Vitamina B4 (Colina)": 6.7, "Vitamina B6": 0.08, "Vitamina B9 (Folato)": 15, "Vitamina B12": 0, "Omega-3": 0.003, "Omega-6": 0.089, "Omega-9": 0.04, "Colesterol": 0, "Cafeína": 0},
  "32": {"Calorías": 41, "Proteínas": 0.93, "Carbohidratos": 9.58, "Fibra": 2.8, "Azúcares totales": 4.74, "Azúcares añadidos": 0, "Grasas totales": 0.24, "Grasas saturadas": 0.037, "Grasas trans": 0, "Calcio": 33, "Hierro": 0.3, "Magnesio": 12, "Fósforo": 35, "Potasio": 320, "Sodio": 69, "Zinc": 0.24, "Vitamina A": 835, "Vitamina C": 5.9, "Vitamina D": 0, "Vitamina E": 0.66, "Vitamina K": 13.2, "Vitamina B1 (Tiamina)": 0.066, "Vitamina B2 (Riboflavina)": 0.058, "Vitamina B3 (Niacina)": 0.983, "Vitamina B4 (Colina)": 8.8, "Vitamina B6": 0.138, "Vitamina B9 (Folato)": 19, "Vitamina B12": 0, "Omega-3": 0, "Omega-6": 0.1, "Omega-9": 0.012, "Colesterol": 0, "Cafeína": 0},
  "33": {"Calorías": 41, "Proteínas": 0.93, "Carbohidratos": 9.58, "Fibra": 2.8, "Azúcares totales": 4.74, "Azúcares añadidos": 0, "Grasas totales": 0.24, "Grasas saturadas": 0.037, "Grasas trans": 0, "Calcio": 33, "Hierro": 0.3, "Magnesio": 12, "Fósforo": 35, "Potasio": 320, "Sodio": 69, "Zinc": 0.24, "Vitamina A": 835, "Vitamina C": 5.9, "Vitamina D": 0, "Vitamina E": 0.66, "Vitamina K": 13.2, "Vitamina B1 (Tiamina)": 0.066, "Vitamina B2 (Riboflavina)": 0.058, "Vitamina B3 (Niacina)": 0.983, "Vitamina B4 (Colina)": 8.8, "Vitamina B6": 0.138, "Vitamina B9 (Folato)": 19, "Vitamina B12": 0, "Omega-3": 0, "Omega-6": 0.1, "Omega-9": 0.012, "Colesterol": 0, "Cafeína": 0},
  "41": {"Calorías": 327, "Proteínas": 51.46, "Carbohidratos": 33.92, "Fibra": 17.5, "Azúcares totales": 0, "Azúcares añadidos": 0, "Grasas totales": 0.52, "Grasas saturadas": 0.076, "Grasas trans": 0, "Calcio": 241, "Hierro": 9.24, "Magnesio": 247, "Fósforo": 674, "Potasio": 2384, "Sodio": 4, "Zinc": 2.13, "Vitamina A": 0, "Vitamina C": 0, "Vitamina D": 0, "Vitamina E": 0, "Vitamina K": 37, "Vitamina B1 (Tiamina)": 1.05, "Vitamina B2 (Riboflavina)": 0.23, "Vitamina B3 (Niacina)": 2.5, "Vitamina B4 (Colina)": 196.2, "Vitamina B6": 0.56, "Vitamina B9 (Folato)": 370, "Vitamina B12": 0, "Omega-3": 0.17, "Omega-6": 1.8, "Omega-9": 0.5, "Colesterol": 0, "Cafeína": 0},
  "42": {"Calorías": 120, "Proteínas": 1.96, "Carbohidratos": 8.64, "Fibra": 5.3, "Azúcares totales": 0.3, "Azúcares añadidos": 0, "Grasas totales": 9.92, "Grasas saturadas": 2.49, "Grasas trans": 0, "Calcio": 13, "Hierro": 0.61, "Magnesio": 39, "Fósforo": 54, "Potasio": 690, "Sodio": 22, "Zinc": 0.68, "Vitamina A": 7, "Vitamina C": 17.1, "Vitamina D": 0, "Vitamina E": 2.66, "Vitamina K": 21.6, "Vitamina B1 (Tiamina)": 0.081, "Vitamina B2 (Riboflavina)": 0.162, "Vitamina B3 (Niacina)": 2.112, "Vitamina B4 (Colina)": 14.5, "Vitamina B6": 0.316, "Vitamina B9 (Folato)": 90, "Vitamina B12": 0, "Omega-3": 0.12, "Omega-6": 1.2, "Omega-9": 6.1, "Colesterol": 0, "Cafeína": 0},
  "43": {"Calorías": 408, "Proteínas": 20.8, "Carbohidratos": 64.2, "Fibra": 16.2, "Azúcares totales": 11.2, "Azúcares añadidos": 0, "Grasas totales": 7.18, "Grasas saturadas": 0.77, "Grasas trans": 0, "Calcio": 102, "Hierro": 4.31, "Magnesio": 110, "Fósforo": 332, "Potasio": 816, "Sodio": 26, "Zinc": 3, "Vitamina A": 5, "Vitamina C": 4.1, "Vitamina D": 0, "Vitamina E": 0.8, "Vitamina K": 9.1, "Vitamina B1 (Tiamina)": 0.21, "Vitamina B2 (Riboflavina)": 0.12, "Vitamina B3 (Niacina)": 1.3, "Vitamina B4 (Colina)": 82.3, "Vitamina B6": 0.4, "Vitamina B9 (Folato)": 360, "Vitamina B12": 0, "Omega-3": 0.1, "Omega-6": 3.1, "Omega-9": 1.9, "Colesterol": 0, "Cafeína": 0},
  "44": {"Calorías": 143, "Proteínas": 9.5, "Carbohidratos": 26.22, "Fibra": 7, "Azúcares totales": 0.3, "Azúcares añadidos": 0, "Grasas totales": 0.54, "Grasas saturadas": 0.07, "Grasas trans": 0, "Calcio": 63, "Hierro": 3.71, "Magnesio": 70, "Fósforo": 201, "Potasio": 561, "Sodio": 1, "Zinc": 0.99, "Vitamina A": 0, "Vitamina C": 0.9, "Vitamina D": 0, "Vitamina E": 0.02, "Vitamina K": 3.9, "Vitamina B1 (Tiamina)": 0.176, "Vitamina B2 (Riboflavina)": 0.06, "Vitamina B3 (Niacina)": 0.5, "Vitamina B4 (Colina)": 45.1, "Vitamina B6": 0.225, "Vitamina B9 (Folato)": 177, "Vitamina B12": 0, "Omega-3": 0.155, "Omega-6": 0.122, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "45": {"Calorías": 132, "Proteínas": 8.86, "Carbohidratos": 23.71, "Fibra": 8.7, "Azúcares totales": 0.3, "Azúcares añadidos": 0, "Grasas totales": 0.54, "Grasas saturadas": 0.14, "Grasas trans": 0, "Calcio": 27, "Hierro": 2.1, "Magnesio": 70, "Fósforo": 140, "Potasio": 354, "Sodio": 1, "Zinc": 0.96, "Vitamina A": 0, "Vitamina C": 0, "Vitamina D": 0, "Vitamina E": 0, "Vitamina K": 2.8, "Vitamina B1 (Tiamina)": 0.171, "Vitamina B2 (Riboflavina)": 0.06, "Vitamina B3 (Niacina)": 0.5, "Vitamina B4 (Colina)": 36.5, "Vitamina B6": 0.1, "Vitamina B9 (Folato)": 149, "Vitamina B12": 0, "Omega-3": 0.11, "Omega-6": 0.13, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "46": {"Calorías": 127, "Proteínas": 8.67, "Carbohidratos": 22.8, "Fibra": 6.4, "Azúcares totales": 0.3, "Azúcares añadidos": 0, "Grasas totales": 0.5, "Grasas saturadas": 0.066, "Grasas trans": 0, "Calcio": 35, "Hierro": 2.22, "Magnesio": 45, "Fósforo": 142, "Potasio": 405, "Sodio": 1, "Zinc": 0.99, "Vitamina A": 0, "Vitamina C": 0.3, "Vitamina D": 0, "Vitamina E": 0.01, "Vitamina K": 3.6, "Vitamina B1 (Tiamina)": 0.155, "Vitamina B2 (Riboflavina)": 0.057, "Vitamina B3 (Niacina)": 0.579, "Vitamina B4 (Colina)": 36, "Vitamina B6": 0.12, "Vitamina B9 (Folato)": 130, "Vitamina B12": 0, "Omega-3": 0.14, "Omega-6": 0.12, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "47": {"Calorías": 143, "Proteínas": 9.01, "Carbohidratos": 26.22, "Fibra": 9, "Azúcares totales": 0.29, "Azúcares añadidos": 0, "Grasas totales": 0.65, "Grasas saturadas": 0.093, "Grasas trans": 0, "Calcio": 51, "Hierro": 2.09, "Magnesio": 50, "Fósforo": 176, "Potasio": 436, "Sodio": 1, "Zinc": 0.82, "Vitamina A": 0, "Vitamina C": 0.5, "Vitamina D": 0, "Vitamina E": 0, "Vitamina K": 2.1, "Vitamina B1 (Tiamina)": 0.193, "Vitamina B2 (Riboflavina)": 0.061, "Vitamina B3 (Niacina)": 0.245, "Vitamina B4 (Colina)": 57, "Vitamina B6": 0.222, "Vitamina B9 (Folato)": 177, "Vitamina B12": 0, "Omega-3": 0.13, "Omega-6": 0.16, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "48": {"Calorías": 47, "Proteínas": 0.94, "Carbohidratos": 11.75, "Fibra": 2.4, "Azúcares totales": 9.35, "Azúcares añadidos": 0, "Grasas totales": 0.12, "Grasas saturadas": 0.015, "Grasas trans": 0, "Calcio": 40, "Hierro": 0.10, "Magnesio": 10, "Fósforo": 14, "Potasio": 181, "Sodio": 0, "Zinc": 0.07, "Vitamina A": 11, "Vitamina C": 53.2, "Vitamina D": 0, "Vitamina E": 0.18, "Vitamina K": 0, "Vitamina B1 (Tiamina)": 0.087, "Vitamina B2 (Riboflavina)": 0.040, "Vitamina B3 (Niacina)": 0.282, "Vitamina B4 (Colina)": 8.4, "Vitamina B6": 0.060, "Vitamina B9 (Folato)": 30, "Vitamina B12": 0, "Omega-3": 0.007, "Omega-6": 0.018, "Omega-9": 0.023, "Colesterol": 0, "Cafeína": 0},
  "49": {"Calorías": 116, "Proteínas": 9.02, "Carbohidratos": 20.13, "Fibra": 7.9, "Azúcares totales": 0.18, "Azúcares añadidos": 0, "Grasas totales": 0.38, "Grasas saturadas": 0.051, "Grasas trans": 0, "Calcio": 19, "Hierro": 3.33, "Magnesio": 36, "Fósforo": 180, "Potasio": 369, "Sodio": 2, "Zinc": 1.27, "Vitamina A": 0, "Vitamina C": 1.5, "Vitamina D": 0, "Vitamina E": 0.11, "Vitamina K": 1.7, "Vitamina B1 (Tiamina)": 0.169, "Vitamina B2 (Riboflavina)": 0.073, "Vitamina B3 (Niacina)": 1.06, "Vitamina B4 (Colina)": 24.3, "Vitamina B6": 0.178, "Vitamina B9 (Folato)": 181, "Vitamina B12": 0, "Omega-3": 0.05, "Omega-6": 0.12, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "50": {"Calorías": 108, "Proteínas": 7.58, "Carbohidratos": 19.14, "Fibra": 4.2, "Azúcares totales": 0.2, "Azúcares añadidos": 0, "Grasas totales": 0.53, "Grasas saturadas": 0.07, "Grasas trans": 0, "Calcio": 20, "Hierro": 2.13, "Magnesio": 30, "Fósforo": 130, "Potasio": 274, "Sodio": 169, "Zinc": 1, "Vitamina A": 0, "Vitamina C": 0.8, "Vitamina D": 0, "Vitamina E": 0.1, "Vitamina K": 1.2, "Vitamina B1 (Tiamina)": 0.11, "Vitamina B2 (Riboflavina)": 0.06, "Vitamina B3 (Niacina)": 0.7, "Vitamina B4 (Colina)": 20.1, "Vitamina B6": 0.14, "Vitamina B9 (Folato)": 101, "Vitamina B12": 0, "Omega-3": 0, "Omega-6": 0, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "51": {"Calorías": 127, "Proteínas": 8.84, "Carbohidratos": 22.1, "Fibra": 10.7, "Azúcares totales": 0.2, "Azúcares añadidos": 0, "Grasas totales": 0.53, "Grasas saturadas": 0.07, "Grasas trans": 0, "Calcio": 24, "Hierro": 3.52, "Magnesio": 43, "Fósforo": 214, "Potasio": 451, "Sodio": 284, "Zinc": 1.34, "Vitamina A": 2, "Vitamina C": 1.8, "Vitamina D": 0, "Vitamina E": 0.1, "Vitamina K": 2, "Vitamina B1 (Tiamina)": 0.17, "Vitamina B2 (Riboflavina)": 0.08, "Vitamina B3 (Niacina)": 1.1, "Vitamina B4 (Colina)": 25.1, "Vitamina B6": 0.19, "Vitamina B9 (Folato)": 188, "Vitamina B12": 0, "Omega-3": 0, "Omega-6": 0, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  "52": {"Calorías": 52, "Proteínas": 0.26, "Carbohidratos": 13.81, "Fibra": 2.4, "Azúcares totales": 10.39, "Azúcares añadidos": 0, "Grasas totales": 0.17, "Grasas saturadas": 0.028, "Grasas trans": 0, "Calcio": 6, "Hierro": 0.12, "Magnesio": 5, "Fósforo": 11, "Potasio": 107, "Sodio": 1, "Zinc": 0.04, "Vitamina A": 3, "Vitamina C": 4.6, "Vitamina D": 0, "Vitamina E": 0.18, "Vitamina K": 2.2, "Vitamina B1 (Tiamina)": 0.017, "Vitamina B2 (Riboflavina)": 0.026, "Vitamina B3 (Niacina)": 0.091, "Vitamina B4 (Colina)": 3.4, "Vitamina B6": 0.041, "Vitamina B9 (Folato)": 3, "Vitamina B12": 0, "Omega-3": 0.009, "Omega-6": 0.043, "Omega-9": 0, "Colesterol": 0, "Cafeína": 0},
  
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
    const filteredFoods = foodsToRender.filter(f => 
        (f.groupName || f.name).toLowerCase().includes(filterLower)
    );
    
    let allResults = [...filteredFoods];
    
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
    
    // Add B12 daily task if not completed
    if (!state.b12DailyTask) {
        const taskCard = document.createElement('div');
        taskCard.className = 'card btn wide-tasks';
        taskCard.innerHTML = `<div class="emoji">💊</div><div>Vitamina B12 - Tarea diaria</div>`;
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
    
    const filteredFoods = foodsToRender.filter(f => (f.groupName || f.name).toLowerCase().includes(filterLower));
    filteredFoods.forEach(f => {
        const card = document.createElement('div');
        card.className = 'card btn';
        const name = f.groupName || f.name;
        const calories = f.variants ? nutrientsData[f.variants[0].id]?.Calorías : nutrientsData[f.id]?.Calorías;
        const calText = calories ? `<div class="sub">(${calories.toFixed(0)} kcal/100g)</div>` : '';
        card.innerHTML = `<div class="emoji">${f.emoji}</div><div>${name}${calText}</div>`;
        card.addEventListener('click', () => handleFoodClick(f));
        grid.appendChild(card);
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
    
    const microScore = Math.min(((dailyTotals['Fibra'] || 0) / 30) * 100, 100);

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

document.addEventListener('DOMContentLoaded', init);


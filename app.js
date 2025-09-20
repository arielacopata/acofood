// --- Lista hardcoded local ---
const offlineList = [
  { nombre: "Avena", kcal: 370 },
  { nombre: "Banana", kcal: 89 },
  { nombre: "Maní", kcal: 585 },
  { nombre: "Nueces", kcal: 654 },
  { nombre: "Rúcula", kcal: 25 }
];

// --- Normalización acentos ---
function normalizeAccents(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-\u036f]/g, "")
    .toLowerCase();
}

// --- Render de resultados ---
function renderResults(list) {
  const results = document.getElementById("results");
  results.innerHTML = "";
  list.forEach(item => {
    const div = document.createElement("div");
    div.className = "result-item";
    div.textContent = `${item.nombre} (${item.kcal} kcal/100g)`;
    results.appendChild(div);
  });
}

// --- Búsqueda local ---
function searchOffline(query) {
  return offlineList.filter(x =>
    normalizeAccents(x.nombre).includes(normalizeAccents(query))
  );
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim();
    if (!q) {
      document.getElementById("results").innerHTML = "";
      return;
    }
    const local = searchOffline(q);
    renderResults(local);
  });
});
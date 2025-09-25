// Variáveis globais para categorias e modalidades
let categories = [];
let modalities = [];

// Carregar categorias do Firebase
function loadCategories() {
    return new Promise((resolve, reject) => {
        databaseCategories.ref('Categories').once('value')
            .then(snapshot => {
                categories = [];
                if (snapshot.exists()) {
                    snapshot.forEach(childSnapshot => {
                        const category = {
                            id: childSnapshot.key,
                            ...childSnapshot.val()
                        };
                        categories.push(category);
                    });
                }
                resolve(categories);
            })
            .catch(error => {
                console.error('Erro ao carregar categorias:', error);
                reject(error);
            });
    });
}

// Carregar modalidades do Firebase
function loadModalities() {
    return new Promise((resolve, reject) => {
        databaseCategories.ref('Modalities').once('value')
            .then(snapshot => {
                modalities = [];
                if (snapshot.exists()) {
                    snapshot.forEach(childSnapshot => {
                        const modality = {
                            id: childSnapshot.key,
                            ...childSnapshot.val()
                        };
                        modalities.push(modality);
                    });
                }
                resolve(modalities);
            })
            .catch(error => {
                console.error('Erro ao carregar modalidades:', error);
                reject(error);
            });
    });
}

// Popular dropdown de categorias
function populateCategoriesDropdown(selectElementId) {
    const selectElement = $(`#${selectElementId}`);
    selectElement.empty();
    selectElement.append('<option value="">Selecione uma categoria</option>');
    
    categories.forEach(category => {
        selectElement.append(`<option value="${category.name}">${category.name}</option>`);
    });
}

// Popular dropdown de modalidades
function populateModalitiesDropdown(selectElementId) {
    const selectElement = $(`#${selectElementId}`);
    selectElement.empty();
    selectElement.append('<option value="">Selecione uma modalidade</option>');
    
    modalities.forEach(modality => {
        selectElement.append(`<option value="${modality.name}">${modality.name}</option>`);
    });
}

// Carregar ambos (categorias e modalidades)
function loadCategoriesAndModalities() {
    return Promise.all([
        loadCategories(),
        loadModalities()
    ]);
}

// Inicializar categorias e modalidades quando o documento estiver pronto
$(document).ready(function() {
    loadCategoriesAndModalities()
        .then(() => {
            // Popular os dropdowns nos modais
            populateCategoriesDropdown('category');
            populateModalitiesDropdown('modality');
            populateCategoriesDropdown('edit-category');
            populateModalitiesDropdown('edit-modality');
        })
        .catch(error => {
            console.error('Erro ao carregar categorias e modalidades:', error);
            // Fallback para opções básicas em caso de erro
            const fallbackCategories = ['Sub40', 'Sub50', 'Sub60', '60+', 'Iniciantes', 'Feminino Open'];
            const fallbackModalities = ['MTB', 'Corrida', 'Duathlon', 'Trail Run'];
            
            $('#category, #edit-category').empty().append('<option value="">Selecione uma categoria</option>');
            fallbackCategories.forEach(cat => {
                $('#category, #edit-category').append(`<option value="${cat}">${cat}</option>`);
            });
            
            $('#modality, #edit-modality').empty().append('<option value="">Selecione uma modalidade</option>');
            fallbackModalities.forEach(mod => {
                $('#modality, #edit-modality').append(`<option value="${mod}">${mod}</option>`);
            });
        });
});
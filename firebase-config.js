// Configuração do Firebase - Ranking Ubatuba de Ciclismo
const firebaseConfigRUC = {
    apiKey: "AIzaSyAwkcOWdZf46_TZQlHE2N_k0C0wVbmqKks",
    authDomain: "rankingubatubadeciclismo.firebaseapp.com",
    databaseURL: "https://rankingubatubadeciclismo-default-rtdb.firebaseio.com",
    projectId: "rankingubatubadeciclismo",
    storageBucket: "rankingubatubadeciclismo.firebasestorage.app",
    messagingSenderId: "164808638910",
    appId: "1:164808638910:web:0278c92e92872f038939ef"
};

// Configuração do Firebase - Categorias e Modalidades
const firebaseConfigCategories = {
    apiKey: "AIzaSyAU0QLF33-nwVIyBMfQXZ9GCSR-NfnL-PQ",
    authDomain: "categorias-e-modalidades-ruc.firebaseapp.com",
    databaseURL: "https://categorias-e-modalidades-ruc-default-rtdb.firebaseio.com",
    projectId: "categorias-e-modalidades-ruc",
    storageBucket: "categorias-e-modalidades-ruc.firebasestorage.app",
    messagingSenderId: "380980931865",
    appId: "1:380980931865:web:d6cdf06f5eec1b2bd5e988"
};

// Inicialização do Firebase principal (RUC)
const appRUC = firebase.initializeApp(firebaseConfigRUC, 'primary');
const auth = appRUC.auth();
const database = appRUC.database();

// Inicialização do Firebase secundário (Categorias e Modalidades)
const appCategories = firebase.initializeApp(firebaseConfigCategories, 'secondary');
const databaseCategories = appCategories.database();
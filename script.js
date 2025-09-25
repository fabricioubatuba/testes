// Variáveis globais
let currentUser = null;
let currentRace = null;
let currentRider = null;
let races = [];
let finishedRaces = [];

// Inicialização da aplicação
$(document).ready(function() {
    // Máscaras para os campos
    $('#birth-date').mask('00-00-0000');
    $('#phone').mask('(00) 00000-0000');
    $('#edit-birth-date').mask('00-00-0000');
    $('#edit-phone').mask('(00) 00000-0000');
    
    // Verificar se há usuário logado
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            $('#login-section').hide();
            $('#admin-panel').show();
            loadRaces();
        } else {
            currentUser = null;
            $('#login-section').show();
            $('#admin-panel').hide();
            loadRaces();
        }
    });
    
    // Eventos de clique nos tabs
    $('.tab').click(function() {
        const tabId = $(this).data('tab');
        $('.tab').removeClass('active');
        $(this).addClass('active');
        $('.tab-content').removeClass('active');
        $(`#${tabId}`).addClass('active');
        
        if (tabId === 'finished-races') {
            loadFinishedRaces();
        }
    });
    
    // Eventos de login
    $('#login-btn').click(() => $('#login-modal').show());
    $('#confirm-login-btn').click(loginAdmin);
    $('#logout-btn').click(logoutAdmin);
    
    // Eventos de modal
    $('.close').click(function() {
        $(this).closest('.modal').hide();
    });
    
    $(window).click(function(event) {
        if ($(event.target).hasClass('modal')) {
            $('.modal').hide();
        }
    });
    
    // Eventos de prova
    $('#add-race-btn').click(() => {
        $('#race-modal-title').text('Adicionar Nova Prova');
        $('#save-race-btn').text('Salvar Prova');
        $('#delete-race-btn').hide();
        clearRaceForm();
        $('#race-modal').show();
    });
    
    $('#save-race-btn').click(saveRace);
    $('#delete-race-btn').click(deleteRace);
    
    // Eventos de inscrição
    $('#confirm-register-btn').click(registerRider);
    
    // Eventos de edição de inscrito
    $('#save-rider-btn').click(saveRider);
    
    // Eventos de startlist
    $('#close-startlist-btn').click(() => $('#startlist-modal').hide());
    $('#status-filter').change(filterStartList);
    
    // Carregar provas iniciais
    loadRaces();
});

// Funções de autenticação
function loginAdmin() {
    const email = $('#admin-email').val();
    const password = $('#admin-password').val();
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            $('#login-modal').hide();
            $('#login-error').hide();
        })
        .catch(error => {
            console.error('Erro de login:', error);
            $('#login-error').show();
        });
}

function logoutAdmin() {
    auth.signOut()
        .then(() => {
            currentUser = null;
            $('#admin-panel').hide();
            $('#login-section').show();
        })
        .catch(error => {
            console.error('Erro de logout:', error);
        });
}

// Funções de carregamento de dados
function loadRaces() {
    $('#races-spinner').show();
    $('#races-container').empty();
    
    database.ref('races').once('value')
        .then(snapshot => {
            races = [];
            finishedRaces = [];
            
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const race = childSnapshot.val();
                    race.id = childSnapshot.key;
                    if (!race.finished) {
                        races.push(race);
                    } else {
                        finishedRaces.push(race);
                    }
                });
            }
            
            displayRaces(races, 'races-container');
            $('#races-spinner').hide();
        })
        .catch(error => {
            console.error('Erro ao carregar provas:', error);
            $('#races-spinner').hide();
            $('#races-container').html('<div class="empty-state"><h3>Erro ao carregar provas</h3><p>Tente recarregar a página.</p></div>');
        });
}

function loadFinishedRaces() {
    $('#finished-races-spinner').show();
    $('#finished-races-container').empty();
    
    if (finishedRaces.length === 0) {
        database.ref('races').once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    finishedRaces = [];
                    snapshot.forEach(childSnapshot => {
                        const race = childSnapshot.val();
                        race.id = childSnapshot.key;
                        if (race.finished) {
                            finishedRaces.push(race);
                        }
                    });
                }
                
                displayRaces(finishedRaces, 'finished-races-container', true);
                $('#finished-races-spinner').hide();
            })
            .catch(error => {
                console.error('Erro ao carregar provas finalizadas:', error);
                $('#finished-races-spinner').hide();
                $('#finished-races-container').html('<div class="empty-state"><h3>Erro ao carregar provas finalizadas</h3><p>Tente recarregar a página.</p></div>');
            });
    } else {
        displayRaces(finishedRaces, 'finished-races-container', true);
        $('#finished-races-spinner').hide();
    }
}

function displayRaces(racesArray, containerId, isFinished = false) {
    const container = $(`#${containerId}`);
    
    if (racesArray.length === 0) {
        container.html(`
            <div class="empty-state">
                <i>🏁</i>
                <h3>Nenhuma prova ${isFinished ? 'finalizada' : 'ativa'}</h3>
                <p>${isFinished ? 'As provas finalizadas aparecerão aqui.' : 'Volte em breve para novas provas!'}</p>
            </div>
        `);
        return;
    }
    
    let html = '<div class="races-grid">';
    
    racesArray.forEach(race => {
        const status = getRaceStatus(race);
        const statusClass = status === 'Inscrições Abertas' ? 'status-open' : 
                           status === 'Inscrições Encerradas' ? 'status-closed' : 'status-finished';
        
        const defaultImage = getDefaultRaceImage(race);
        
        html += `
            <div class="race-card" data-race-id="${race.id}">
                <div class="race-image-container">
                    <img src="${race.imageUrl || defaultImage}" alt="${race.name}" class="race-image">
                </div>
                <div class="race-content">
                    <div class="race-header">
                        <h3 class="race-title">${race.name}</h3>
                        <span class="race-status ${statusClass}">${status}</span>
                    </div>
                    <div class="race-info">
                        <span class="race-date">${formatDate(race.date)}</span>
                        <span class="race-price">R$ ${race.price.toFixed(2)}</span>
                    </div>
                    ${race.description ? `<p class="race-description">${race.description}</p>` : ''}
                    <div class="race-actions">
                        ${!isFinished && race.registrationOpen ? `
                            <button class="btn btn-primary btn-register" data-race-id="${race.id}">Inscrever-se</button>
                        ` : ''}
                        ${race.regulationLink ? `
                            <a href="${race.regulationLink}" target="_blank" class="btn btn-outline">Regulamento</a>
                        ` : ''}
                        <button class="btn btn-outline btn-startlist" data-race-id="${race.id}">Lista de Inscritos</button>
                        ${currentUser ? `
                            ${!isFinished ? `
                                <button class="btn btn-warning btn-edit-race" data-race-id="${race.id}">Editar Prova</button>
                                <button class="btn btn-danger btn-delete-race" data-race-id="${race.id}">Excluir Prova</button>
                                <button class="btn btn-warning btn-toggle-registration" data-race-id="${race.id}">
                                    ${race.registrationOpen ? 'Encerrar Inscrições' : 'Abrir Inscrições'}
                                </button>
                                <button class="btn btn-danger btn-finish-race" data-race-id="${race.id}">Finalizar Prova</button>
                            ` : `
                                <button class="btn btn-danger btn-delete-race" data-race-id="${race.id}">Excluir Prova</button>
                            `}
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.html(html);
    
    // Adicionar eventos aos botões
    if (!isFinished) {
        $('.btn-register').click(function() {
            const raceId = $(this).data('race-id');
            openRegisterModal(raceId);
        });
    }
    
    $('.btn-startlist').click(function() {
        const raceId = $(this).data('race-id');
        showStartList(raceId);
    });
    
    if (currentUser) {
        $('.btn-edit-race').click(function() {
            const raceId = $(this).data('race-id');
            editRace(raceId);
        });
        
        $('.btn-delete-race').click(function() {
            const raceId = $(this).data('race-id');
            const isFinishedRace = racesArray.find(r => r.id === raceId)?.finished || false;
            deleteRace(raceId, isFinishedRace);
        });
        
        $('.btn-toggle-registration').click(function() {
            const raceId = $(this).data('race-id');
            toggleRegistration(raceId);
        });
        
        $('.btn-finish-race').click(function() {
            const raceId = $(this).data('race-id');
            finishRace(raceId);
        });
    }
}

function getDefaultRaceImage(race) {
    const name = race.name.toLowerCase();
    
    if (name.includes('ciclismo') || name.includes('mtb') || name.includes('bike')) {
        return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
    } else if (name.includes('corrida') || name.includes('run') || name.includes('maratona')) {
        return 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
    } else if (name.includes('natação') || name.includes('aqua') || name.includes('triathlon')) {
        return 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
    } else if (name.includes('trail')) {
        return 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
    } else {
        return 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
    }
}

function getRaceStatus(race) {
    if (race.finished) {
        return 'Finalizada';
    } else if (race.registrationOpen) {
        return 'Inscrições Abertas';
    } else {
        return 'Inscrições Encerradas';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Funções de manipulação de provas
function openRegisterModal(raceId) {
    currentRace = races.find(r => r.id === raceId);
    
    if (!currentRace) {
        alert('Prova não encontrada.');
        return;
    }
    
    if (!currentRace.registrationOpen) {
        alert('Inscrições encerradas para esta prova.');
        return;
    }
    
    $('#race-selected-name').text(currentRace.name);
    $('#register-modal').show();
}

function registerRider() {
    const name = $('#full-name').val().trim();
    const birthDate = $('#birth-date').val().trim();
    const phone = $('#phone').val().trim();
    const voucherCode = $('#voucher-code').val().trim();
    const category = $('#category').val();
    const modality = $('#modality').val();
    
    if (!name || !birthDate || !phone || !category || !modality) {
        alert('Preencha todos os campos obrigatórios.');
        return;
    }
    
    $('#register-spinner').show();
    
    const riderData = {
        raceId: currentRace.id,
        raceName: currentRace.name,
        raceDate: currentRace.date,
        name: name,
        birthDate: birthDate,
        phone: phone,
        voucherCode: voucherCode || null,
        category: category,
        modality: modality,
        status: 'pending',
        registrationDate: new Date().toISOString()
    };
    
    database.ref('cyclingRegistrations').push(riderData)
        .then(() => {
            $('#register-spinner').hide();
            $('#register-modal').hide();
            clearRegisterForm();
            
            const formattedDate = formatDate(currentRace.date);
            let whatsappMsg = `Olá, gostaria de confirmar a Inscrição no Ranking Ubatuba de Ciclismo!\n\n` +
                              `*Prova:* ${currentRace.name}\n` +
                              `*Data:* ${formattedDate}\n` +
                              `*Nome:* ${name}\n` +
                              `*Data Nasc.:* ${birthDate}\n` +
                              `*Telefone:* ${phone}\n` +
                              `*Categoria:* ${category}\n` +
                              `*Modalidade:* ${modality}\n`;
            
            if (voucherCode) {
                whatsappMsg += `*Código de Desconto:* ${voucherCode}\n`;
            }
            
            whatsappMsg += `*Valor:* R$${currentRace.price.toFixed(2)}`;
            
            window.open(`https://wa.me/5512997689586?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
            
            alert('Inscrição realizada com sucesso! Por favor, confirme o pagamento via WhatsApp.');
        })
        .catch(error => {
            console.error('Erro ao realizar inscrição:', error);
            $('#register-spinner').hide();
            alert('Erro ao realizar inscrição. Tente novamente.');
        });
}

function toggleRegistration(raceId) {
    const race = races.find(r => r.id === raceId);
    if (!race) return;
    
    const newStatus = !race.registrationOpen;
    
    database.ref(`races/${raceId}/registrationOpen`).set(newStatus)
        .then(() => {
            race.registrationOpen = newStatus;
            loadRaces();
            alert(`Inscrições ${newStatus ? 'abertas' : 'encerradas'} com sucesso!`);
        })
        .catch(error => {
            console.error('Erro ao alterar status das inscrições:', error);
            alert('Erro ao alterar status das inscrições.');
        });
}

function finishRace(raceId) {
    if (!confirm('Tem certeza que deseja finalizar esta prova? Ela será movida para "Eventos Finalizados".')) {
        return;
    }
    
    database.ref(`races/${raceId}/finished`).set(true)
        .then(() => {
            const raceIndex = races.findIndex(r => r.id === raceId);
            if (raceIndex !== -1) {
                const race = races.splice(raceIndex, 1)[0];
                race.finished = true;
                finishedRaces.push(race);
            }
            
            loadRaces();
            alert('Prova finalizada com sucesso!');
        })
        .catch(error => {
            console.error('Erro ao finalizar prova:', error);
            alert('Erro ao finalizar prova.');
        });
}

function showStartList(raceId) {
    const race = races.find(r => r.id === raceId) || finishedRaces.find(r => r.id === raceId);
    if (!race) return;
    
    currentRace = race;
    $('#startlist-modal-title').text(`Lista de Inscritos - ${race.name}`);
    $('#startlist-race-name').text(race.name);
    $('#startlist-spinner').show();
    $('#startlist-list').empty();
    
    // Configurar visibilidade para usuário comum vs admin
    const headers = $('#startlist-list').closest('table').find('th');
    if (currentUser) {
        // Admin: mostra todas as colunas e o filtro
        headers.show();
        $('#status-filter-group').show();
    } else {
        // Usuário comum: mostra apenas Nome e Categoria
        headers.hide();
        headers.eq(0).show(); // Nome
        headers.eq(1).show(); // Categoria
        $('#status-filter-group').hide();
    }
    
    // Carregar lista de inscritos
    database.ref('cyclingRegistrations').orderByChild('raceId').equalTo(raceId).once('value')
        .then(snapshot => {
            const riders = [];
            snapshot.forEach(childSnapshot => {
                const rider = childSnapshot.val();
                rider.id = childSnapshot.key;
                riders.push(rider);
            });
            
            displayStartList(riders);
            $('#startlist-spinner').hide();
            $('#startlist-modal').show();
        })
        .catch(error => {
            console.error('Erro ao carregar lista de inscritos:', error);
            $('#startlist-spinner').hide();
            alert('Erro ao carregar lista de inscritos.');
        });
}

function displayStartList(riders) {
    const tbody = $('#startlist-list');
    tbody.empty();
    
    if (riders.length === 0) {
        const colspan = currentUser ? '6' : '2';
        tbody.html(`<tr><td colspan="${colspan}" style="text-align: center;">Nenhum inscrito encontrado.</td></tr>`);
        return;
    }
    
    riders.forEach(rider => {
        let row = '';
        
        if (currentUser) {
            // Visualização para ADMIN - mostra todos os campos
            const statusClass = rider.status === 'pending' ? 'status-pending' : 
                               rider.status === 'waiting' ? 'status-waiting' : 'status-completed';
            const statusText = rider.status === 'pending' ? 'Contato Pendente' : 
                              rider.status === 'waiting' ? 'Aguardando Pagamento' : 'Inscrição Concluída';
            
            row = `
                <tr data-status="${rider.status}">
                    <td>${rider.name}</td>
                    <td>${rider.category || '-'}</td>
                    <td>${rider.modality || '-'}</td>
                    <td>${rider.voucherCode || '-'}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="action-btn edit-btn" data-rider-id="${rider.id}">Editar</button>
                        <button class="action-btn delete-btn" data-rider-id="${rider.id}">Excluir</button>
                    </td>
                </tr>
            `;
        } else {
            // Visualização para USUÁRIO COMUM - mostra apenas nome e categoria
            row = `
                <tr>
                    <td>${rider.name}</td>
                    <td>${rider.category || '-'}</td>
                </tr>
            `;
        }
        
        tbody.append(row);
    });
    
    // Adicionar eventos de edição/exclusão apenas para admin
    if (currentUser) {
        $('.edit-btn').click(function() {
            const riderId = $(this).data('rider-id');
            const rider = riders.find(r => r.id === riderId);
            openRiderEditModal(rider);
        });
        
        $('.delete-btn').click(function() {
            const riderId = $(this).data('rider-id');
            deleteRider(riderId);
        });
    }
}

function filterStartList() {
    const status = $('#status-filter').val();
    $('#startlist-list tr').show();
    
    if (status !== 'all') {
        $('#startlist-list tr').not(`[data-status="${status}"]`).hide();
    }
}

function openRiderEditModal(rider) {
    currentRider = rider;
    
    $('#rider-race-name').text(currentRace.name);
    $('#edit-name').val(rider.name);
    $('#edit-birth-date').val(rider.birthDate);
    $('#edit-phone').val(rider.phone);
    $('#edit-voucher-code').val(rider.voucherCode || '');
    $('#edit-category').val(rider.category || '');
    $('#edit-modality').val(rider.modality || '');
    $('#edit-status').val(rider.status);
    
    $('#rider-modal').show();
}

function saveRider() {
    if (!currentRider || !currentRace) return;
    
    const updatedRider = {
        name: $('#edit-name').val().trim(),
        birthDate: $('#edit-birth-date').val().trim(),
        phone: $('#edit-phone').val().trim(),
        voucherCode: $('#edit-voucher-code').val().trim(),
        category: $('#edit-category').val(),
        modality: $('#edit-modality').val(),
        status: $('#edit-status').val()
    };
    
    if (!updatedRider.name || !updatedRider.birthDate || !updatedRider.phone || !updatedRider.category || !updatedRider.modality) {
        alert('Preencha todos os campos obrigatórios.');
        return;
    }
    
    $('#rider-spinner').show();
    
    database.ref(`cyclingRegistrations/${currentRider.id}`).update(updatedRider)
        .then(() => {
            $('#rider-spinner').hide();
            $('#rider-modal').hide();
            showStartList(currentRace.id);
            alert('Inscrito atualizado com sucesso!');
        })
        .catch(error => {
            console.error('Erro ao atualizar inscrito:', error);
            $('#rider-spinner').hide();
            alert('Erro ao atualizar inscrito.');
        });
}

function deleteRider(riderId) {
    if (!confirm('Tem certeza que deseja excluir este inscrito?')) {
        return;
    }
    
    database.ref(`cyclingRegistrations/${riderId}`).remove()
        .then(() => {
            showStartList(currentRace.id);
            alert('Inscrito excluído com sucesso!');
        })
        .catch(error => {
            console.error('Erro ao excluir inscrito:', error);
            alert('Erro ao excluir inscrito.');
        });
}

function editRace(raceId) {
    const race = races.find(r => r.id === raceId) || finishedRaces.find(r => r.id === raceId);
    if (!race) return;
    
    currentRace = race;
    $('#race-modal-title').text('Editar Prova');
    $('#race-name').val(race.name);
    $('#race-date').val(race.date);
    $('#race-price').val(race.price);
    $('#race-description').val(race.description || '');
    $('#race-image-url').val(race.imageUrl || '');
    $('#regulation-link').val(race.regulationLink || '');
    
    $('#delete-race-btn').show();
    $('#race-modal').show();
}

function saveRace() {
    const name = $('#race-name').val().trim();
    const date = $('#race-date').val();
    const price = parseFloat($('#race-price').val());
    const description = $('#race-description').val().trim();
    const imageUrl = $('#race-image-url').val().trim();
    const regulationLink = $('#regulation-link').val().trim();
    
    if (!name || !date || isNaN(price)) {
        alert('Preencha todos os campos obrigatórios.');
        return;
    }
    
    $('#race-spinner').show();
    
    const raceData = {
        name,
        date,
        price,
        description,
        imageUrl: imageUrl || null,
        regulationLink: regulationLink || null,
        registrationOpen: currentRace ? currentRace.registrationOpen : true,
        finished: currentRace ? currentRace.finished : false
    };
    
    let promise;
    
    if (currentRace && currentRace.id) {
        // Editar prova existente
        promise = database.ref(`races/${currentRace.id}`).update(raceData);
    } else {
        // Adicionar nova prova
        promise = database.ref('races').push(raceData);
    }
    
    promise.then(() => {
        $('#race-spinner').hide();
        $('#race-modal').hide();
        loadRaces();
        alert('Prova salva com sucesso!');
    })
    .catch(error => {
        console.error('Erro ao salvar prova:', error);
        $('#race-spinner').hide();
        alert('Erro ao salvar prova.');
    });
}

function deleteRace(raceId, isFinished = false) {
    if (!confirm(`Tem certeza que deseja excluir esta prova${isFinished ? ' finalizada' : ''}? Esta ação não pode ser desfeita.`)) {
        return;
    }
    
    // Primeiro, verificar se há inscritos
    database.ref('cyclingRegistrations').orderByChild('raceId').equalTo(raceId).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                if (!confirm('Esta prova tem inscritos. Excluí-la também removerá todos os inscritos. Continuar?')) {
                    return;
                }
                
                // Excluir todos os inscritos
                const deleteInscriptions = [];
                snapshot.forEach(childSnapshot => {
                    deleteInscriptions.push(database.ref(`cyclingRegistrations/${childSnapshot.key}`).remove());
                });
                
                return Promise.all(deleteInscriptions);
            }
            return Promise.resolve();
        })
        .then(() => {
            // Excluir a prova
            return database.ref(`races/${raceId}`).remove();
        })
        .then(() => {
            $('#race-modal').hide();
            
            // Remover das arrays locais
            if (isFinished) {
                finishedRaces = finishedRaces.filter(r => r.id !== raceId);
                loadFinishedRaces();
            } else {
                races = races.filter(r => r.id !== raceId);
                loadRaces();
            }
            
            alert('Prova excluída com sucesso!');
        })
        .catch(error => {
            console.error('Erro ao excluir prova:', error);
            alert('Erro ao excluir prova.');
        });
}

// Funções auxiliares
function clearRegisterForm() {
    $('#full-name').val('');
    $('#birth-date').val('');
    $('#phone').val('');
    $('#voucher-code').val('');
    $('#category').val('');
    $('#modality').val('');
}

function clearRaceForm() {
    $('#race-name').val('');
    $('#race-date').val('');
    $('#race-price').val('');
    $('#race-description').val('');
    $('#race-image-url').val('');
    $('#regulation-link').val('');
    currentRace = null;
}
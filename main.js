// Array para armazenar os itens no carrinho (pizza/combo e bebidas separadas)
let cart = []; 
let selectedItem = {}; // Item (pizza/combo) sendo configurado na tela de seleção de sabores
let selectedBeverage = { name: 'Nenhuma bebida', price: 0, id: 'no-beverage' }; // Bebida selecionada na tela de seleção
let selectedCrust = { name: 'Sem Borda Recheada', price: 0, id: 'no-crust' }; // Borda selecionada
let deliveryFee = 0; // Armazena a taxa de entrega calculada, agora sempre 0

// Armazenar os sabores selecionados para cada pizza do Combo 2
let selectedFlavorsPizza1 = [];
let selectedFlavorsPizza2 = [];
let selectedFlavorsPizza3 = []; // NOVO: Para a terceira pizza do Combo 4
// Variável para armazenar os sabores para itens de sabor único (pizza individual, esfirra)
let selectedFlavors = []; 

// Objeto para armazenar as quantidades das esfirras selecionadas
let esfirraQuantities = {};
// Objeto para armazenar as quantidades de bebidas selecionadas
let beverageQuantities = {};


// Função para mostrar a página correta e esconder as outras
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');

    // Se for para a página de resumo, atualiza o carrinho
    if (pageId === 'order-summary') {
        renderCart();
    }
}

// Função para atualizar a contagem de itens no ícone do carrinho
function updateCartIconCount() {
    let totalItemsInCart = 0;
    cart.forEach(item => {
        totalItemsInCart += item.quantity;
    });
    // Se o carrinho estiver vazio, exibe 0. Caso contrário, exibe a contagem total.
    document.getElementById('cart-count').textContent = totalItemsInCart === 0 ? '0' : totalItemsInCart;
}

// Função para rolar suavemente até uma categoria
function scrollToCategory(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Função para preencher automaticamente o endereço via ViaCEP e calcular a taxa de entrega
function autofillAddressAndCalculateDelivery() {
    const cepInput = document.getElementById('cep-address');
    const cep = cepInput.value.replace(/\D/g, ''); // Remove non-numeric characters

    if (cep.length === 8) {
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(response => response.json())
            .then(data => {
                if (!data.erro) {
                    document.getElementById('address-street').value = data.logradouro;
                    document.getElementById('address-neighborhood').value = data.bairro;
                    // Calcula a taxa de entrega após o preenchimento do CEP
                    calcularTaxaEntrega(cep);
                    // Optionally, focus on the number input after autofill
                    document.getElementById('address-number').focus();
                } else {
                    alert('CEP não encontrado.');
                    document.getElementById('address-street').value = '';
                    document.getElementById('address-neighborhood').value = '';
                    document.getElementById("taxa-entrega").innerText = ''; // Clear previous fee message
                    deliveryFee = 0; // Reset delivery fee
                    calculateTotalCartPrice(); // Recalculate total
                }
            })
            .catch(error => {
                console.error('Erro ao buscar CEP:', error);
                alert('Erro ao buscar CEP. Tente novamente.');
                document.getElementById('address-street').value = '';
                document.getElementById('address-neighborhood').value = '';
                document.getElementById("taxa-entrega").innerText = ''; // Clear previous fee message
                deliveryFee = 0; // Reset delivery fee
                calculateTotalCartPrice(); // Recalculate total
            });
    } else {
        document.getElementById("taxa-entrega").innerText = ''; // Clear previous fee message
        deliveryFee = 0; // Reset delivery fee
        calculateTotalCartPrice(); // Recalculate total
    }
}


// === Lógica do Cardápio Principal ===
document.querySelectorAll('.clickable-item').forEach(item => {
    item.addEventListener('click', function() {
        selectedItem = {
            type: this.dataset.itemType, // 'combo', 'pizza-tradicional', 'pizza-especial', 'pizza-media', 'esfirra-tradicional', 'esfirra-especial', 'esfirra-doce', 'beverage', 'pizza-day'
            id: this.dataset.itemId,
            name: this.dataset.itemName,
            price: parseFloat(this.dataset.itemPrice)
        };
        console.log('Item selecionado no menu principal:', selectedItem); // Log de depuração

        // Reinicia os checkboxes de sabor e o botão ao ir para seleção de sabores
        document.querySelectorAll('input[name="flavor"], input[name="flavor-pizza1"], input[name="flavor-pizza2"], input[name="flavor-pizza3"]').forEach(cb => { // Adicionado flavor-pizza3
            cb.checked = false;
            const label = cb.closest('label');
            if (label) {
                label.classList.remove('disabled-option'); // Remove o estilo de desabilitado
                label.style.display = 'flex'; // Garante que estejam visíveis por padrão
            }
        });
        
        // Reinicia a seleção de bebida para "Nenhuma bebida"
        selectedBeverage = { name: 'Nenhuma bebida', price: 0, id: 'no-beverage' };
        // Reinicia as quantidades das bebidas na página de seleção de sabores
        beverageQuantities = {};
        document.querySelectorAll('#beverage-options-with-quantity .quantity-input').forEach(input => {
            input.value = 0;
        });


        // Reinicia a seleção de borda para "Sem Borda Recheada"
        selectedCrust = { name: 'Sem Borda Recheada', price: 0, id: 'no-crust' };
        document.querySelectorAll('input[name="stuffed-crust"]').forEach(radio => {
            radio.checked = (radio.value === 'Sem Borda Recheada');
            // Reset text content to original (important for Pizza Day 1 later)
            if (radio.dataset.crustId === 'catupiry-crust') radio.closest('label').querySelector('span').textContent = 'Borda Recheada Catupiry +R$10,00';
            if (radio.dataset.crustId === 'chocolate-crust') radio.closest('label').querySelector('span').textContent = 'Borda Recheada Chocolate +R$10,00';
            if (radio.dataset.crustId === 'rj-crust') radio.closest('label').querySelector('span').textContent = 'Borda Recheada Romeu e Julieta +R$10,00';
            if (radio.dataset.crustId === 'cheddar-crust') radio.closest('label').querySelector('span').textContent = 'Borda Recheada Cheddar +R$10,00';
        });

        // Limpa os arrays de sabores das pizzas do combo e do item único
        selectedFlavorsPizza1 = [];
        selectedFlavorsPizza2 = [];
        selectedFlavorsPizza3 = []; // NOVO: Limpa os sabores da pizza 3
        selectedFlavors = [];

        // Reinicia as quantidades das esfirras
        esfirraQuantities = {};
        document.querySelectorAll('#esfirra-flavor-quantity-options .quantity-input').forEach(input => {
            input.value = 0;
        });
        document.querySelectorAll('#esfirra-doce-flavor-quantity-options .quantity-input').forEach(input => {
            input.value = 0;
        });


        // Atualiza o texto de instrução da seleção de sabores e o estado do botão
        updateFlavorSelectionInstructions();
        updateFinalizeButtonState(); 
        
        // Atualiza as informações do item na página de seleção de sabores
        document.getElementById('item-info').innerHTML = `Você selecionou: <span class="font-bold">${selectedItem.name}</span> por <span class="font-bold">R$ ${selectedItem.price.toFixed(2).replace('.', ',')}</span>`;
        
        // Redireciona para a seleção de sabor para itens que exigem sabor
        if (selectedItem.id.includes('pizza') || selectedItem.id.includes('combo') || selectedItem.id.includes('esfirra') || selectedItem.id.includes('pizza-day')) {
            showPage('flavor-selection');
        } else if (selectedItem.type === 'beverage') {
            // Para bebidas, adiciona diretamente ao carrinho e vai para o resumo
            cart.push({
                name: selectedItem.name,
                price: selectedItem.price,
                quantity: 1,
                flavors: [], // Bebidas não têm sabores
                type: selectedItem.type,
                id: selectedItem.id 
            });
            updateCartIconCount();
            showPage('order-summary');
        } else {
            // Para outros itens que não precisam de seleção de sabor (se houver no futuro)
            // Adiciona o item diretamente ao carrinho se não precisar de seleção de sabor
            cart.push({
                name: selectedItem.name,
                price: selectedItem.price,
                quantity: 1,
                flavors: [],
                type: selectedItem.type,
                id: selectedItem.id 
            });
            updateCartIconCount();
            showPage('order-summary');
        }
    });
});

const traditionalFlavors = ['Portuguesa', 'Calabresa', 'Mussarela', 'Marguerita', 'Frango', 'Frango com Catupiry', 'Calabresa com Catupiry', 'Bacon', 'Bacon com Catupiry', 'Bacon com Cheddar', 'Atum']; // Inclui os sabores tradicionais que podem ser escolhidos
const sweetFlavors = ['Brigadeiro', 'Romeu e Julieta', 'M&M', 'Doce de Leite', 'Oreo']; // Sabores doces específicos

const esfirraTradicionalAllowedFlavors = ['Portuguesa', 'Calabresa', 'Mussarela', 'Marguerita', 'Frango', 'Bacon', 'Atum']; // Sabores permitidos para esfirra salgada tradicional
const esfirraEspecialAllowedFlavors = ['Frango com Catupiry', 'Calabresa com Catupiry', 'Bacon com Catupiry', 'Bacon com Cheddar', 'Atum']; // Sabores permitidos para esfirra salgada especial


// Função para atualizar as instruções de seleção de sabor e habilitar/desabilitar checkboxes
function updateFlavorSelectionInstructions() {
    const pizza1FlavorSection = document.getElementById('pizza1-flavor-section');
    const pizza2FlavorSection = document.getElementById('pizza2-flavor-section');
    const pizza3FlavorSection = document.getElementById('pizza3-flavor-section'); // NOVO: para a terceira pizza
    const singleFlavorSection = document.getElementById('flavor-options-single');
    const esfirraOptionsSection = document.getElementById('esfirra-options-single');
    const esfirraDoceOptionsSection = document.getElementById('esfirra-doce-options-single');
    const beverageOptionsWithQuantity = document.getElementById('beverage-options-with-quantity');
    const beverageHeading = document.getElementById('beverage-heading');
    const stuffedCrustRadios = document.querySelectorAll('input[name="stuffed-crust"]');
    const crustOptionsSection = document.getElementById('crust-options-section');
    const flavorInstructionTextSingle = document.getElementById('flavor-instruction-text-single');
    const flavorInstructionTextPizza1 = document.getElementById('flavor-instruction-text-pizza1');
    const flavorInstructionTextPizza2 = document.getElementById('flavor-instruction-text-pizza2');
    const flavorInstructionTextPizza3 = document.getElementById('flavor-instruction-text-pizza3'); // NOVO: para a terceira pizza
    const flavorCheckboxesSingle = document.querySelectorAll('input[name="flavor"]');
    const flavorCheckboxesPizza1 = document.querySelectorAll('input[name="flavor-pizza1"]');
    const flavorCheckboxesPizza2 = document.querySelectorAll('input[name="flavor-pizza2"]');
    const flavorCheckboxesPizza3 = document.querySelectorAll('input[name="flavor-pizza3"]'); // NOVO: para a terceira pizza


    console.log('updateFlavorSelectionInstructions chamada');
    // Esconde todas as seções de sabor e re-habilita todos os checkboxes inicialmente
    pizza1FlavorSection.classList.add('hidden');
    pizza2FlavorSection.classList.add('hidden');
    pizza3FlavorSection.classList.add('hidden'); // Esconde por padrão
    singleFlavorSection.classList.add('hidden');
    esfirraOptionsSection.classList.add('hidden');
    esfirraDoceOptionsSection.classList.add('hidden');

    if (beverageOptionsWithQuantity) {
        beverageOptionsWithQuantity.classList.add('hidden');
        console.log('beverageOptionsWithQuantity element found:', beverageOptionsWithQuantity);
    } else {
        console.error('Element with ID "beverage-options-with-quantity" not found!');
    }

    // Reset all flavor checkboxes to enabled and visible state
    document.querySelectorAll('input[name="flavor"], input[name="flavor-pizza1"], input[name="flavor-pizza2"], input[name="flavor-pizza3"]').forEach(cb => { // Adicionado flavor-pizza3
        cb.checked = false;
        const label = cb.closest('label');
        if (label) {
            label.classList.remove('disabled-option'); // Remove o estilo de desabilitado
            label.style.display = 'flex'; // Garante que estejam visíveis por padrão
        }
    });
    // Reset all esfirra quantities
    document.querySelectorAll('.esfirra-flavor-item .quantity-input').forEach(input => {
        input.value = 0;
        input.closest('.esfirra-flavor-item').style.display = 'flex'; // Make all visible
    });
    esfirraQuantities = {}; // Clear stored quantities


    // Adjust beverage heading based on selected item
    if (selectedItem.id === 'combo1') {
        beverageHeading.textContent = 'Seu combo já tem refrigerante de 1L, deseja acrescentar mais refrigerante ?';
        if (beverageOptionsWithQuantity) beverageOptionsWithQuantity.classList.remove('hidden');
        // Special handling for Combo 1: pre-select Coca-cola 1L as 0 cost, disable input
        beverageQuantities = { 'Coca-cola 1L': { quantity: 1, price: 0 } };
        document.querySelectorAll('#beverage-options-with-quantity .quantity-input').forEach(input => {
            if (input.dataset.beverageFlavor === 'Coca-cola 1L') {
                input.value = 1;
                input.disabled = true;
                input.closest('.beverage-item-with-quantity').querySelectorAll('button').forEach(btn => btn.disabled = true);
                input.closest('.beverage-item-with-quantity').querySelector('span').textContent = 'Coca-cola 1L - GRÁTIS';
            } else {
                 input.value = 0;
                 input.disabled = false;
                 input.closest('.beverage-item-with-quantity').querySelectorAll('button').forEach(btn => btn.disabled = false);
                 input.closest('.beverage-item-with-quantity').querySelector('span').textContent = `${input.dataset.beverageFlavor} - R$ ${parseFloat(input.dataset.beveragePrice).toFixed(2).replace('.', ',')}`;
            }
        });
    } else if (selectedItem.id === 'combo2') { // Added Combo 2 logic here
        beverageHeading.textContent = 'Seu combo já tem refrigerante de 2L, deseja acrescentar mais refrigerante ?';
        if (beverageOptionsWithQuantity) beverageOptionsWithQuantity.classList.remove('hidden');
        // Special handling for Combo 2: pre-select Coca-cola 2L as 0 cost, disable input
        beverageQuantities = { 'Coca-cola 2L': { quantity: 1, price: 0 } };
        document.querySelectorAll('#beverage-options-with-quantity .quantity-input').forEach(input => {
            if (input.dataset.beverageFlavor === 'Coca-cola 2L') {
                input.value = 1;
                input.disabled = true;
                input.closest('.beverage-item-with-quantity').querySelectorAll('button').forEach(btn => btn.disabled = true);
                input.closest('.beverage-item-with-quantity').querySelector('span').textContent = 'Coca-cola 2L - GRÁTIS';
            } else {
                 input.value = 0;
                 input.disabled = false;
                 input.closest('.beverage-item-with-quantity').querySelectorAll('button').forEach(btn => btn.disabled = false);
                 input.closest('.beverage-item-with-quantity').querySelector('span').textContent = `${input.dataset.beverageFlavor} - R$ ${parseFloat(input.dataset.beveragePrice).toFixed(2).replace('.', ',')}`;
            }
        });
    } else if (selectedItem.id === 'combo3') { 
        beverageHeading.textContent = 'Seu combo já tem refrigerante de 1L, deseja acrescentar mais refrigerante ?';
        if (beverageOptionsWithQuantity) beverageOptionsWithQuantity.classList.remove('hidden');
        beverageQuantities = { 'Coca-cola 1L': { quantity: 1, price: 0 } }; 
        document.querySelectorAll('#beverage-options-with-quantity .quantity-input').forEach(input => {
            if (input.dataset.beverageFlavor === 'Coca-cola 1L') {
                input.value = 1;
                input.disabled = true;
                input.closest('.beverage-item-with-quantity').querySelectorAll('button').forEach(btn => btn.disabled = true);
                input.closest('.beverage-item-with-quantity').querySelector('span').textContent = 'Coca-cola 1L - GRÁTIS';
            } else {
                 input.value = 0;
                 input.disabled = false;
                 input.closest('.beverage-item-with-quantity').querySelectorAll('button').forEach(btn => btn.disabled = false);
                 input.closest('.beverage-item-with-quantity').querySelector('span').textContent = `${input.dataset.beverageFlavor} - R$ ${parseFloat(input.dataset.beveragePrice).toFixed(2).replace('.', ',')}`;
            }
        });
    } else if (selectedItem.id === 'combo4') { // Lógica para o Combo 4
        beverageHeading.textContent = 'Seu combo já tem 2 refrigerantes de 2L, deseja acrescentar mais refrigerante ?';
        if (beverageOptionsWithQuantity) beverageOptionsWithQuantity.classList.remove('hidden');
        beverageQuantities = { 'Coca-cola 2L': { quantity: 2, price: 0 } }; // Duas Coca-Cola 2L gratuitas
        document.querySelectorAll('#beverage-options-with-quantity .quantity-input').forEach(input => {
            if (input.dataset.beverageFlavor === 'Coca-cola 2L') {
                input.value = 2;
                input.disabled = true;
                input.closest('.beverage-item-with-quantity').querySelectorAll('button').forEach(btn => btn.disabled = true);
                input.closest('.beverage-item-with-quantity').querySelector('span').textContent = 'Coca-cola 2L - GRÁTIS (2 unidades)';
            } else {
                 input.value = 0;
                 input.disabled = false;
                 input.closest('.beverage-item-with-quantity').querySelectorAll('button').forEach(btn => btn.disabled = false);
                 input.closest('.beverage-item-with-quantity').querySelector('span').textContent = `${input.dataset.beverageFlavor} - R$ ${parseFloat(input.dataset.beveragePrice).toFixed(2).replace('.', ',')}`;
            }
        });
    }
    else if (selectedItem.type === 'combo' || selectedItem.id.includes('pizza') || selectedItem.id.includes('esfirra') || selectedItem.id.includes('pizza-day')) {
        beverageHeading.textContent = 'Deseja acrescentar refrigerante ao seu pedido ?';
        if (beverageOptionsWithQuantity) beverageOptionsWithQuantity.classList.remove('hidden');
        
        // Special handling for Pizza Day 1 & 2: pre-select Coca-cola as 0 cost, disable input
        if (selectedItem.id === 'pizza-day-1') {
            beverageQuantities = { 'Coca-cola 1L': { quantity: 1, price: 0 } };
            document.querySelectorAll('#beverage-options-with-quantity .quantity-input').forEach(input => {
                if (input.dataset.beverageFlavor === 'Coca-cola 1L') {
                    input.value = 1;
                    input.disabled = true;
                    input.closest('.beverage-item-with-quantity').querySelectorAll('button').forEach(btn => btn.disabled = true);
                    input.closest('.beverage-item-with-quantity').querySelector('span').textContent = 'Coca-cola 1L - GRÁTIS';
                } else {
                     input.value = 0;
                     input.disabled = false;
                     input.closest('.beverage-item-with-quantity').querySelectorAll('button').forEach(btn => btn.disabled = false);
                     input.closest('.beverage-item-with-quantity').querySelector('span').textContent = `${input.dataset.beverageFlavor} - R$ ${parseFloat(input.dataset.beveragePrice).toFixed(2).replace('.', ',')}`;
                }
            });
        } else if (selectedItem.id === 'pizza-day-2') {
            beverageQuantities = { 'Coca-cola 2L': { quantity: 1, price: 0 } };
             document.querySelectorAll('#beverage-options-with-quantity .quantity-input').forEach(input => {
                if (input.dataset.beverageFlavor === 'Coca-cola 2L') {
                    input.value = 1;
                    input.disabled = true;
                    input.closest('.beverage-item-with-quantity').querySelectorAll('button').forEach(btn => btn.disabled = true);
                    input.closest('.beverage-item-with-quantity').querySelector('span').textContent = 'Coca-cola 2L - GRÁTIS';
                } else {
                     input.value = 0;
                     input.disabled = false;
                     input.closest('.beverage-item-with-quantity').querySelectorAll('button').forEach(btn => btn.disabled = false);
                     input.closest('.beverage-item-with-quantity').querySelector('span').textContent = `${input.dataset.beverageFlavor} - R$ ${parseFloat(input.dataset.beveragePrice).toFixed(2).replace('.', ',')}`;
                }
            });
        }
        else { // Reset for other items
             document.querySelectorAll('#beverage-options-with-quantity .quantity-input').forEach(input => {
                input.value = 0;
                input.disabled = false;
                input.closest('.beverage-item-with-quantity').querySelectorAll('button').forEach(btn => btn.disabled = false);
                input.closest('.beverage-item-with-quantity').querySelector('span').textContent = `${input.dataset.beverageFlavor} - R$ ${parseFloat(input.dataset.beveragePrice).toFixed(2).replace('.', ',')}`;
            });
            beverageQuantities = {};
        }
    } else if (selectedItem.type === 'beverage') {
        if (beverageOptionsWithQuantity) beverageOptionsWithQuantity.classList.add('hidden');
    } else {
        beverageHeading.textContent = 'Deseja acrescentar refrigerante ao seu pedido ?';
        if (beverageOptionsWithQuantity) beverageOptionsWithQuantity.classList.remove('hidden');
    }

    // Logic for displaying and enabling stuffed crusts
    if (selectedItem.id.includes('pizza') || selectedItem.type === 'combo' || selectedItem.id.includes('pizza-day')) {
        crustOptionsSection.style.display = 'block';
        stuffedCrustRadios.forEach(radio => {
            radio.disabled = false;
            const label = radio.closest('label');
            if (label) {
                label.classList.remove('disabled-option');
                label.style.display = 'flex';
            }
            // Reset text content to original
            if (radio.dataset.crustId === 'catupiry-crust') radio.closest('label').querySelector('span').textContent = 'Borda Recheada Catupiry +R$10,00';
            if (radio.dataset.crustId === 'chocolate-crust') radio.closest('label').querySelector('span').textContent = 'Borda Recheada Chocolate +R$10,00';
            if (radio.dataset.crustId === 'rj-crust') radio.closest('label').querySelector('span').textContent = 'Borda Recheada Romeu e Julieta +R$10,00';
            if (radio.dataset.crustId === 'cheddar-crust') radio.closest('label').querySelector('span').textContent = 'Borda Recheada Cheddar +R$10,00';
        });

        if (selectedItem.id === 'pizza-day-1' || selectedItem.id === 'pizza-day-2') {
            // Set 'Borda Recheada Chocolate' as default and free for Pizza Day 1 and 2
            document.querySelectorAll('input[name="stuffed-crust"]').forEach(radio => {
                if (radio.dataset.crustId === 'chocolate-crust') {
                    radio.checked = true;
                    selectedCrust = { name: radio.value, price: 0.00, id: radio.dataset.crustId };
                    radio.closest('label').querySelector('span').textContent = 'Borda Recheada Chocolate (Grátis)';
                    radio.disabled = true; // Disable if it's the free one
                    radio.closest('label').classList.add('disabled-option');
                } else {
                    radio.checked = false;
                    radio.disabled = true; // Disable other options
                    radio.closest('label').classList.add('disabled-option');
                }
            });
        } else { // This block will now also handle 'combo1', 'combo3' and 'combo4'
            // Reset to default for other items (all paid bordas re-enabled)
            document.querySelectorAll('input[name="stuffed-crust"]').forEach(radio => {
                radio.disabled = false; // Re-enable all radio buttons
                radio.closest('label').classList.remove('disabled-option');
                if (radio.dataset.crustId === 'no-crust') {
                    radio.checked = true;
                    selectedCrust = { name: 'Sem Borda Recheada', price: 0, id: 'no-crust' };
                }
            });
        }
    } else {
        crustOptionsSection.style.display = 'none';
        stuffedCrustRadios.forEach(radio => {
            radio.checked = false;
            radio.disabled = true;
            if (radio.dataset.crustId === 'no-crust') {
                radio.checked = true;
                selectedCrust = { name: 'Sem Borda Recheada', price: 0, id: 'no-crust' };
            }
        });
    }


    if (selectedItem.id === 'combo2' || selectedItem.id === 'pizza-day-2') {
        pizza1FlavorSection.classList.remove('hidden');
        pizza2FlavorSection.classList.remove('hidden');
        pizza3FlavorSection.classList.add('hidden'); // Esconde a terceira pizza se não for o Combo 4
        singleFlavorSection.classList.add('hidden'); // Ensure single flavor is hidden
        flavorInstructionTextPizza1.textContent = 'Escolha até 2 sabores para a Pizza 1.';
        flavorInstructionTextPizza2.textContent = 'Escolha até 2 sabores para a Pizza 2.';

        // For Combo 2 and Pizza Day 2, only traditional flavors are allowed for both pizzas
        const combo2AndPizzaDay2ForbiddenFlavors = sweetFlavors.concat(['Frango com Catupiry', 'Calabresa com Catupiry', 'Bacon com Catupiry', 'Bacon com Cheddar']);
        document.querySelectorAll('#flavor-options-pizza1 input[name="flavor-pizza1"], #flavor-options-pizza2 input[name="flavor-pizza2"]').forEach(cb => {
            const label = cb.closest('label');
            if (forbiddenForTraditional.includes(cb.value)) { // Use forbiddenForTraditional
                if (label) label.classList.add('disabled-option');
                if (label) label.style.display = 'none';
            } else {
                if (label) label.classList.remove('disabled-option');
                if (label) label.style.display = 'flex';
            }
        });

    } else if (selectedItem.id === 'combo4') { // Lógica para o Combo 4
        pizza1FlavorSection.classList.remove('hidden');
        pizza2FlavorSection.classList.remove('hidden');
        pizza3FlavorSection.classList.remove('hidden'); // Mostra a terceira pizza
        singleFlavorSection.classList.add('hidden');

        flavorInstructionTextPizza1.textContent = 'Escolha até 2 sabores SALGADOS para a Pizza 1.';
        flavorInstructionTextPizza2.textContent = 'Escolha até 2 sabores SALGADOS para a Pizza 2.';
        flavorInstructionTextPizza3.textContent = 'Escolha até 1 sabor DOCE para a Pizza 3.';

        // Sabores a serem removidos para pizzas salgadas do Combo 4
        const removedSavoryFlavorsForCombo4 = ['Frango com Catupiry', 'Calabresa com Catupiry', 'Bacon com Catupiry', 'Bacon com Cheddar'];

        // Habilita/desabilita sabores para Pizza 1 e Pizza 2 (salgadas)
        document.querySelectorAll('#flavor-options-pizza1 input[name="flavor-pizza1"], #flavor-options-pizza2 input[name="flavor-pizza2"]').forEach(cb => {
            const label = cb.closest('label');
            if (sweetFlavors.includes(cb.value) || removedSavoryFlavorsForCombo4.includes(cb.value)) { 
                if (label) label.classList.add('disabled-option');
                if (label) label.style.display = 'none';
            } else {
                if (label) label.classList.remove('disabled-option');
                if (label) label.style.display = 'flex';
            }
        });

        // Habilita/desabilita sabores para Pizza 3 (doce)
        document.querySelectorAll('#flavor-options-pizza3 input[name="flavor-pizza3"]').forEach(cb => {
            const label = cb.closest('label');
            if (!sweetFlavors.includes(cb.value)) { 
                if (label) label.classList.add('disabled-option');
                if (label) label.style.display = 'none';
            } else {
                if (label) label.classList.remove('disabled-option');
                if (label) label.style.display = 'flex';
            }
        });

    } else if (selectedItem.id === 'esfirra-doce') { 
        esfirraDoceOptionsSection.classList.remove('hidden');
        esfirraOptionsSection.classList.add('hidden');
        pizza1FlavorSection.classList.add('hidden');
        pizza2FlavorSection.classList.add('hidden');
        pizza3FlavorSection.classList.add('hidden'); // Esconde a terceira pizza se não for o Combo 4
        singleFlavorSection.classList.add('hidden');
        flavorInstructionTextSingle.textContent = 'Escolha a quantidade para cada sabor de esfirra doce.';
        document.querySelectorAll('#esfirra-doce-flavor-quantity-options .esfirra-flavor-item').forEach(itemDiv => {
            const flavorName = itemDiv.querySelector('span').textContent.trim();
            if (!sweetFlavors.includes(flavorName.replace(/\s*\(.*\)/, ''))) { // Remove info in parentheses for comparison
                itemDiv.style.display = 'none';
            } else {
                 itemDiv.style.display = 'flex';
            }
        });
    } else if (selectedItem.id === 'pizza-tradicional-grande' || selectedItem.id === 'pizza-media' || selectedItem.id === 'combo1' || selectedItem.id === 'pizza-day-1' || selectedItem.id === 'combo3') { // Adicionado Combo 3 aqui
        singleFlavorSection.classList.remove('hidden');
        pizza1FlavorSection.classList.add('hidden');
        pizza2FlavorSection.classList.add('hidden');
        pizza3FlavorSection.classList.add('hidden'); // Esconde a terceira pizza se não for o Combo 4
        esfirraOptionsSection.classList.add('hidden');
        esfirraDoceOptionsSection.classList.add('hidden');

        flavorInstructionTextSingle.textContent = `Escolha até 2 sabores para sua pizza. Se selecionar apenas 1, a pizza será inteira desse sabor.`;
        
        const forbiddenForTraditional = sweetFlavors.concat(['Frango com Catupiry', 'Calabresa com Catupiry', 'Bacon com Catupiry', 'Bacon com Cheddar']);
        flavorCheckboxesSingle.forEach(cb => {
            const label = cb.closest('label');
            if (forbiddenForTraditional.includes(cb.value)) {
                if (label) label.classList.add('disabled-option');
                if (label) label.style.display = 'none';
            } else {
                if (label) label.classList.remove('disabled-option');
                if (label) label.style.display = 'flex';
            }
        });
    } else if (selectedItem.id.includes('pizza-especial')) { 
        singleFlavorSection.classList.remove('hidden');
        pizza1FlavorSection.classList.add('hidden');
        pizza2FlavorSection.classList.add('hidden');
        pizza3FlavorSection.classList.add('hidden'); // Esconde a terceira pizza se não for o Combo 4
        esfirraOptionsSection.classList.add('hidden');
        esfirraDoceOptionsSection.classList.add('hidden');

        flavorInstructionTextSingle.textContent = `Escolha até 2 sabores para sua pizza. Se selecionar apenas 1, a pizza será inteira desse sabor.`;
        // No need to disable any flavors as all are allowed for special pizzas
        // Certifica-se que todos os sabores estão visíveis para pizza-especial
        flavorCheckboxesSingle.forEach(cb => {
            const label = cb.closest('label');
            if (label) {
                label.classList.remove('disabled-option');
                label.style.display = 'flex';
            }
        });
    } else if (selectedItem.id === 'esfirra-tradicional') { 
        esfirraOptionsSection.classList.remove('hidden');
        esfirraDoceOptionsSection.classList.add('hidden');
        pizza1FlavorSection.classList.add('hidden');
        pizza2FlavorSection.classList.add('hidden');
        pizza3FlavorSection.classList.add('hidden'); // Esconde a terceira pizza se não for o Combo 4
        singleFlavorSection.classList.add('hidden');
        flavorInstructionTextSingle.textContent = 'Escolha a quantidade para cada sabor de esfirra.';
        document.querySelectorAll('#esfirra-flavor-quantity-options .esfirra-flavor-item').forEach(itemDiv => {
            const flavorName = itemDiv.querySelector('span').textContent.trim();
            if (!esfirraTradicionalAllowedFlavors.includes(flavorName.replace(/\s*\(.*\)/, ''))) { // Remove info in parentheses for comparison
                itemDiv.style.display = 'none';
            } else {
                itemDiv.style.display = 'flex';
            }
        });
    } else if (selectedItem.id === 'esfirra-especial') { 
        esfirraOptionsSection.classList.remove('hidden');
        esfirraDoceOptionsSection.classList.add('hidden');
        pizza1FlavorSection.classList.add('hidden');
        pizza2FlavorSection.classList.add('hidden');
        pizza3FlavorSection.classList.add('hidden'); // Esconde a terceira pizza se não for o Combo 4
        singleFlavorSection.classList.add('hidden');
        flavorInstructionTextSingle.textContent = 'Escolha a quantidade para cada sabor de esfirra.';
        document.querySelectorAll('#esfirra-flavor-quantity-options .esfirra-flavor-item').forEach(itemDiv => {
            const flavorName = itemDiv.querySelector('span').textContent.trim();
            if (!esfirraEspecialAllowedFlavors.includes(flavorName.replace(/\s*\(.*\)/, ''))) { // Remove info in parentheses for comparison
                itemDiv.style.display = 'none';
            } else {
                itemDiv.style.display = 'flex';
            }
        });
    }
}

const forbiddenForTraditional = sweetFlavors.concat(['Frango com Catupiry', 'Calabresa com Catupiry', 'Bacon com Catupiry', 'Bacon com Cheddar']);
const forbiddenForSweet = traditionalFlavors.concat(['Frango', 'Frango com Catupiry', 'Calabresa com Catupiry', 'Bacon', 'Bacon com Catupiry', 'Bacon com Cheddar', 'Atum']); // Sabores salgados e especiais salgados proibidos para pizzas doces

function handleFlavorSelection(checkboxes, targetFlavorsArray) { 
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
            
            let maxAllowedFlavors = 2; // Padrão para pizzas salgadas
            if (checkboxes[0].name === "flavor-pizza3") { // Lógica específica para a pizza doce do Combo 4
                maxAllowedFlavors = 1;
            }

            let canSelectMore = true;

            if (checkedCount > maxAllowedFlavors) {
                event.target.checked = false; // Desmarca o último selecionado
                alert(`Você pode selecionar no máximo ${maxAllowedFlavors} sabores.`);
                canSelectMore = false;
            }
            
            // Lógica de validação de sabores com base no tipo de pizza
            if (canSelectMore && event.target.checked) {
                if (selectedItem.id === 'combo4' && (checkboxes[0].name === "flavor-pizza1" || checkboxes[0].name === "flavor-pizza2")) {
                    const disallowedFlavorsForCombo4Savory = sweetFlavors.concat(['Frango com Catupiry', 'Calabresa com Catupiry', 'Bacon com Catupiry', 'Bacon com Cheddar']);
                    if (disallowedFlavorsForCombo4Savory.includes(event.target.value)) {
                        event.target.checked = false;
                        alert(`O sabor "${event.target.value}" não é permitido para esta pizza salgada do Combo 4.`);
                        canSelectMore = false;
                    }
                } else if (selectedItem.id === 'combo4' && checkboxes[0].name === "flavor-pizza3") {
                    if (!sweetFlavors.includes(event.target.value)) { 
                        event.target.checked = false;
                        alert(`O sabor "${event.target.value}" não é um sabor doce e não é permitido para esta pizza doce do Combo 4.`);
                        canSelectMore = false;
                    }
                } else if (selectedItem.id === 'combo1' || selectedItem.id === 'pizza-day-1' || selectedItem.id === 'pizza-tradicional-grande' || selectedItem.id === 'pizza-media') {
                    if (forbiddenForTraditional.includes(event.target.value)) {
                        event.target.checked = false;
                        alert(`O sabor "${event.target.value}" não é permitido para este tipo de pizza.`);
                        canSelectMore = false;
                    }
                }
            }

            if(canSelectMore){
                if (checkboxes[0].name === "flavor") {
                    selectedFlavors = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
                } else if (checkboxes[0].name === "flavor-pizza1") {
                    selectedFlavorsPizza1 = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
                } else if (checkboxes[0].name === "flavor-pizza2") {
                    selectedFlavorsPizza2 = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
                } else if (checkboxes[0].name === "flavor-pizza3") { // NOVO: para a terceira pizza
                    selectedFlavorsPizza3 = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
                }
            }
            updateFinalizeButtonState();
        });
    });
}


function updateFinalizeButtonState() {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const addToCartMessage = document.getElementById('add-to-cart-message');
    const beverageOptionsWithQuantity = document.getElementById('beverage-options-with-quantity');


    console.log('--- updateFinalizeButtonState chamada ---');
    console.log('selectedItem:', selectedItem);
    console.log('selectedFlavors (no início de updateFinalizeButtonState):', selectedFlavors);
    console.log('selectedFlavorsPizza1 (no início de updateFinalizeButtonState):', selectedFlavorsPizza1);
    console.log('selectedFlavorsPizza2 (no início de updateFinalizeButtonState):', selectedFlavorsPizza2);
    console.log('selectedFlavorsPizza3 (no início de updateFinalizeButtonState):', selectedFlavorsPizza3); // NOVO
    console.log('esfirraQuantities (no início de updateFinalizeButtonState):', esfirraQuantities);
    console.log('beverageQuantities (no início de updateFinalizeButtonState):', beverageQuantities);

    let isConditionMet = false;
    addToCartMessage.textContent = '';

    const itemType = selectedItem.type;
    const itemId = selectedItem.id;

    if (itemType === 'combo' || itemId.includes('pizza') || itemId.includes('pizza-day')) {
        if (itemId === 'combo2' || itemId === 'pizza-day-2') {
            isConditionMet = (selectedFlavorsPizza1.length >= 1) && (selectedFlavorsPizza2.length >= 1);
        } else if (itemId === 'combo4') { // Lógica para Combo 4
            isConditionMet = (selectedFlavorsPizza1.length >= 1) && (selectedFlavorsPizza2.length >= 1) && (selectedFlavorsPizza3.length >= 1);
        }
        else {
            isConditionMet = (selectedFlavors.length >= 1);
        }
    } else if (itemId.includes('esfirra')) {
        let totalEsfirraQuantity = 0;
        for (const flavor in esfirraQuantities) {
            totalEsfirraQuantity += esfirraQuantities[flavor];
        }
        isConditionMet = (totalEsfirraQuantity > 0);
    } else {
        isConditionMet = true; 
    }

    if (beverageOptionsWithQuantity && !beverageOptionsWithQuantity.classList.contains('hidden')) {
        let totalBeverageQuantity = 0;
        for (const flavor in beverageQuantities) {
            totalBeverageQuantity += beverageQuantities[flavor].quantity;
        }
        
        if (selectedItem.type === 'beverage') {
            isConditionMet = (totalBeverageQuantity > 0);
        } else if (selectedItem.id === 'pizza-day-1' || selectedItem.id === 'combo1' || selectedItem.id === 'combo3') { 
            isConditionMet = isConditionMet && (beverageQuantities['Coca-cola 1L'] && beverageQuantities['Coca-cola 1L'].quantity === 1);
        } else if (selectedItem.id === 'pizza-day-2' || selectedItem.id === 'combo2') { 
            isConditionMet = isConditionMet && (beverageQuantities['Coca-cola 2L'] && beverageQuantities['Coca-cola 2L'].quantity === 1);
        } else if (selectedItem.id === 'combo4') { // Lógica para Combo 4
            isConditionMet = isConditionMet && (beverageQuantities['Coca-cola 2L'] && beverageQuantities['Coca-cola 2L'].quantity === 2);
        }
    }


    addToCartBtn.disabled = !isConditionMet;
    console.log('isConditionMet:', isConditionMet);
    console.log('addToCartBtn.disabled definido para:', !isConditionMet);
    console.log('-----------------------------------------');
}


function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const cartTotalPriceElement = document.getElementById('cart-total-price');

    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        if (emptyCartMessage) emptyCartMessage.classList.remove('hidden');
        if (placeOrderBtn) placeOrderBtn.disabled = true;
    } else {
        if (emptyCartMessage) emptyCartMessage.classList.add('hidden');
        if (placeOrderBtn) placeOrderBtn.disabled = false; 

        cart.forEach((item, index) => {
            let itemDisplayPrice = item.price;
            let itemDescription = '';

            if (item.type === 'beverage') {
                itemDescription = `Bebida: ${item.name}`;
            } else if (item.type.includes('esfirra') && item.flavors.length === 1) {
                itemDescription = `Sabor: ${item.flavors[0]}`;
            } else {
                let flavorsText = '';
                if (item.id === 'combo4' && item.flavors && item.flavors.pizza1 && item.flavors.pizza2 && item.flavors.pizza3) { // NOVO: Combo 4
                    flavorsText = `Pizza 1: (${item.flavors.pizza1.join(' e ' || 'N/A')})\n  Pizza 2: (${item.flavors.pizza2.join(' e ' || 'N/A')})\n  Pizza 3 (Doce): (${item.flavors.pizza3.join(' e ' || 'N/A')})`;
                } else if ((item.id === 'combo2' || item.id === 'pizza-day-2') && item.flavors && item.flavors.pizza1 && item.flavors.pizza2) {
                    flavorsText = `Pizza 1: (${item.flavors.pizza1.join(' e ')})\n  Pizza 2: (${item.flavors.pizza2.join(' e ')})`;
                } else if (item.flavors && item.flavors.length > 0) {
                    if (item.flavors.length === 1 && item.type.includes('esfirra')) {
                        flavorsText = ` (${item.flavors[0]})`;
                    } else if (item.flavors.length === 1) { 
                        flavorsText = ` (${item.flavors[0]} inteira)`;
                    }
                     else if (item.flavors.length === 2) { 
                        flavorsText = ` (${item.flavors[0]} e ${item.flavors[1]})`;
                    } else { 
                        flavorsText = ` (${item.flavors.join(', ')})`;
                    }
                } else {
                    flavorsText = 'N/A';
                }
                itemDescription = `Sabores: ${flavorsText}`;

                if (item.crust && item.crust.name !== 'Sem Borda Recheada') {
                    itemDescription += `<br>Borda: ${item.crust.name}`;
                }
            }
            
            const cartItemHtml = `
                <div class="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                    <div class="flex-grow">
                        <p class="text-lg font-bold text-gray-900">${item.name}</p>
                        <p class="text-sm text-gray-600">${itemDescription}</p>
                        <p class="text-sm text-gray-700 font-semibold">R$ ${itemDisplayPrice.toFixed(2).replace('.', ',')} /un</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="updateQuantity(${index}, -1)" class="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg">-</button>
                        <span class="text-xl font-bold">${item.quantity}</span>
                        <button onclick="updateQuantity(${index}, 1)" class="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg">+</button>
                        <button onclick="removeItemFromCart(${index})" class="bg-gray-400 hover:bg-gray-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg">x</button>
                    </div>
                </div>
            `;
            cartItemsContainer.innerHTML += cartItemHtml;
        });
        updateCartIconCount();
    }
    calculateTotalCartPrice();
}

function updateQuantity(index, change) {
    if (cart[index]) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
    }
    renderCart();
}

function removeItemFromCart(index) { // NOVO: Função para remover item
    if (cart[index]) {
        cart.splice(index, 1);
        renderCart();
    }
}

function calculateTotalCartPrice() {
    const cartTotalPriceElement = document.getElementById('cart-total-price');
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });

    let total = subtotal + deliveryFee; // Adiciona a taxa de entrega ao total
    cartTotalPriceElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function prepareWhatsAppMessage() {
    const addressStreetInput = document.getElementById('address-street');
    const addressNumberInput = document.getElementById('address-number');
    const addressNeighborhoodInput = document.getElementById('address-neighborhood');
    const addressReferenceInput = document.getElementById('address-reference');
    const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'Não informado';
    const orderNotes = document.getElementById('order-notes').value;


    let message = 'Olá! Gostaria de fazer um pedido na Rotella Pizzaria:\n\n*Itens do Pedido:*\n';

    cart.forEach(item => {
        let itemDetails = `- ${item.quantity}x ${item.name}`;
        if (item.type !== 'beverage') {
            let flavorsText = '';
            if (item.id === 'combo4' && item.flavors && item.flavors.pizza1 && item.flavors.pizza2 && item.flavors.pizza3) { // NOVO: Combo 4
                flavorsText = `\n  Pizza 1: (${item.flavors.pizza1.join(' e ' || 'N/A')})\n  Pizza 2: (${item.flavors.pizza2.join(' e ' || 'N/A')})\n  Pizza 3 (Doce): (${item.flavors.pizza3.join(' e ' || 'N/A')})`;
            } else if ((item.id === 'combo2' || item.id === 'pizza-day-2') && item.flavors && item.flavors.pizza1 && item.flavors.pizza2) {
                flavorsText = `\n  Pizza 1: (${item.flavors.pizza1.join(' e ')})\n  Pizza 2: (${item.flavors.pizza2.join(' e ')})`;
            } else if (item.flavors && item.flavors.length > 0) {
                if (item.flavors.length === 1 && item.type.includes('esfirra')) {
                    flavorsText = ` (${item.flavors[0]})`;
                } else if (item.flavors.length === 1) { 
                    flavorsText = ` (${item.flavors[0]} inteira)`;
                } else if (item.flavors.length === 2) { 
                    flavorsText = ` (${item.flavors[0]} e ${item.flavors[1]})`;
                } else { 
                    flavorsText = ` (${item.flavors.join(', ')})`;
                }
            }
            let crustText = '';
            if (item.crust && item.crust.name !== 'Sem Borda Recheada') {
                crustText = ` (Borda: ${item.crust.name})`;
            }
            itemDetails += flavorsText + crustText;
        }
        message += itemDetails + ` - R$ ${item.price.toFixed(2).replace('.', ',')}\n`;
    });

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalComTaxa = subtotal + deliveryFee;

message += `\n*Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}`;
message += `\n*Taxa de entrega:* R$ ${deliveryFee.toFixed(2).replace('.', ',')}`;
message += `\n*Total com entrega:* R$ ${totalComTaxa.toFixed(2).replace('.', ',')}\n\n`;
    
    if (orderNotes.trim() !== '') {
        message += `*Observações:* ${orderNotes.trim()}\n\n`;
    }

    message += `*Endereço de Entrega:*\n`;
    message += `Rua: ${addressStreetInput.value || 'Não informado'}\n`;
    message += `Número: ${addressNumberInput.value || 'Não informado'}\n`;
    message += `Bairro: ${addressNeighborhoodInput.value || 'Não informado'}\n`;
    if (addressReferenceInput.value) {
        message += `Ponto de Referência: ${addressReferenceInput.value}\n`;
    } else {
        message += `Ponto de Referência: Não informado\n`;
    }
    
    message += `\n*Forma de Pagamento:* ${selectedPaymentMethod}\n\n`;
    message += 'Aguardamos a confirmação!';

    return message;
}

function updatePizzariaStatus() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const statusElement = document.getElementById('pizzaria-status');
    let isOpen = false;
    let message = '';

    const openHour = 18;
    const closeHour = 0;

    if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
        if (currentHour >= openHour || currentHour < closeHour) {
            isOpen = true;
        }
    }

    if (isOpen) {
        message = '<span class="text-green-600">Pizzaria Aberta! Faça seu pedido!</span>';
    } else {
        message = '<span class="text-red-600">Pizzaria Fechada. Horário de funcionamento: Sex-Dom, 18h às 00h.</span>';
    }
    statusElement.innerHTML = message;
}


document.addEventListener('DOMContentLoaded', () => {
    const flavorCheckboxesSingle = document.querySelectorAll('input[name="flavor"]');
    const flavorCheckboxesPizza1 = document.querySelectorAll('input[name="flavor-pizza1"]');
    const flavorCheckboxesPizza2 = document.querySelectorAll('input[name="flavor-pizza2"]');
    const flavorCheckboxesPizza3 = document.querySelectorAll('input[name="flavor-pizza3"]'); // NOVO
    const stuffedCrustRadios = document.querySelectorAll('input[name="stuffed-crust"]');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const placeOrderBtn = document.getElementById('place-order-btn');

    handleFlavorSelection(flavorCheckboxesSingle, selectedFlavors);
    handleFlavorSelection(flavorCheckboxesPizza1, selectedFlavorsPizza1); // Não precisa de 'true' aqui, a lógica de combo é em updateFlavorSelectionInstructions
    handleFlavorSelection(flavorCheckboxesPizza2, selectedFlavorsPizza2);
    handleFlavorSelection(flavorCheckboxesPizza3, selectedFlavorsPizza3); // NOVO


    addToCartBtn.addEventListener('click', () => {
        if (selectedItem.id.includes('esfirra')) {
            for (const flavor in esfirraQuantities) {
                const quantity = esfirraQuantities[flavor];
                if (quantity > 0) {
                    cart.push({
                        name: `${selectedItem.name} (${flavor})`,
                        price: selectedItem.price,
                        quantity: quantity,
                        flavors: [flavor],
                        type: selectedItem.type,
                        id: `${selectedItem.id}-${flavor.toLowerCase().replace(/\s/g, '-')}`
                    });
                }
            }
        } else if (selectedItem.id === 'combo4') { // NOVO: Adiciona Combo 4
            cart.push({
                name: selectedItem.name,
                price: selectedItem.price + selectedCrust.price,
                quantity: 1, 
                flavors: { pizza1: selectedFlavorsPizza1, pizza2: selectedFlavorsPizza2, pizza3: selectedFlavorsPizza3 },
                type: selectedItem.type,
                id: selectedItem.id,
                crust: selectedCrust.name !== 'Sem Borda Recheada' ? selectedCrust : null
            });
        } else if (selectedItem.id === 'combo2' || selectedItem.id === 'pizza-day-2') {
            cart.push({
                name: selectedItem.name,
                price: selectedItem.price + selectedCrust.price,
                quantity: 1, 
                flavors: { pizza1: selectedFlavorsPizza1, pizza2: selectedFlavorsPizza2 },
                type: selectedItem.type,
                id: selectedItem.id,
                crust: selectedCrust.name !== 'Sem Borda Recheada' ? selectedCrust : null
            });
        } else {
            const isPizzaDay1 = selectedItem.id === 'pizza-day-1';
            
            cart.push({
                name: selectedItem.name,
                price: selectedItem.price + (isPizzaDay1 ? 0 : selectedCrust.price), 
                quantity: 1, 
                flavors: selectedFlavors,
                type: selectedItem.type,
                id: selectedItem.id,
                crust: (isPizzaDay1) ? { name: 'Borda Recheada Chocolate', price: 0, id: 'chocolate-crust' } : (selectedCrust.name !== 'Sem Borda Recheada' ? selectedCrust : null)
            });
        }

        for (const flavor in beverageQuantities) {
            const { quantity, price } = beverageQuantities[flavor];
            if (quantity > 0) {
                cart.push({
                    name: `${flavor}`,
                    price: price,
                    quantity: quantity,
                    flavors: [],
                    type: 'beverage',
                    id: `${flavor.toLowerCase().replace(/\s/g, '-')}`
                });
            }
        }

        updateCartIconCount();
        showPage('order-summary');
    });

    document.querySelectorAll('#esfirra-flavor-quantity-options .quantity-btn').forEach(button => {
        button.addEventListener('click', function() {
            const flavor = this.dataset.flavor;
            const action = this.dataset.action;
            const input = this.parentNode.querySelector('.quantity-input');
            let currentValue = parseInt(input.value);

            if (action === 'increase') {
                currentValue++;
            } else if (action === 'decrease' && currentValue > 0) {
                currentValue--;
            }
            input.value = currentValue;
            esfirraQuantities[flavor] = currentValue;
            updateFinalizeButtonState();
        });
    });

    document.querySelectorAll('#esfirra-flavor-quantity-options .quantity-input').forEach(input => {
        input.addEventListener('change', function() {
            const flavor = this.dataset.flavor;
            let currentValue = parseInt(this.value);
            if (isNaN(currentValue) || currentValue < 0) {
                currentValue = 0;
                this.value = 0;
            }
            esfirraQuantities[flavor] = currentValue;
            updateFinalizeButtonState();
        });
    });

    document.querySelectorAll('#esfirra-doce-flavor-quantity-options .quantity-btn').forEach(button => {
        button.addEventListener('click', function() {
            const flavor = this.dataset.flavor;
            const action = this.dataset.action;
            const input = this.parentNode.querySelector('.quantity-input');
            let currentValue = parseInt(input.value);

            if (action === 'increase') {
                currentValue++;
            } else if (action === 'decrease' && currentValue > 0) {
                currentValue--;
            }
            input.value = currentValue;
            esfirraQuantities[flavor] = currentValue; // Using esfirraQuantities for sweet too
            updateFinalizeButtonState();
        });
    });

    document.querySelectorAll('#esfirra-doce-flavor-quantity-options .quantity-input').forEach(input => {
        input.addEventListener('change', function() {
            const flavor = this.dataset.flavor;
            let currentValue = parseInt(this.value);
            if (isNaN(currentValue) || currentValue < 0) {
                currentValue = 0;
                this.value = 0;
            }
            esfirraQuantities[flavor] = currentValue; // Using esfirraQuantities for sweet too
            updateFinalizeButtonState();
        });
    });


    document.querySelectorAll('#beverage-options-with-quantity .quantity-btn').forEach(button => {
        button.addEventListener('click', function() {
            const flavor = this.dataset.beverageFlavor;
            const action = this.dataset.action;
            const input = this.parentNode.querySelector('.quantity-input');
            let currentValue = parseInt(input.value);
            const price = parseFloat(input.dataset.beveragePrice);

            if (action === 'increase') {
                currentValue++;
            } else if (action === 'decrease' && currentValue > 0) {
                currentValue--;
            }
            input.value = currentValue;
            beverageQuantities[flavor] = { quantity: currentValue, price: price };
            updateFinalizeButtonState();
        });
    });

    document.querySelectorAll('#beverage-options-with-quantity .quantity-input').forEach(input => {
        input.addEventListener('change', function() {
            const flavor = this.dataset.beverageFlavor;
            let currentValue = parseInt(this.value);
            const price = parseFloat(input.dataset.beveragePrice);
            if (isNaN(currentValue) || currentValue < 0) {
                currentValue = 0;
                this.value = 0;
            }
            beverageQuantities[flavor] = { quantity: currentValue, price: price };
            updateFinalizeButtonState();
        });
    });

    stuffedCrustRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            selectedCrust = {
                name: radio.value,
                price: parseFloat(radio.dataset.crustPrice),
                id: radio.dataset.crustId
            };
        });
    });

    showPage('main-menu');
    updateCartIconCount();
    updatePizzariaStatus();
    setInterval(updatePizzariaStatus, 60 * 1000); 
        
    placeOrderBtn.addEventListener('click', () => {
        const message = prepareWhatsAppMessage();
        const whatsappNumber = '5592986161640';
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    });

}); 
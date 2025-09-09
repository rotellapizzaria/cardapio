// ===== CONFIGURAÇÃO CENTRALIZADA =====

// Combos
const combos = {
    "Combo 1": { descricao: "1 Pizza grande tradicional (até dois sabores) + 1 Refri (Coca) de 1L.", valor: 44.90, maxSaboresPizza: 2 },
    "Combo 2": { descricao: "2 Pizzas grandes tradicionais (até dois sabores cada) + 1 Refri (Coca) de 2L.", valor: 79.90, maxSaboresPizza: 2 },
    "Combo 3": { descricao: "1 Pizza grande especial (até dois sabores) + 1 Refri (Coca) de 1L.", valor: 54.90, maxSaboresPizza: 2 },
    "Combo 4": { descricao: "2 Pizzas grandes tradicionais (até dois sabores cada) + 1 Pizza grande doce (até 1 sabor) + 2 Refris (Coca ou Fanta) de 2L.", valor: 134.90, maxSaboresPizza: 2 }
};

// Pizzas
const pizzas = {
    "Pizza Grande Tradicional": { valor: 39.90, maxSabores: 2 },
    "Pizza Grande Especial": { valor: 49.90, maxSabores: 2 },
    "Pizza Média Tradicional": { valor: 29.90, maxSabores: 2 },
    "Pizza Média Especial": { valor: 39.90, maxSabores: 2 }
};

// Esfirras
const esfirras = {
    "Esfirra Salgada Tradicional": { valor: 6.90, maxSabores: 1 },
    "Esfirra Salgada Especial": { valor: 7.90, maxSabores: 1 },
    "Esfirra Doce": { valor: 7.90, maxSabores: 1 }
};

// Sabores
const sabores = {
    tradicionais: ["Portuguesa", "Calabresa", "Mussarela", "Marguerita", "Frango", "Bacon", "Atum"],
    especiais: ["Frango com Catupiry", "Calabresa com Catupiry", "Bacon com Catupiry", "Bacon com Cheddar"],
    doces: ["M&M", "Brigadeiro", "Romeu e Julieta", "Doce de Leite", "Oreo"]
};

// Refrigerantes pagos
const refrigerantes = {
    "Coca-cola 1L": 9.90,
    "Coca-cola 2L": 13.90,
    "Fanta Laranja 1L": 9.90,
    "Fanta Laranja 2L": 12.90
};

// ===== VARIÁVEIS GLOBAIS =====
let pedido = {
    tipo: '',
    item: '',
    sabores: [],
    refrigerantes: {},
    cliente: '',
    pagamento: '',
    observacao: '',
    retiradaLocal: false,
    horaPedido: '',
    endereco: { logradouro: '', numero: '', bairro: '', complemento: '' },
    valor: 0
};

let listaPedidos = [];
let numeroPedidoAtual = 1;

// ===== FUNÇÕES =====
window.onload = () => {
    const pedidosSalvos = localStorage.getItem('listaPedidos');
    const numeroSalvo = localStorage.getItem('numeroPedidoAtual');

    if (pedidosSalvos) listaPedidos = JSON.parse(pedidosSalvos);
    if (numeroSalvo) numeroPedidoAtual = parseInt(numeroSalvo);

    gerarBotoes("botoes-combos", combos, "combo");
    gerarBotoes("botoes-pizzas", pizzas, "pizza");
    gerarBotoes("botoes-esfirras", esfirras, "esfirra");
};

function gerarBotoes(containerId, lista, tipo) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    Object.keys(lista).forEach(nome => {
        const btnContainer = document.createElement("div");
        btnContainer.style.marginBottom = "10px";

        const btn = document.createElement("button");
        btn.className = "btn";
        btn.textContent = `${nome} - R$ ${lista[nome].valor.toFixed(2)}`;
        btn.onclick = () => selecionarItem(tipo, nome);
        btnContainer.appendChild(btn);

        if (tipo === "combo" && lista[nome].descricao) {
            const desc = document.createElement("div");
            desc.style.fontSize = "14px";
            desc.style.marginTop = "5px";
            desc.style.textAlign = "left";
            desc.innerHTML = `<em>${lista[nome].descricao}</em>`;
            btnContainer.appendChild(desc);
        }

        container.appendChild(btnContainer);
    });
}

function selecionarItem(tipo, nome) {
    pedido.tipo = tipo;
    pedido.item = nome;
    pedido.sabores = [];
    pedido.refrigerantes = {};
    pedido.origem = 'tela-tipo';

    let maxSabores = 1;
    if (tipo === "combo") maxSabores = combos[nome].maxSaboresPizza;
    if (tipo === "pizza") maxSabores = pizzas[nome].maxSabores;
    if (tipo === "esfirra") maxSabores = esfirras[nome].maxSabores;

    document.getElementById('info-sabores').textContent = `Escolha de 1 até ${maxSabores} sabores.`;
    gerarBotoesSabores(tipo, nome);
    mostrarTela('tela-sabores');
}

function gerarBotoesSabores(tipo, nome) {
    const containerSabores = document.getElementById("botoes-sabores");
    containerSabores.innerHTML = "";

    const resumoSabores = document.createElement("div");
    resumoSabores.id = "resumo-sabores";
    resumoSabores.innerHTML = `<strong>Sabores selecionados:</strong> Nenhum`;
    containerSabores.appendChild(resumoSabores);

    let listaSabores = [];
    if (tipo === "esfirra" && nome.includes("Doce")) listaSabores = sabores.doces;
    else if (nome.includes("Especial")) listaSabores = sabores.especiais;
    else if (nome.includes("Doce")) listaSabores = sabores.doces;
    else listaSabores = sabores.tradicionais;

    listaSabores.forEach(s => {
        const btn = document.createElement("button");
        btn.className = "btn";
        btn.textContent = s;
        btn.onclick = () => toggleSabor(s);
        containerSabores.appendChild(btn);
    });

    const containerRefri = document.createElement("div");
    containerRefri.innerHTML = `<h3>Refrigerantes</h3>`;
    const resumoRefri = document.createElement("div");
    resumoRefri.id = "resumo-refri";
    resumoRefri.innerHTML = `<strong>Refrigerantes selecionados:</strong> Nenhum`;
    containerRefri.appendChild(resumoRefri);

    // Refrigerantes grátis por combo
    if (tipo === "combo") {
        let gratis = [];
        if (nome === "Combo 1" || nome === "Combo 3") gratis = ["Coca-cola 1L"];
        if (nome === "Combo 2") gratis = ["Coca-cola 2L"];
        if (nome === "Combo 4") gratis = ["Coca-cola 2L", "Fanta Laranja 2L"];

        gratis.forEach(r => {
            if (!pedido.refrigerantes[r]) pedido.refrigerantes[r] = 0;
            const refriDiv = document.createElement("div");
            refriDiv.className = "refri-item";
            refriDiv.innerHTML = `
                <span>${r} - R$ 0,00 (Grátis do combo)</span>
                <button onclick="alterarQtdRefriGratis('${r}', -1)">➖</button>
                <span id="qtd-${r}">${pedido.refrigerantes[r]}</span>
                <button onclick="alterarQtdRefriGratis('${r}', 1)">➕</button>
            `;
            containerRefri.appendChild(refriDiv);
        });
    }

    // Refrigerantes pagos
    Object.keys(refrigerantes).forEach(r => {
        if (!pedido.refrigerantes[r]) pedido.refrigerantes[r] = 0;
        const refriDiv = document.createElement("div");
        refriDiv.className = "refri-item";
        refriDiv.innerHTML = `
            <span>${r} - R$ ${refrigerantes[r].toFixed(2)}</span>
            <button onclick="alterarQtdRefri('${r}', -1)">➖</button>
            <span id="qtd-${r}">${pedido.refrigerantes[r]}</span>
            <button onclick="alterarQtdRefri('${r}', 1)">➕</button>
        `;
        containerRefri.appendChild(refriDiv);
    });

    containerSabores.appendChild(containerRefri);
}

function toggleSabor(sabor) {
    const max = pedido.tipo === "combo" ? combos[pedido.item].maxSaboresPizza :
                pedido.tipo === "pizza" ? pizzas[pedido.item].maxSabores :
                esfirras[pedido.item].maxSabores;

    if (pedido.sabores.includes(sabor)) {
        pedido.sabores = pedido.sabores.filter(s => s !== sabor);
    } else {
        if (pedido.sabores.length >= max) {
            alert(`Máximo de ${max} sabores permitido!`);
            return;
        }
        pedido.sabores.push(sabor);
    }
    atualizarResumoParcialSabores();
}

function atualizarResumoParcialSabores() {
    const resumoSabores = document.getElementById("resumo-sabores");
    if (resumoSabores) {
        resumoSabores.innerHTML = `<strong>Sabores selecionados:</strong> ${pedido.sabores.join(", ") || "Nenhum"}`;
    }
}

function alterarQtdRefriGratis(nome, delta) {
    if (!pedido.refrigerantes[nome]) pedido.refrigerantes[nome] = 0;
    pedido.refrigerantes[nome] += delta;
    if (pedido.refrigerantes[nome] < 0) pedido.refrigerantes[nome] = 0;
    document.getElementById(`qtd-${nome}`).textContent = pedido.refrigerantes[nome];
    atualizarResumoParcialRefrigerantes();
}

function alterarQtdRefri(nome, delta) {
    if (!pedido.refrigerantes[nome]) pedido.refrigerantes[nome] = 0;
    pedido.refrigerantes[nome] += delta;
    if (pedido.refrigerantes[nome] < 0) pedido.refrigerantes[nome] = 0;
    document.getElementById(`qtd-${nome}`).textContent = pedido.refrigerantes[nome];
    atualizarResumoParcialRefrigerantes();
}

function atualizarResumoParcialRefrigerantes() {
    const resumoRefri = document.getElementById("resumo-refri");
    if (resumoRefri) {
        const lista = Object.keys(pedido.refrigerantes || {})
            .filter(r => pedido.refrigerantes && pedido.refrigerantes[r] > 0)
            .map(r => `${pedido.refrigerantes[r]}x ${r}`)
            .join(", ");
        resumoRefri.innerHTML = `<strong>Refrigerantes selecionados:</strong> ${lista || "Nenhum"}`;
    }
}

function confirmarSabores() {
    if (pedido.sabores.length < 1) {
        alert("Escolha pelo menos 1 sabor");
        return;
    }
    atualizarResumoParcialEndereco();
    mostrarTela('tela-endereco');
}

function atualizarResumoParcialEndereco() {
    const resumoDiv = document.getElementById("resumo-parcial");
    let listaRefri = Object.keys(pedido.refrigerantes || {})
        .filter(r => pedido.refrigerantes && pedido.refrigerantes[r] > 0)
        .map(r => `${pedido.refrigerantes[r]}x ${r}`)
        .join(", ") || "Nenhum";
    
    resumoDiv.innerHTML = `
        <strong>Resumo do Pedido:</strong><br>
        Item: ${pedido.item}<br>
        Sabores: ${pedido.sabores.join(", ")}<br>
        Refrigerantes: ${listaRefri}<br>
        Valor parcial: R$ ${calcularValorPedido(pedido)}
    `;
}

function salvarEndereco() {
    pedido.retiradaLocal = document.getElementById('retiradaLocal').checked;

    pedido.cliente = document.getElementById('cliente').value;
    pedido.endereco.logradouro = document.getElementById('logradouro').value;
    pedido.endereco.numero = document.getElementById('numero').value;
    pedido.endereco.bairro = document.getElementById('bairro').value;
    pedido.endereco.complemento = document.getElementById('complemento').value;
    pedido.observacao = document.getElementById('observacao').value;

    const pagamentoSelecionado = document.querySelector('input[name="pagamento"]:checked');
    pedido.pagamento = pagamentoSelecionado ? pagamentoSelecionado.value : '';

    if (!pedido.retiradaLocal && !pedido.endereco.logradouro && !pedido.endereco.numero && !pedido.endereco.bairro) {
        alert("Preencha o endereço ou marque 'Retirada no local'.");
        return;
    }

    // Hora do pedido
    const agora = new Date();
    pedido.horaPedido = agora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    pedido.valor = calcularValorPedido(pedido);

    document.getElementById('resumo').innerText =
        `Pedido #${numeroPedidoAtual}\n` +
        (pedido.cliente ? `Cliente: ${pedido.cliente}\n` : '') +
        `Hora do Pedido: ${pedido.horaPedido}\n` +
        `Item: ${pedido.item}\nSabores: ${pedido.sabores.join(", ")}\n` +
        (Object.keys(pedido.refrigerantes || {}).some(r => pedido.refrigerantes[r] > 0) ?
         `Refrigerantes: ${Object.keys(pedido.refrigerantes || {})
            .map(r => pedido.refrigerantes[r] > 0 ? `${pedido.refrigerantes[r]}x ${r}` : '')
            .filter(Boolean).join(", ")}\n` : '') +
        `Pagamento: ${pedido.pagamento || 'Não informado'}\n` +
        (pedido.retiradaLocal ? `Retirada no local\n` :
            `Entrega: ${pedido.endereco.logradouro || ''}, ${pedido.endereco.numero || ''} - ${pedido.endereco.bairro || ''}\n` +
            `Compl.: ${pedido.endereco.complemento || '---'}\n`) +
        (pedido.observacao ? `Obs: ${pedido.observacao}\n` : '') +
        `Total: R$ ${pedido.valor}`;
    
    mostrarTela('tela-resumo');
}

function calcularValorPedido(p) {
    let total = 0;
    if (p.tipo === "combo") total = combos[p.item].valor;
    if (p.tipo === "pizza") total = pizzas[p.item].valor;
    if (p.tipo === "esfirra") total = esfirras[p.item].valor;

    Object.keys(p.refrigerantes || {}).forEach(refri => {
        // Pular refrigerantes grátis do combo
        if (p.tipo === "combo") {
            if ((p.item === "Combo 1" || p.item === "Combo 3") && refri === "Coca-cola 1L") return;
            if (p.item === "Combo 2" && refri === "Coca-cola 2L") return;
            if (p.item === "Combo 4" && (refri === "Coca-cola 2L" || refri === "Fanta Laranja 2L")) return;
        }
        total += refrigerantes[refri] * p.refrigerantes[refri];
    });

    return total.toFixed(2);
}

function confirmarPedido() {
    let pedidoComNumero = { ...pedido, numero: numeroPedidoAtual };
    listaPedidos.push(pedidoComNumero);

    salvarNoLocalStorage();
    numeroPedidoAtual++;
    localStorage.setItem('numeroPedidoAtual', numeroPedidoAtual);

    let listaRefriImpressao = Object.keys(pedidoComNumero.refrigerantes || {})
        .filter(r => pedidoComNumero.refrigerantes && pedidoComNumero.refrigerantes[r] > 0)
        .map(r => `${pedidoComNumero.refrigerantes[r]}x ${r}`)
        .join(", ") || "Nenhum";

    let conteudoImpressao = `
        <html><head><meta charset="UTF-8">
        <title>Pedido #${pedidoComNumero.numero}</title>
        <style>
            body { font-family: monospace; font-size: 14px; width: 80mm; }
            h2 { text-align: center; font-size: 16px; margin-bottom: 5px; }
            .linha { border-top: 1px dashed #000; margin: 5px 0; }
            .campo { margin-bottom: 4px; }
            .negrito { font-weight: bold; }
            .centro { text-align: center; }
        </style>
        </head><body>
            <h2>🍕 Pizzaria Exemplo</h2>
            <div class="linha"></div>
            <div class="campo negrito">PEDIDO #${pedidoComNumero.numero}</div>
            <div class="campo">Hora do Pedido: ${pedidoComNumero.horaPedido}</div>

            <div class="linha"></div>
            <div class="campo">Item: ${pedidoComNumero.item}</div>
            <div class="campo">Sabores: ${pedidoComNumero.sabores.join(", ")}</div>
            <div class="campo">Refrigerantes: ${listaRefriImpressao}</div>
            ${pedidoComNumero.observacao ? `<div class="campo">Obs: ${pedidoComNumero.observacao}</div>` : ''}

            <div class="linha"></div>
            <div class="campo negrito">ENTREGA:</div>
            ${pedidoComNumero.retiradaLocal ? 
                `<div class="campo">Retirada no local</div>` :
                `<div class="campo">${pedidoComNumero.endereco.logradouro || ''}, ${pedidoComNumero.endereco.numero || ''}</div>
                 <div class="campo">Bairro: ${pedidoComNumero.endereco.bairro || ''}</div>
                 <div class="campo">Compl.: ${pedidoComNumero.endereco.complemento || '---'}</div>`}

            <div class="linha"></div>
            <div class="campo negrito">TOTAL: R$ ${pedidoComNumero.valor}</div>
            <div class="campo">Pagamento: ${pedidoComNumero.pagamento || 'Não informado'}</div>

            <div class="linha"></div>
            <div class="centro">Obrigado e bom apetite!</div>
            <div class="linha"></div>
        </body></html>
    `;

    let janela = window.open('', '', 'width=400,height=600');
    janela.document.write(conteudoImpressao);
    janela.document.close();
    janela.print();
    janela.close();

    limparPedidoAtual(false);
    mostrarTela('tela-tipo');
}

function limparPedidoAtual(mostrarAlerta = true) {
    pedido = {
        tipo: '',
        item: '',
        sabores: [],
        refrigerantes: {},
        cliente: '',
        pagamento: '',
        observacao: '',
        retiradaLocal: false,
        horaPedido: '',
        endereco: { logradouro: '', numero: '', bairro: '', complemento: '' },
        valor: 0
    };
    document.querySelectorAll('.input').forEach(input => input.value = '');
    document.querySelectorAll('input[name="pagamento"]').forEach(r => r.checked = false);
    document.getElementById('retiradaLocal').checked = false;
    if (mostrarAlerta) alert("🗑 Pedido atual foi limpo!");
    mostrarTela('tela-tipo');
}

function mostrarTela(id) {
    document.querySelectorAll('.tela').forEach(tela => tela.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    if (id === 'tela-pedidos') atualizarListaPedidos();
}

function voltar(id) {
    mostrarTela(id);
}

function atualizarListaPedidos() {
    const listaDiv = document.getElementById('lista-pedidos');
    listaDiv.innerHTML = '';

    if (listaPedidos.length === 0) {
        listaDiv.innerHTML = '<p>Nenhum pedido registrado.</p>';
        return;
    }

    listaPedidos.forEach((p) => {
        let listaRefriResumo = Object.keys(p.refrigerantes || {})
            .filter(r => p.refrigerantes && p.refrigerantes[r] > 0)
            .map(r => `${p.refrigerantes[r]}x ${r}`)
            .join(", ");

        listaDiv.innerHTML += `
            <div style="margin-bottom:10px;padding:10px;border-bottom:1px solid #ccc;">
                <strong>Pedido #${p.numero}</strong><br>
                Hora: ${p.horaPedido || '--:--'}<br>
                ${p.cliente ? `👤 ${p.cliente}<br>` : ''}
                🍕 ${p.item}<br>
                🍴 ${p.sabores.join(", ")}<br>
                ${listaRefriResumo ? `🥤 ${listaRefriResumo}<br>` : ''}
                💳 ${p.pagamento || 'Não informado'}<br>
                ${p.retiradaLocal ? `📍 Retirada no local<br>` : `📍 ${p.endereco.logradouro}, ${p.endereco.numero} - ${p.endereco.bairro}<br>`}
                💬 ${p.endereco.complemento || '---'}<br>
                ${p.observacao ? `📝 ${p.observacao}<br>` : ''}
                💰 Total: R$ ${p.valor}
            </div>
        `;
    });
}

function salvarNoLocalStorage() {
    localStorage.setItem('listaPedidos', JSON.stringify(listaPedidos));
    localStorage.setItem('numeroPedidoAtual', numeroPedidoAtual);
}
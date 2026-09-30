
const ALVO_MS = 5000;       
const OCULTAR_APOS_MS = 2000; 
const CHAVE_RANKING = "jogo5s-ranking";
const CHAVE_NOME = "jogo5s-nome";
const MAX_NO_RANKING = 10;

const telas = {
  nome: document.getElementById("tela-nome"),
  jogo: document.getElementById("tela-jogo"),
  resultado: document.getElementById("tela-resultado"),
};
const formNome = document.getElementById("form-nome");
const campoNome = document.getElementById("nome");
const saudacao = document.getElementById("saudacao");
const relogio = document.getElementById("relogio");
const visor = document.getElementById("visor");
const dica = document.getElementById("dica");
const botaoJogar = document.getElementById("botao-jogar");
const botaoDeNovo = document.getElementById("botao-de-novo");
const mensagem = document.getElementById("mensagem");
const diferencaEl = document.getElementById("diferenca");
const legenda = document.getElementById("legenda");
const listaRanking = document.getElementById("ranking");


let tela = "nome";      
let rodando = false;
let inicio = 0;
let quadro = null;
let jogador = "";


function mostrarTela(qual) {
  tela = qual;
  for (const [nome, el] of Object.entries(telas)) {
    el.hidden = nome !== qual;
  }
}
function pedirNome() {
  campoNome.value = localStorage.getItem(CHAVE_NOME) || "";
  mostrarTela("nome");
  campoNome.focus();
  campoNome.select();
}
function prepararJogo() {
  rodando = false;
  relogio.classList.remove("rodando");
  botaoJogar.classList.remove("rodando");
  botaoJogar.textContent = "Começar";
  visor.textContent = "0.00";
  dica.innerHTML = "Aperte <kbd>Espaço</kbd> ou o botão para começar";
  saudacao.textContent = `Boa sorte, ${jogador}!`;
  mostrarTela("jogo");
  botaoJogar.focus();
}
function comecar() {
  rodando = true;
  inicio = Date.now();
  relogio.classList.add("rodando");
  botaoJogar.classList.add("rodando");
  botaoJogar.textContent = "Parar";
  dica.textContent = "Agora aperte quando chegar em 5 segundos";
  atualizarVisor();
}

function atualizarVisor() {
  if (!rodando) return;
  const passou = Date.now() - inicio;

  if (passou < OCULTAR_APOS_MS) {
    visor.textContent = (passou / 1000).toFixed(2);
  } else {
    visor.textContent = "?";
    dica.textContent = "O relógio sumiu. Confie no seu ritmo!";
  }
  quadro = requestAnimationFrame(atualizarVisor);
}
function parar() {
  const passou = Date.now() - inicio;
  rodando = false;
  cancelAnimationFrame(quadro);
  const diferenca = (passou - ALVO_MS) / 1000;
  const registro = salvarNoRanking(jogador, diferenca);
  mostrarResultado(diferenca, registro);
}
function acionar() {
  if (tela !== "jogo") return;
  if (rodando) parar();
  else comecar();
}
function lerRanking() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_RANKING)) || [];
  } catch {
    return [];
  }
}
function salvarNoRanking(nome, diferenca) {
  const registro = { nome, diferenca, quando: Date.now() };
  const lista = lerRanking();
  lista.push(registro);

  lista.sort((a, b) => Math.abs(a.diferenca) - Math.abs(b.diferenca));
  localStorage.setItem(CHAVE_RANKING, JSON.stringify(lista.slice(0, MAX_NO_RANKING)));
  return registro;
}
function formatar(diferenca) {
  const sinal = diferenca > 0 ? "+" : "";
  return sinal + diferenca.toFixed(4);
}
function mostrarResultado(diferenca, registro) {
  const absoluta = Math.abs(diferenca);
  diferencaEl.textContent = formatar(diferenca);
  diferencaEl.classList.toggle("cravou", absoluta < 0.05);
  if (absoluta < 0.01) {
    mensagem.textContent = "Uau, quase perfeito!";
  } else if (absoluta < 0.1) {
    mensagem.textContent = "Muito perto!";
  } else if (absoluta < 0.5) {
    mensagem.textContent = "Boa, dá pra melhorar!";
  } else {
    mensagem.textContent = "Errou feio, tente de novo!";
  }
  legenda.textContent = diferenca < 0
    ? "segundos antes dos 5s"
    : diferenca > 0
      ? "segundos depois dos 5s"
      : "exatamente 5s!";
  desenharRanking(registro);
  mostrarTela("resultado");
  botaoDeNovo.focus();
}
function desenharRanking(registroAtual) {
  const lista = lerRanking();
  listaRanking.innerHTML = "";

  if (lista.length === 0) {
    listaRanking.innerHTML = '<li><span class="vazio">Ainda não tem ninguém aqui.</span></li>';
    return;
  }
  let marcou = false;
  lista.forEach((item, i) => {
    const li = document.createElement("li");

    if (!marcou && item.quando === registroAtual.quando) {
      li.classList.add("voce");
      marcou = true;
    }
    const pos = document.createElement("span");
    pos.className = "pos";
    pos.textContent = `${i + 1}º`;

    const nome = document.createElement("span");
    nome.className = "nome";
    nome.textContent = item.nome; 

    const tempo = document.createElement("span");
    tempo.className = "tempo";
    tempo.textContent = formatar(item.diferenca);

    li.append(pos, nome, tempo);
    listaRanking.append(li);
  });
}
formNome.addEventListener("submit", (e) => {
  e.preventDefault();
  const nome = campoNome.value.trim();
  if (!nome) return;
  jogador = nome;
  localStorage.setItem(CHAVE_NOME, nome);
  prepararJogo();
});

botaoJogar.addEventListener("click", acionar);
botaoDeNovo.addEventListener("click", pedirNome);

document.addEventListener("keydown", (e) => {
  if (e.code !== "Space" || e.repeat) return;
  if (tela !== "jogo") return; 
  e.preventDefault();          
  acionar();
});
pedirNome();
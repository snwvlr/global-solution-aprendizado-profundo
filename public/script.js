const formulario = document.querySelector(".formulario");
const mensagem = document.querySelector(".mensagem");
const resultado = document.querySelector(".resultado");

const ORDEM_PERIODO = ["Madrugada", "Manhã", "Tarde", "Noite"];
const ORDEM_DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const PALAVRAS_MINUSCULAS = ["de", "da", "do", "das", "dos", "e"];

function capitalizar(texto) {
  return texto
    .toLowerCase()
    .split(" ")
    .map((palavra, i) => {
      if (i > 0 && PALAVRAS_MINUSCULAS.includes(palavra)) {
        return palavra;
      }
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(" ");
}

// "14º D.P. PINHEIROS" vira "Pinheiros (14º DP)"
function nomeRegiao(valor) {
  const dp = valor.match(/^(\d+º) D\.?P\.? (?:- )?(.+)$/);
  if (dp) {
    const nome = dp[2] === "SE" ? "Sé" : capitalizar(dp[2]);
    return nome + " (" + dp[1] + " DP)";
  }
  const seccional = valor.match(/^DEL\.SEC\.(\d+ª) (.+)$/);
  if (seccional) {
    return capitalizar(seccional[2]) + " (" + seccional[1] + " Seccional)";
  }
  return capitalizar(valor);
}

function preencher(nome, valores, ordem, rotulo) {
  const select = formulario.elements[nome];
  let lista = [...valores];

  if (ordem) {
    lista.sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
  } else {
    lista.sort((a, b) => (rotulo ? rotulo(a) : a).localeCompare(rotulo ? rotulo(b) : b));
    // "Outros" e "Outras" ficam no fim da lista
    lista = lista.filter((v) => !v.startsWith("Outr")).concat(lista.filter((v) => v.startsWith("Outr")));
  }

  select.innerHTML = "";
  lista.forEach((valor) => {
    select.innerHTML += `<option value="${valor}">${rotulo ? rotulo(valor) : valor}</option>`;
  });
}

function porcentagem(valor) {
  return (valor * 100).toFixed(1).replace(".", ",") + "%";
}

async function carregarModelo() {
  mensagem.textContent = "Carregando o modelo...";

  try {
    const resposta = await fetch("/api/prever");
    if (resposta.status !== 200) {
      mensagem.textContent = "Não foi possível carregar o modelo (status " + resposta.status + ").";
      return;
    }

    // as opções dos dropdowns vêm do próprio modelo
    const modelo = await resposta.json();
    const categorias = modelo.categoricos;

    preencher("regiao", categorias.regiao, null, nomeRegiao);
    preencher("periodo", categorias.periodo, ORDEM_PERIODO);
    preencher("dia_semana", categorias.dia_semana, ORDEM_DIAS);
    preencher("local", categorias.local);
    preencher("marca", categorias.marca);

    document.querySelector(".arquitetura").textContent = "Arquitetura escolhida: " + modelo.arquitetura;
    for (const [nome, valor] of Object.entries(modelo.metricas_teste)) {
      document.querySelector(".m-" + nome).textContent = porcentagem(valor);
    }
    mensagem.textContent = "";
  } catch (erro) {
    mensagem.textContent = "Não foi possível conectar ao servidor.";
  }
}

async function classificar(event) {
  event.preventDefault();

  const dados = {
    regiao: formulario.elements.regiao.value,
    periodo: formulario.elements.periodo.value,
    dia_semana: formulario.elements.dia_semana.value,
    local: formulario.elements.local.value,
    marca: formulario.elements.marca.value,
    qtd_celulares: Number(formulario.elements.qtd_celulares.value),
  };

  if (dados.qtd_celulares < 1 || dados.qtd_celulares > 5) {
    mensagem.textContent = "A quantidade de celulares deve ser de 1 a 5.";
    return;
  }

  mensagem.textContent = "Classificando...";

  try {
    const resposta = await fetch("/api/prever", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    const corpo = await resposta.json();

    if (resposta.status !== 200) {
      mensagem.textContent = corpo.erro || "Erro ao classificar.";
      return;
    }

    mostrarResultado(corpo, dados);
    mensagem.textContent = "";
  } catch (erro) {
    mensagem.textContent = "Não foi possível conectar ao servidor.";
  }
}

function mostrarResultado(corpo, dados) {
  resultado.classList.remove("escondido");

  const classe = document.querySelector(".classe");
  classe.textContent = "Classe estimada: " + corpo.classe;
  classe.className = "classe " + (corpo.classe === "Roubo" ? "e-roubo" : "e-furto");

  document.querySelector(".barra-roubo").style.width = corpo.roubo * 100 + "%";
  document.querySelector(".barra-furto").style.width = corpo.furto * 100 + "%";
  document.querySelector(".valor-roubo").textContent = porcentagem(corpo.roubo);
  document.querySelector(".valor-furto").textContent = porcentagem(corpo.furto);

  const fimDeSemana = dados.dia_semana === "Sábado" || dados.dia_semana === "Domingo";
  const dia = (fimDeSemana ? "num " : "numa ") + dados.dia_semana.toLowerCase() + (fimDeSemana ? "" : "-feira");

  document.querySelector(".interpretacao").textContent =
    "Considerando que uma ocorrência aconteceu em " + nomeRegiao(dados.regiao) + ", " +
    dia + ", no período da " + dados.periodo.toLowerCase() + ", em " +
    dados.local.toLowerCase() + ", o modelo atribui " + porcentagem(corpo.roubo) + " de probabilidade à classe roubo e " +
    porcentagem(corpo.furto) + " à classe furto.";

  resultado.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

carregarModelo();

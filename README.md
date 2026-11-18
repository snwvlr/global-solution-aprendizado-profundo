# Roubo ou furto? Classificação de ocorrências com MLP

Rede neural MLP que classifica ocorrências de subtração de celular na cidade de São Paulo como **roubo** ou **furto**, com uma aplicação web para testar o modelo.

Global Solution 2026.2 - Aprendizado Profundo com Redes Neurais Convolucionais - FIAP

**Aplicação web:** https://global-solution-aprendizado-profund.vercel.app

O modelo não prevê se um crime vai acontecer. Ele indica se uma ocorrência com certas características é mais compatível com roubo ou com furto.

## Integrantes

- João Vitor Anunciação Oliveira - RM567539
- Paulo Ribeiro Marinho - RM567459

## Fonte dos dados

- **Origem:** SSP-SP, Portal de Estatísticas, Consultas > Bases de Dados: https://www.ssp.sp.gov.br/estatistica/consultas
- **Base:** Celulares Subtraídos, arquivo `CelularesSubtraidos_2025.xlsx` (boletins de 2025)

**Como obter o arquivo:**

1. Acessar o endereço acima e abrir a seção *Bases de Dados*.
2. Escolher *Celulares Subtraídos* e o ano de 2025.
3. Salvar o arquivo em `dados/CelularesSubtraidos_2025.xlsx`.

O arquivo tem 108 MB e passa do limite do GitHub, por isso não está no repositório. A amostra de 20 mil boletins usada no treino (`dados/amostra_celulares_capital_2025.csv`) está incluída, então o notebook roda sem o arquivo original.

## Estrutura

```
├── notebook/        notebook do modelo e requirements.txt
├── dados/           amostra usada no treino
├── modelo/          modelo treinado (.keras e .json)
├── api/prever.py    função que calcula a previsão
├── public/          página da aplicação (HTML, CSS e JavaScript)
├── relatorio/       relatório em PDF (10 slides)
└── servidor_local.py
```

## Como executar o notebook

```bash
pip install -r notebook/requirements.txt
jupyter notebook notebook/GS_MLP_Roubo_Furto.ipynb
```

O notebook usa Keras 3 com backend PyTorch. No Google Colab, roda com TensorFlow definindo `KERAS_BACKEND=tensorflow`.

## Aplicação web

A aplicação lê os pesos da rede salvos em `modelo/modelo_mlp.json` e calcula a previsão com NumPy, sem precisar de TensorFlow no servidor.

Para rodar no computador:

```bash
pip install numpy
python servidor_local.py
```

Depois, abrir http://localhost:8000.

Para publicar no Vercel, importar este repositório em vercel.com (Add New > Project) e clicar em Deploy.

# função que o Vercel chama para fazer a previsão. Ela lê os pesos que o notebook exportou
# e faz a conta da rede com NumPy, porque o TensorFlow não cabe no plano grátis

import json
from http.server import BaseHTTPRequestHandler
from pathlib import Path

import numpy as np

ARQUIVO_MODELO = Path(__file__).resolve().parent.parent / "modelo" / "modelo_mlp.json"
MODELO = json.loads(ARQUIVO_MODELO.read_text(encoding="utf-8"))
CAMADAS = [(np.array(c["pesos"]), np.array(c["bias"]), c["ativacao"]) for c in MODELO["camadas"]]


def montar_entrada(dados):
    # mesma ordem de colunas do ColumnTransformer do notebook
    valores = []
    for nome, escala in MODELO["numericos"].items():
        valor = float(dados[nome])
        valores.append((valor - escala["media"]) / escala["desvio"])
    for nome, categorias in MODELO["categoricos"].items():
        escolhido = dados[nome]
        if escolhido not in categorias:
            raise ValueError(f"Valor inválido para {nome}: {escolhido}")
        valores.extend(1.0 if categoria == escolhido else 0.0 for categoria in categorias)
    return np.array(valores)


def prever(entrada):
    # relu nas camadas ocultas e sigmoid na saída
    saida = entrada
    for pesos, bias, ativacao in CAMADAS:
        saida = saida @ pesos + bias
        saida = np.maximum(saida, 0) if ativacao == "relu" else 1 / (1 + np.exp(-saida))
    return float(saida[0])


class handler(BaseHTTPRequestHandler):
    def responder(self, status, corpo):
        conteudo = json.dumps(corpo, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(conteudo)))
        self.end_headers()
        self.wfile.write(conteudo)

    def do_GET(self):
        # o site usa isso para montar os dropdowns
        self.responder(200, {
            "arquitetura": MODELO["arquitetura"],
            "categoricos": MODELO["categoricos"],
            "numericos": list(MODELO["numericos"]),
            "metricas_teste": MODELO["metricas_teste"],
            "amostras": MODELO["amostras"],
        })

    def do_POST(self):
        try:
            tamanho = int(self.headers.get("Content-Length") or 0)
            dados = json.loads(self.rfile.read(tamanho) or b"{}")
            p_roubo = prever(montar_entrada(dados))
        except KeyError as erro:
            return self.responder(400, {"erro": f"Faltou o campo {erro.args[0]}."})
        except (ValueError, TypeError) as erro:
            return self.responder(400, {"erro": str(erro)})

        self.responder(200, {
            "classe": "Roubo" if p_roubo >= 0.5 else "Furto",
            "roubo": round(p_roubo, 4),
            "furto": round(1 - p_roubo, 4),
        })

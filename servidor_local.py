# servidor para testar o site no computador (python servidor_local.py); no Vercel ele não é usado

import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PASTA = Path(__file__).resolve().parent
sys.path.insert(0, str(PASTA / "api"))

from prever import handler as ApiHandler  # noqa: E402


class Servidor(ApiHandler, SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PASTA / "public"), **kwargs)

    def do_GET(self):
        if self.path.startswith("/api/prever"):
            return ApiHandler.do_GET(self)
        return SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        if self.path.startswith("/api/prever"):
            return ApiHandler.do_POST(self)
        self.send_error(404)


if __name__ == "__main__":
    print("Rodando em http://localhost:8000")
    ThreadingHTTPServer(("localhost", 8000), Servidor).serve_forever()

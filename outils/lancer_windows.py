"""Lance TATTOOmap sur la boucle locale, ou rouvre la meme version deja lancee."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import socket
import sys
import urllib.error
import urllib.request
import webbrowser

ROOT = Path(__file__).resolve().parent.parent
FILES = (
    'index.html',
    '02_peaufine/app.js',
    '02_peaufine/style.css',
    '02_peaufine/motifs.js',
    '02_peaufine/sculptures.js',
    '02_peaufine/prototype-details.js',
    'assets/tattoos.js',
)


def same_version(port):
    """Ne rouvrir un serveur existant que si ses fichiers correspondent aux notres."""
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        for path in FILES:
            local = (ROOT / path).read_bytes().replace(b'\r\n', b'\n')
            with opener.open(f'http://127.0.0.1:{port}/{path}', timeout=3) as response:
                if response.status != 200:
                    return False
                remote = response.read(len(local) * 2 + 1024).replace(b'\r\n', b'\n')
            if remote != local:
                return False
        return True
    except (OSError, urllib.error.URLError):
        return False


class LocalServer(ThreadingHTTPServer):
    allow_reuse_address = False


def main(port=8765):
    url = f'http://127.0.0.1:{port}/'
    handler = partial(SimpleHTTPRequestHandler, directory=str(ROOT))
    server = LocalServer(('127.0.0.1', port), handler, bind_and_activate=False)
    try:
        if hasattr(socket, 'SO_EXCLUSIVEADDRUSE'):
            server.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        server.server_bind()
        server.server_activate()
    except OSError:
        server.server_close()
        if same_version(port):
            print('TATTOOmap est deja lance : ouverture de la galerie.', flush=True)
            webbrowser.open(url)
            return 0
        print(f'ERREUR : le port {port} est utilise par un autre programme ou une autre version.', flush=True)
        print('Fermez ce programme, puis relancez TATTOOmap.', flush=True)
        return 1
    print(f'Serveur local pret : {url}', flush=True)
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServeur arrete.', flush=True)
    finally:
        server.server_close()
    return 0


if __name__ == '__main__':
    sys.exit(main())

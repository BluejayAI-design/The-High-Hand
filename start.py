from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser


def main():
    root = Path(__file__).resolve().parent / "dist"
    if not (root / "index.html").is_file():
        raise SystemExit("Extract the whole ZIP before starting The High Hand.")
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    try:
        server = ThreadingHTTPServer(("127.0.0.1", 8765), handler)
    except OSError:
        raise SystemExit("Port 8765 is already in use. Close any previous High Hand launcher, then try again.")
    print("The High Hand is running at http://127.0.0.1:8765")
    print("Keep this window open. Press Ctrl+C here when finished.")
    webbrowser.open("http://127.0.0.1:8765")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

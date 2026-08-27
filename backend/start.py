import os
import sys
import socket
import threading

# Ensure stdout and stderr flush immediately for Railway logs
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(line_buffering=True)

from app.main import app
import uvicorn

def forward_stream(src, dst):
    """Bidirectional streaming between two TCP sockets."""
    try:
        while True:
            data = src.recv(65536)
            if not data:
                break
            dst.sendall(data)
    except Exception:
        pass
    finally:
        try:
            src.close()
        except Exception:
            pass
        try:
            dst.close()
        except Exception:
            pass

def start_port_forwarder(from_port: int, to_port: int):
    """Binds an auxiliary port and transparently proxies connections to the primary Uvicorn port."""
    try:
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(('0.0.0.0', from_port))
        server.listen(128)
        print(f"[PORT FORWARDER] Listening on 0.0.0.0:{from_port} -> proxying to 127.0.0.1:{to_port}", flush=True)
        while True:
            client_sock, _ = server.accept()
            try:
                target_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                target_sock.connect(('127.0.0.1', to_port))
                t1 = threading.Thread(target=forward_stream, args=(client_sock, target_sock), daemon=True)
                t2 = threading.Thread(target=forward_stream, args=(target_sock, client_sock), daemon=True)
                t1.start()
                t2.start()
            except Exception:
                try:
                    client_sock.close()
                except Exception:
                    pass
    except Exception as exc:
        print(f"[PORT FORWARDER] Auxiliary port {from_port} not bound: {exc}", flush=True)

if __name__ == "__main__":
    port_str = os.getenv("PORT", "8080")
    try:
        port = int(port_str)
    except (ValueError, TypeError):
        port = 8080

    print("==========================================================", flush=True)
    print(f"[STARTUP] Phantix Production Server starting on 0.0.0.0:{port}", flush=True)
    print(f"[STARTUP] Working Directory: {os.getcwd()}", flush=True)
    print(f"[STARTUP] Environment: {os.getenv('ENVIRONMENT', 'production')}", flush=True)
    print(f"[STARTUP] Database: {'PostgreSQL URL configured' if os.getenv('DATABASE_URL') else 'SQLite fallback (zero-config startup)'}", flush=True)
    print(f"[STARTUP] Firebase Project: {os.getenv('FIREBASE_PROJECT_ID', 'fake-social-media-detect-4bf0a')}", flush=True)
    print("==========================================================", flush=True)

    # Launch auxiliary port forwarders so Railway edge router reaches FastAPI regardless of port config
    auxiliary_ports = [8000, 8080, 3000, 5000, 5173, 80]
    for aux_port in auxiliary_ports:
        if aux_port != port:
            threading.Thread(target=start_port_forwarder, args=(aux_port, port), daemon=True).start()

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info",
        access_log=True,
        proxy_headers=True,
        forwarded_allow_ips="*"
    )

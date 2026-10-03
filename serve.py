import http.server
import socketserver
import socket
import os
import webbrowser

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def get_local_ip():
    """Mendeteksi IP LAN / WiFi lokal laptop"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Menghubungkan ke IP umum (tidak mengirim paket data nyata)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

if __name__ == '__main__':
    local_ip = get_local_ip()
    
    # Mencoba bind port
    try:
        server = socketserver.TCPServer(('0.0.0.0', PORT), Handler)
    except OSError:
        PORT = 8081
        server = socketserver.TCPServer(('0.0.0.0', PORT), Handler)

    print("=" * 60)
    print("  🚀 KAPITALKULA LOCAL SERVER AKTIF")
    print("=" * 60)
    print(f"💻 Akses dari LAPTOP ini : http://localhost:{PORT}")
    print(f"📱 Akses dari HP (WiFi/Hotspot sama): http://{local_ip}:{PORT}")
    print("-" * 60)
    print("💡 TIPS UNTUK HP:")
    print("  1. Pastikan Laptop dan HP tersambung ke WiFi atau Hotspot yang sama.")
    print(f"  2. Buka Chrome atau Safari di HP, ketik: http://{local_ip}:{PORT}")
    print("  3. Tekan menu browser -> 'Add to Home Screen' untuk install di HP!")
    print("=" * 60)
    print("Tekan Ctrl + C di terminal ini untuk mematikan server.\n")

    # Otomatis buka browser di laptop
    try:
        webbrowser.open(f"http://localhost:{PORT}")
    except Exception:
        pass

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server dihentikan. Sampai jumpa!")
        server.server_close()

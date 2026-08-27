import socket
import ipaddress
from urllib.parse import urlparse
from fastapi import HTTPException

# Blacklisted IP Networks (Private, Loopback, Link-Local, Cloud Metadata)
BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # Cloud metadata (169.254.169.254)
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("192.88.99.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    ipaddress.ip_network("224.0.0.0/4"),
    ipaddress.ip_network("240.0.0.0/4"),
    ipaddress.ip_network("255.255.255.255/32"),
    # IPv6
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("::/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

BLOCKED_HOSTNAMES = {"localhost", "loopback", "metadata.google.internal", "instance-data"}

def validate_url_safety(url: str) -> str:
    """
    Validates URL scheme, resolves target host, and ensures host IP does not lie in blocked private subnets or cloud metadata endpoints.
    """
    if not url or not isinstance(url, str):
        raise HTTPException(status_code=400, detail="Invalid URL string provided")

    url = url.strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        url = "https://" + url

    parsed = urlparse(url)
    hostname = parsed.hostname

    if not hostname:
        raise HTTPException(status_code=400, detail="Could not extract valid hostname from URL")

    hostname_lower = hostname.lower()
    if hostname_lower in BLOCKED_HOSTNAMES:
        raise HTTPException(
            status_code=400,
            detail="Security restriction: Access to localhost or cloud metadata hostnames is forbidden (SSRF protection)"
        )

    # Check direct IP addresses
    try:
        ip_obj = ipaddress.ip_address(hostname_lower)
        for blocked_net in BLOCKED_NETWORKS:
            if ip_obj in blocked_net:
                raise HTTPException(
                    status_code=400,
                    detail=f"Security restriction: IP address {hostname_lower} is in a forbidden private or loopback range"
                )
    except ValueError:
        # Not a raw IP, it's a domain hostname -> resolve to IP addresses
        try:
            addr_info = socket.getaddrinfo(hostname, None)
            for item in addr_info:
                ip_str = item[4][0]
                try:
                    ip_obj = ipaddress.ip_address(ip_str)
                    for blocked_net in BLOCKED_NETWORKS:
                        if ip_obj in blocked_net:
                            raise HTTPException(
                                status_code=400,
                                detail=f"Security restriction: Host {hostname} resolves to blocked IP address {ip_str}"
                            )
                except ValueError:
                    continue
        except socket.gaierror:
            # Domain does not resolve -> will be handled as unreachable/invalid
            pass

    return url

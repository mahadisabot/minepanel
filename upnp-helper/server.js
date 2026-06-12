const express = require('express');
const natUpnp = require('nat-upnp');
const os = require('os');

const app = express();
app.use(express.json());

const PORT = 8092;
const client = natUpnp.createClient();

// Helper to get local IP on the host machine
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-ipv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        // Also skip common docker bridge subnets if we can, to get the physical interface IP
        if (!name.startsWith('docker') && !name.startsWith('br-') && !iface.address.startsWith('172.')) {
          return iface.address;
        }
      }
    }
  }
  // Fallback to first non-internal IPv4
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

app.post('/map', (req, res) => {
  const { publicPort, privatePort, protocol, description } = req.body;
  if (!publicPort || !privatePort) {
    return res.status(400).json({ error: 'Missing publicPort or privatePort' });
  }
  const proto = (protocol || 'TCP').toUpperCase();
  const desc = description || 'Minepanel Port Mapping';
  const localIp = getLocalIp();

  console.log(`Mapping UPnP: External ${publicPort} -> Internal ${localIp}:${privatePort} (${proto})`);

  client.portMapping({
    public: parseInt(publicPort, 10),
    private: parseInt(privatePort, 10),
    ttl: 0, // Infinite mapping (or router default)
    protocol: proto,
    description: desc
  }, (err) => {
    if (err) {
      console.error('UPnP mapping failed:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    console.log(`Successfully mapped UPnP: External ${publicPort} -> Internal ${localIp}:${privatePort} (${proto})`);
    res.json({ success: true, localIp });
  });
});

app.post('/unmap', (req, res) => {
  const { publicPort, protocol } = req.body;
  if (!publicPort) {
    return res.status(400).json({ error: 'Missing publicPort' });
  }
  const proto = (protocol || 'TCP').toUpperCase();

  console.log(`Unmapping UPnP: External ${publicPort} (${proto})`);

  client.portUnmapping({
    public: parseInt(publicPort, 10),
    protocol: proto
  }, (err) => {
    if (err) {
      console.error('UPnP unmapping failed:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    console.log(`Successfully unmapped UPnP: External ${publicPort} (${proto})`);
    res.json({ success: true });
  });
});

app.get('/router-status', (req, res) => {
  client.externalIp((err, ip) => {
    if (err) {
      return res.json({ online: false, error: err.message });
    }
    res.json({ online: true, externalIp: ip });
  });
});

app.get('/status', (req, res) => {
  client.getMappings((err, mappings) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, localIp: getLocalIp(), mappings });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`UPnP Helper listening on port ${PORT}`);
  console.log(`Detected Host Local IP: ${getLocalIp()}`);
});

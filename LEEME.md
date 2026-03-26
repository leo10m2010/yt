# Frontend — Lo que subes a Netlify

## Cómo subir

### Opción A: Drag & Drop (más fácil)

```bash
npm install
npm run build
```

Ve a https://netlify.com → Add new site → Deploy manually
Arrastra la carpeta `dist/` que se generó.

### Opción B: GitHub (recomendado)

1. Sube esta carpeta a un repositorio en GitHub
2. Netlify → Add new site → Import from Git → selecciona el repo
3. Build settings (Netlify los detecta solos gracias al netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy

## Una vez subido

1. Abre tu app en Netlify
2. Ve a la pestaña **Config**
3. Pega la URL de tu Cloudflare Tunnel
4. Click **Probar** → debe aparecer ✓ Conectado

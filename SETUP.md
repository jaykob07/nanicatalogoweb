# Guía de Configuración - Accesorios El Duende

## 🎯 Descripción del Sistema

Sistema completo de gestión de productos para tienda de tecnología con:
- ✅ Catálogo público de productos con búsqueda
- ✅ Panel de administración protegido
- ✅ Sistema de roles (admin/usuario)
- ✅ CRUD completo de productos
- ✅ Carga de imágenes
- ✅ Búsqueda por nombre o referencia

## 🗄️ Base de Datos

La aplicación usa **Lovable Cloud** (basado en Supabase) como backend, que incluye:

### Tablas Creadas:
1. **products** - Almacena los productos con:
   - id (UUID)
   - name (texto)
   - reference (texto único)
   - description (texto)
   - price (decimal)
   - image_url (texto)
   - created_at, updated_at (timestamps)

2. **profiles** - Perfiles de usuario:
   - id (UUID, referencia a auth.users)
   - email (texto)
   - created_at (timestamp)

3. **user_roles** - Sistema de roles:
   - id (UUID)
   - user_id (UUID, referencia a profiles)
   - role (enum: 'admin' o 'user')

### Storage:
- **product-images** - Bucket público para imágenes de productos

## 🔐 Seguridad

### Row Level Security (RLS)
Todas las tablas tienen RLS habilitado:

**Productos:**
- Todos pueden ver productos (público)
- Solo admins pueden crear/editar/eliminar

**Roles:**
- Los usuarios ven solo sus roles
- Los admins ven todos los roles

### Sistema de Roles
- Los roles se almacenan en una tabla separada (no en el perfil)
- Se usa una función `has_role()` para verificar permisos
- Previene ataques de escalación de privilegios

## 👤 Crear el Primer Administrador

**IMPORTANTE:** Necesitas crear manualmente el primer usuario administrador en la base de datos.

### Pasos:

1. **Accede a la base de datos:**
   - Haz clic en "Cloud" en el menú de Lovable
   - Ve a la sección "Database" → "Tables"

2. **Registra un usuario:**
   - Ve a `/login` en tu aplicación
   - Aunque no tengas permisos aún, registra un usuario

3. **Asigna rol de administrador:**
   - En Cloud → Database → user_roles
   - Crea un nuevo registro:
     - user_id: (el ID del usuario que acabas de crear, lo encuentras en la tabla profiles)
     - role: admin
   - Guarda

4. **Inicia sesión:**
   - Ahora puedes iniciar sesión en `/login`
   - Serás redirigido al panel de administración

## 🚀 Flujo de Uso

### Para Visitantes (Público):
1. Visitan la página principal (`/`)
2. Ven todos los productos en la galería
3. Pueden buscar por nombre o referencia
4. No pueden editar ni crear productos

### Para Administradores:
1. Inician sesión en `/login`
2. Son redirigidos al panel de administración (`/admin`)
3. Pueden:
   - Ver todos los productos
   - Crear nuevos productos con imagen
   - Editar productos existentes
   - Eliminar productos
   - Buscar productos
4. Las imágenes se suben automáticamente al storage de Cloud

## 📦 Despliegue en VPS

### Opción 1: Despliegue Directo desde Lovable (Recomendado)
1. Click en "Publish" en Lovable
2. Tu app se desplegará automáticamente
3. El backend (Cloud) ya está configurado y funcionando
4. Puedes conectar un dominio personalizado desde Settings → Domains

### Opción 2: Despliegue Manual en VPS
Si prefieres tu propio VPS:

```bash
# 1. Clonar el repositorio
git clone <tu-repo>
cd <tu-proyecto>

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Las variables ya están en .env (auto-generadas por Lovable Cloud)
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
# VITE_SUPABASE_PROJECT_ID

# 4. Construir para producción
npm run build

# 5. Servir con tu servidor favorito (nginx, apache, etc)
# Los archivos están en /dist
```

#### Configuración de Nginx (ejemplo):
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    root /ruta/a/tu/proyecto/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Opcional: SSL con Let's Encrypt
    # listen 443 ssl;
    # ssl_certificate /path/to/cert.pem;
    # ssl_certificate_key /path/to/key.pem;
}
```

## 🔧 Recomendaciones sobre Base de Datos

**¿Qué base de datos usar?**
- ✅ **Ya tienes una configurada:** Lovable Cloud (Supabase)
- No necesitas MySQL, PostgreSQL ni otra base de datos externa
- Todo funciona "out of the box" con Cloud
- Escala automáticamente con tu aplicación

**Ventajas de usar Lovable Cloud:**
- ✅ Ya está configurada y funcionando
- ✅ Autenticación incluida
- ✅ Storage de archivos incluido
- ✅ APIs automáticas para todas las tablas
- ✅ Row Level Security ya configurado
- ✅ Actualizaciones automáticas
- ✅ Backups automáticos
- ✅ SSL incluido
- ✅ Sin configuración adicional

## 📝 Notas Importantes

1. **Seguridad:**
   - NUNCA guardes credenciales de admin en el código
   - Los roles se verifican en el servidor (RLS)
   - Las imágenes se validan antes de subir

2. **Producción:**
   - Auto-confirm email está habilitado para pruebas
   - En producción, considera deshabilitarlo desde Cloud → Auth → Settings

3. **Escalabilidad:**
   - El sistema usa Cloud que escala automáticamente
   - No hay límite de productos
   - Las imágenes se optimizan automáticamente

4. **Mantenimiento:**
   - Los cambios en la base de datos se hacen desde Cloud
   - Las migraciones ya están aplicadas
   - No necesitas acceso directo a PostgreSQL

## 🎨 Personalización

El diseño usa tonos dorados y verdes definidos en:
- `src/index.css` - Variables de color
- `tailwind.config.ts` - Configuración de Tailwind

Para cambiar colores:
1. Edita las variables CSS en `src/index.css`
2. Actualiza `tailwind.config.ts` si es necesario
3. Los cambios se aplicarán automáticamente

## 📞 Soporte

Para cualquier duda o problema:
- Revisa la documentación de Lovable: https://docs.lovable.dev
- Usa el chat de Lovable para ayuda con el código
- Accede a Cloud desde el panel de Lovable para ver la base de datos

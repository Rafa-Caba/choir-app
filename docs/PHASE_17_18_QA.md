<!-- docs/PHASE_17_18_QA.md -->

# QA final — Fases 17 y 18

## Fase 17: matriz RN multi-coro

Realizar en un development build o build de preview. Para push notifications, usar un dispositivo físico.

### Sesión y aislamiento

1. Iniciar sesión en el Coro A y abrir anuncios, canciones, galería, settings y chat.
2. Cerrar la app y volver a abrirla; la sesión debe restaurarse contra `/auth/me`.
3. Desactivar la red y confirmar que la caché válida del Coro A se muestra.
4. Cerrar sesión sin red; la app debe regresar al login y borrar la información tenant local.
5. Iniciar sesión en el Coro B.
6. Confirmar que no aparece ningún texto, imagen, audio, chat, theme o settings del Coro A.
7. Regresar al Coro A y confirmar que el namespace correcto vuelve a utilizarse.

### Roles y navegación

1. `VIEWER`: no ve acciones de creación ni rutas administrativas.
2. `EDITOR`: puede crear contenido permitido, pero no administrar usuarios.
3. `ADMIN`: administra usuarios únicamente dentro de su coro.
4. `SUPER_ADMIN`: entra a la consola de plataforma y debe seleccionar un coro antes de administrar usuarios.
5. Intentar navegar manualmente a pantallas restringidas; debe mostrarse acceso denegado y el API debe rechazar la operación.
6. Crear un usuario con contraseña temporal; el primer login debe abrir únicamente el cambio obligatorio de contraseña.

### Logout y revocación

1. Cambiar el rol de un usuario con sesión abierta; la sesión anterior debe cerrarse.
2. Suspender un usuario conectado; debe perder acceso y desconectarse de chat.
3. Restablecer contraseña; los tokens anteriores deben dejar de funcionar.
4. Eliminar un usuario; no debe poder restaurar la sesión.
5. Desactivar un coro; sus usuarios no deben poder entrar ni mantener sockets activos.

### Socket y push

1. Abrir dos usuarios del Coro A y uno del Coro B.
2. Enviar typing, mensajes y reacciones en A; B no debe recibir eventos.
3. Enviar una notificación desde A; solo dispositivos registrados en A deben recibirla.
4. Cerrar sesión y confirmar que el dispositivo se desregistra.
5. Repetir con varios dispositivos del mismo usuario.

## Fase 18: TestFlight

### EAS production

El environment `production` debe contener:

```text
EXPO_PUBLIC_API_URL=https://API_REAL_SIN_/api
EXPO_PUBLIC_SOCKET_URL=https://API_REAL
IOS_BUNDLE_IDENTIFIER=IDENTIFICADOR_REGISTRADO_EN_APP_STORE_CONNECT
```

La app local puede usar `.env` con `localhost`, pero un build de TestFlight toma las variables del environment `production` seleccionado por `eas.json`.

### Preflight

```bash
npm install
npm run qa:phase-18
```

### Development build para QA nativa

Dispositivo físico iOS:

```bash
eas build --platform ios --profile development
```

Simulador iOS:

```bash
eas build --platform ios --profile development-simulator
```

### Build y TestFlight

```bash
eas build --platform ios --profile production
```

Cuando termine:

```bash
eas submit --platform ios --profile production --latest
```

Alternativa en un paso:

```bash
eas build --platform ios --profile production --auto-submit
```

### QA física obligatoria

- Login tenant y acceso de plataforma.
- Restauración de sesión.
- Contraseña temporal.
- Chat y presencia.
- Push en foreground, background y app cerrada.
- Upload y reproducción de imágenes, archivos y audio.
- Logout completo.
- Reapertura offline.
- Roles y guards.
- CRUD de coros.
- Administración de usuarios por coro.
- Cambio entre Coro A y Coro B sin fuga de caché.

# Inicio rápido — Incremento 002

## Requisitos

- Node.js y npm instalados.

## Ejecutar

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador. Usa datos ficticios.

## Flujo principal

1. Crea un departamento.
2. Registra un trabajador y su asignación departamental.
3. Registra una medición de productividad para un período válido.
4. Consulta el registro en **Historial** y su comparación en **Evolución**.

Los datos se guardan en el `localStorage` de ese navegador. Para pruebas automatizadas: `npm test -- --run`.

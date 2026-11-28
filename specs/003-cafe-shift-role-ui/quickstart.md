# Inicio rápido — Feature `003-cafe-shift-role-ui`

## Requisitos

- Node.js y npm instalados.
- Navegador local para abrir `http://localhost:5173`.
- Uso exclusivo de datos ficticios.

## Ejecutar

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Pruebas automatizadas:

```bash
npm test -- --run
```

Compilación final:

```bash
npm run build
```

**Nota**: `npm run build` escribe `dist/`; ejecútalo solo al cierre de la feature.

## 1. Precarga automática

1. Abre la app en un navegador sin datos previos del sitio (o limpia `localStorage` del origen).
2. Observa el panel sin pulsar «Cargar datos de demostración».

**Resultado esperado**: aparecen 3 departamentos (`Barra`, `Cocina`, `Salón`), 6 trabajadores con los cargos oficiales, 6 asignaciones y 12 mediciones en dos períodos consecutivos. No aparecen `Caja` ni `Supervisión`. El panel se ve en menos de 5 s.

3. Recarga la página.

**Resultado esperado**: no se duplican ni sobrescriben datos; el estado del rol activo se conserva.

4. Crea un trabajador nuevo y recarga.

**Resultado esperado**: el trabajador sigue ahí; la precarga no vuelve a ejecutarse porque ya existe datos de negocio.

## 2. Jefe de Turno / Supervisor con contexto incompleto

1. Selecciona rol `Jefe de Turno / Supervisor`.
2. Deja «Área de trabajo» o «Turno» sin elegir.

**Resultado esperado**: solo se muestran los selectores y una ayuda que indica qué falta; no hay listados de medición, botón de edición ni acceso a gestión o metas globales.

## 3. Jefe de Turno / Supervisor con contexto completo

1. Elige «Área de trabajo» = `Barra` y «Turno» = `Mañana`.
2. Abre Medición, Historial por área/turno y Evolución por área/turno.
3. Registra una medición de un trabajador de Barra en turno Mañana con meta y resultado.
4. Corrige esa medición desde el botón de edición.

**Resultado esperado**: solo se ven datos de Barra/Mañana; la medición se guarda y se corrige; los controles tienen etiquetas limpias y se entiende para qué sirven.

5. Cambia el área a `Cocina` o el turno a `Tarde` e intenta editar la medición anterior.

**Resultado esperado**: la acción se bloquea antes de guardar, aparece aviso superior y los datos no cambian.

6. Busca formularios de trabajadores, departamentos, asignaciones o metas globales.

**Resultado esperado**: no están disponibles; si se invoca una acción directamente, se bloquea.

## 4. Otros roles y cambio en caliente

1. Selecciona `Barista / Trabajador (Solo lectura)` y elige un trabajador propio.

**Resultado esperado**: solo se ven Mi desempeño y Mi evolución de ese trabajador; no hay formularios de registro/corrección.

2. Como Administrador, abre un formulario sin guardar y cambia a Barista.

**Resultado esperado**: el formulario se cierra o bloquea de inmediato, no se guardan cambios parciales y las ayudas se actualizan en menos de 3 s.

## 5. Auto-explicación y metas globales

1. Recorre Panel, Trabajadores, Departamentos, Asignaciones, Medición, Historial, Evolución y búsqueda.
2. Verifica subtítulos de propósito, campos, acción y estado deshabilitado.
3. Como Administrador, abre «Metas globales de ventas», elige `Salón` y un período, guarda una meta.
4. Cambia a Jefe de Turno y busca esa tarjeta.

**Resultado esperado**: la tarjeta desaparece para supervisor; un guardado directo es rechazado por `upsertGlobalGoal()`. No hay caracteres `?` dañados en ningún texto o ID.

## 6. Cierre

```bash
npm test -- --run
npm run build
```

**Resultado esperado**: suite en verde y `dist/index.html` sin caracteres `?` corruptos. La matriz completa está en `spec.md` §6, §8 y §10 (FR-052 a FR-065, SC-001 a SC-010).

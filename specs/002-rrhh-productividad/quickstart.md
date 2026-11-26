# Inicio rápido — Incremento 002

## Requisitos

- Node.js y npm instalados.
- Navegador local para ejecutar la interfaz.
- Uso exclusivo de datos ficticios.

## Ejecutar

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador. Para pruebas automatizadas:

```bash
npm test -- --run
```

## Flujo principal

1. Crea un departamento de cafetería: Barra, Cocina o Salón.
2. Registra un trabajador y su asignación departamental en turno Mañana o Tarde.
3. Registra una medición de productividad para un período `AAAA-MM` válido, con meta esperada, resultado y evaluación cualitativa opcional.
4. Consulta el registro en **Historial** y su comparación en **Evolución**.
5. Verifica que la medición conserve el departamento histórico y el turno.

Los datos laborales se guardan en el almacenamiento local del navegador. Las reglas de campos y persistencia están en `data-model.md` y `contracts/storage.md`.

## Validación de roles activos

El selector de rol aparece con tres opciones. El rol predeterminado es **Administrador / Gerente de Cafetería**. El selector es demostrativo: no solicita credenciales ni verifica identidad real.

### 1. Administrador / Gerente de Cafetería

1. Selecciona el rol Administrador / Gerente de Cafetería.
2. Comprueba que están disponibles la gestión de trabajadores, departamentos, asignaciones, turnos y metas de ventas globales.
3. Registra o corrige una medición de cualquier área y turno.
4. Consulta historial y evolución de cualquier trabajador.

**Resultado esperado:** todas las vistas y botones descritos en FR-054 y FR-055 están disponibles.

### 2. Jefe de Turno / Supervisor

1. Cambia el rol a Jefe de Turno / Supervisor.
2. Selecciona área Barra y turno Mañana.
3. Verifica que solo aparecen Medición, Historial por área/turno y Evolución por área/turno.
4. Registra una medición de un trabajador asignado a Barra en turno Mañana.
5. Intenta usar una acción de crear trabajador, editar departamento o modificar metas globales.

**Resultado esperado:** la medición permitida se guarda; las acciones de gestión no aparecen o quedan bloqueadas, se informa al usuario y no se modifica ningún dato. No se muestran mediciones de Cocina, Salón ni turno Tarde.

### 3. Barista / Trabajador (Solo lectura)

1. Cambia el rol a Barista / Trabajador (Solo lectura).
2. Selecciona el trabajador propio.
3. Abre **Mi desempeño** y **Mi evolución**.
4. Busca formularios de registro, corrección o listados de otros trabajadores.

**Resultado esperado:** solo se muestran sus propias mediciones y evolución; no existen formularios de registro ni datos de otros trabajadores.

### 4. Cambio de rol

1. Abre un formulario como Administrador.
2. Cambia a Barista sin guardar.

**Resultado esperado:** el formulario deja de estar disponible de inmediato, no se guardan cambios no confirmados y las vistas se ajustan al nuevo rol en menos de 5 segundos.

La matriz completa de permisos y criterios de verificación está en `spec.md` §8, §6 y §10 (FR-052 a FR-065, SC-010 y SC-016 a SC-018).

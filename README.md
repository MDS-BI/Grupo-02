# ERP Software Base Module (Vite + Vanilla JS)

# Módulo ERP: Recursos Humanos y Planilla

Módulo web minimalista y escalable desarrollado dentro de la arquitectura base del ERP (Vite + JavaScript puro), enfocado en la gestión de personal y el procesamiento de nóminas y liquidaciones de sueldo para empresas.

---

## 1. Visión del Producto (Product Vision)
Desarrollar un submódulo de soporte operacional y control de gestión que permita administrar el ciclo de vida del personal y automatizar el cálculo de remuneraciones:

- Gestión de Personal: Registro centralizado de colaboradores con datos maestros (RUT, cargo, departamento, tipo de contrato, fecha de ingreso y sueldo base).
- Procesamiento de Planilla: Emisión y cálculo automatizado de liquidaciones de sueldo mensuales asociadas a cada colaborador, considerando días trabajados, haberes, deducciones legales (salud y previsión) y sueldo líquido.

---

## 2. Información del Equipo
- Curso: Modelación de Sistemas (580211-1)
- Grupo: Grupo-02
- Integrantes:
  - Daphnne Hidalgo
  -  Consuelo Estefania Hidalgo Salgado
  - Bastián Ignacio Reinado Bravo
  - Bruno Phillipe Cabalin Ferreira
  -        Soarzo Mancilla

---

## 3. Alcance del MVP (Producto Mínimo Viable)
- **Entidad (Datos Maestros):** Gestión de *Colaboradores/Empleados* con persistencia local (`localStorage`).
- **Documento (Transaccional):** Emisión de *Liquidaciones de Sueldo* con numeración correlativa, fechas y desglose de montos.
- **Flujo de Estados:** Ciclo de vida transaccional (`Borrador` -> `Emitida` -> `Pagada`).

---

## 4. Configuración y Ejecución

Instalar dependencias y ejecutar el servidor local:
```bash
npm install
npm run dev


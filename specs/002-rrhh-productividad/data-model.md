# Modelo de Datos — Historial de Productividad

## 1. Modelo de referencia

Este incremento utiliza como referencia el modelo de datos documentado en `specs/001-erp-base-module/data-model.md`, que incluye las entidades y estructuras del módulo ERP de Recursos Humanos y Productividad.

## 2. Alcance del incremento

La funcionalidad `002-rrhh-productividad` se enfoca en consultar y mantener un historial de productividad asociado a los colaboradores, considerando su evolución en distintos períodos.

## 3. Reutilización del modelo existente

Se reutilizarán las estructuras del módulo base cuando correspondan. Cualquier entidad, atributo o relación adicional deberá definirse de acuerdo con los requisitos de `spec.md` y el plan de implementación `plan.md`.

## 4. Consideraciones

Este documento complementa el modelo base y evita repetir su definición. Las decisiones sobre persistencia, identificadores y relaciones deberán mantenerse coherentes con la arquitectura existente.
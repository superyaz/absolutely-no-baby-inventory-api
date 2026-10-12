# 📦 Absolutely No Baby - Core Inventory System

Sistema centralizado diseñado para administrar el inventario de Absolutely No Baby en múltiples puntos de venta del Área Metropolitana del Valle de Aburrá. El sistema permite controlar productos, existencias por talla y color, entradas, salidas, devoluciones y transferencias entre tiendas, manteniendo una trazabilidad completa de las operaciones.

## Funcionalidades Principales

*   **Gestión Multi-tienda:** Administración de inventario independiente por cada punto de venta con consultas detalladas de existencias.
*   **Codificación Estricta:** Generación y validación de códigos únicos de 7 dígitos basados en el grupo del producto (ej. 31 para bebé masculino), tipo de prenda, modelo y consecutivo.
*   **Gestión de Movimientos:** Registro de ingresos, salidas por ventas, pérdidas o daños, y ajustes comparativos mediante conteos físicos.
*   **Sistema de Transferencias:** Flujo formal de solicitudes de mercancía entre tiendas que requiere aceptación o rechazo, impidiendo transferencias por cantidades superiores al stock disponible.
*   **Código de Barras y Etiquetas:** Generación automática de códigos de barras e impresión de etiquetas configurables que incluyen código, talla y precio para agilizar la lectura mediante escáner.
*   **Auditoría y Alertas:** Historial inmutable de usuarios, fechas y movimientos, sumado a un panel con alertas de stock mínimo por referencia.

## Arquitectura y Tecnologías

*   **Arquitectura:** Diseño fundamentado en microservicios, documentado visualmente bajo el modelo C4 para estandarizar la integración de los flujos de inventario.
*   **Backend:** APIs RESTful implementadas en Java (Spring Boot) o Node.js (Express) para orquestar la lógica de negocio, calcular las existencias y procesar las aprobaciones de transferencias.
*   **Seguridad y Roles:** Autenticación y control de acceso estructurado para Administrador general, Administrador de tienda y Empleado operativo.

## Reglas de Negocio Centrales

1.  No se permiten códigos de producto duplicados ni movimientos de inventario sin cantidades válidas.
2.  Las transferencias de mercancía exigen un flujo de solicitud inter-tiendas; al aprobarse, el sistema descuenta automáticamente las unidades del origen y las suma al destino.
3.  Los saldos se actualizan automáticamente tras cada operación aprobada, y toda modificación de ajuste exige el registro del usuario responsable y el motivo.
4.  Los productos inactivos quedan bloqueados para nuevos movimientos, restringiéndose únicamente a consultas históricas y funciones administrativas.

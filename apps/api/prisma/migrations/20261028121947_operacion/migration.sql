/*
  Warnings:

  - You are about to drop the column `creadoEn` on the `PromocionAlcance` table. All the data in the column will be lost.
  - You are about to drop the column `creadoEn` on the `PromocionEnvase` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Producto] DROP CONSTRAINT [Producto_categoriaId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Variante] DROP CONSTRAINT [Variante_envaseId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Variante] DROP CONSTRAINT [Variante_productoId_fkey];

-- DropIndex
ALTER TABLE [dbo].[Producto] DROP CONSTRAINT [Producto_nombre_key];

-- AlterTable
ALTER TABLE [dbo].[Caja] ADD [barra] NVARCHAR(50),
[tokenHash] NVARCHAR(255);

-- AlterTable
ALTER TABLE [dbo].[Promocion] DROP CONSTRAINT [Promocion_pausada_df];
ALTER TABLE [dbo].[Promocion] ADD CONSTRAINT [Promocion_pausada_df] DEFAULT 0 FOR [pausada];

-- AlterTable
ALTER TABLE [dbo].[PromocionAlcance] DROP CONSTRAINT [PromocionAlcance_creadoEn_df];
ALTER TABLE [dbo].[PromocionAlcance] DROP COLUMN [creadoEn];
ALTER TABLE [dbo].[PromocionAlcance] ADD [creadaEn] DATETIME2 NOT NULL CONSTRAINT [PromocionAlcance_creadaEn_df] DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE [dbo].[PromocionEnvase] DROP CONSTRAINT [PromocionEnvase_creadoEn_df];
ALTER TABLE [dbo].[PromocionEnvase] DROP COLUMN [creadoEn];
ALTER TABLE [dbo].[PromocionEnvase] ADD [creadaEn] DATETIME2 NOT NULL CONSTRAINT [PromocionEnvase_creadaEn_df] DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE [dbo].[Jornada] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fecha] DATE NOT NULL,
    [letra] CHAR(1) NOT NULL,
    [recibidaEn] DATETIME2 NOT NULL CONSTRAINT [Jornada_recibidaEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Jornada_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Jornada_fecha_key] UNIQUE NONCLUSTERED ([fecha])
);

-- CreateTable
CREATE TABLE [dbo].[AperturaCaja] (
    [id] INT NOT NULL IDENTITY(1,1),
    [cajaId] INT NOT NULL,
    [idLocal] INT NOT NULL,
    [jornadaId] INT,
    [cajeroId] INT NOT NULL,
    [encargadoId] INT NOT NULL,
    [fondo] INT NOT NULL,
    [ocurridaEn] DATETIME2 NOT NULL,
    [recibidaEn] DATETIME2 NOT NULL CONSTRAINT [AperturaCaja_recibidaEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [AperturaCaja_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AperturaCaja_cajaId_idLocal_key] UNIQUE NONCLUSTERED ([cajaId],[idLocal])
);

-- CreateTable
CREATE TABLE [dbo].[CierreCaja] (
    [id] INT NOT NULL IDENTITY(1,1),
    [cajaId] INT NOT NULL,
    [idLocal] INT NOT NULL,
    [aperturaId] INT NOT NULL,
    [cerradoPorId] INT NOT NULL,
    [contado] INT NOT NULL,
    [esperado] INT NOT NULL,
    [diferencia] INT NOT NULL,
    [totalMercadoPago] INT NOT NULL,
    [totalTransferencia] INT NOT NULL,
    [pendiente] BIT NOT NULL CONSTRAINT [CierreCaja_pendiente_df] DEFAULT 0,
    [ocurridaEn] DATETIME2 NOT NULL,
    [recibidaEn] DATETIME2 NOT NULL CONSTRAINT [CierreCaja_recibidaEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [CierreCaja_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CierreCaja_aperturaId_key] UNIQUE NONCLUSTERED ([aperturaId]),
    CONSTRAINT [CierreCaja_cajaId_idLocal_key] UNIQUE NONCLUSTERED ([cajaId],[idLocal])
);

-- CreateTable
CREATE TABLE [dbo].[Venta] (
    [id] INT NOT NULL IDENTITY(1,1),
    [cajaId] INT NOT NULL,
    [idLocal] INT NOT NULL,
    [aperturaId] INT NOT NULL,
    [numero] INT NOT NULL,
    [cajeroId] INT NOT NULL,
    [medioPago] NVARCHAR(20) NOT NULL,
    [subTotal] INT NOT NULL,
    [descuento] INT NOT NULL,
    [total] INT NOT NULL,
    [ocurridaEn] DATETIME2 NOT NULL,
    [recibidaEn] DATETIME2 NOT NULL CONSTRAINT [Venta_recibidaEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Venta_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Venta_cajaId_idLocal_key] UNIQUE NONCLUSTERED ([cajaId],[idLocal]),
    CONSTRAINT [Venta_aperturaId_numero_key] UNIQUE NONCLUSTERED ([aperturaId],[numero])
);

-- CreateTable
CREATE TABLE [dbo].[ItemVenta] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ventaId] INT NOT NULL,
    [varianteId] INT NOT NULL,
    [nombre] NVARCHAR(150) NOT NULL,
    [precioUnitario] INT NOT NULL,
    [cantidad] INT NOT NULL,
    [promocionId] INT,
    [promocionNombre] NVARCHAR(100),
    [descuento] INT NOT NULL CONSTRAINT [ItemVenta_descuento_df] DEFAULT 0,
    CONSTRAINT [ItemVenta_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Anulacion] (
    [id] INT NOT NULL IDENTITY(1,1),
    [cajaId] INT NOT NULL,
    [idLocal] INT NOT NULL,
    [ventaId] INT NOT NULL,
    [encargadoId] INT NOT NULL,
    [motivo] NVARCHAR(255) NOT NULL,
    [ocurridaEn] DATETIME2 NOT NULL,
    [recibidaEn] DATETIME2 NOT NULL CONSTRAINT [Anulacion_recibidaEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Anulacion_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Anulacion_ventaId_key] UNIQUE NONCLUSTERED ([ventaId])
);

-- CreateTable
CREATE TABLE [dbo].[MovimientoCaja] (
    [id] INT NOT NULL IDENTITY(1,1),
    [cajaId] INT NOT NULL,
    [idLocal] INT NOT NULL,
    [aperturaId] INT NOT NULL,
    [tipo] VARCHAR(20) NOT NULL,
    [monto] INT NOT NULL,
    [motivo] NVARCHAR(255),
    [usuarioId] INT NOT NULL,
    [autorizoId] INT,
    [ocurridaEn] DATETIME2 NOT NULL,
    [recibidaEn] DATETIME2 NOT NULL CONSTRAINT [MovimientoCaja_recibidaEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [MovimientoCaja_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [MovimientoCaja_cajaId_idLocal_key] UNIQUE NONCLUSTERED ([cajaId],[idLocal])
);

-- CreateTable
CREATE TABLE [dbo].[AuditoriaCaja] (
    [id] INT NOT NULL IDENTITY(1,1),
    [cajaId] INT NOT NULL,
    [idLocal] INT NOT NULL,
    [usuarioId] INT,
    [accion] VARCHAR(50) NOT NULL,
    [detalle] NVARCHAR(max),
    [ocurridaEn] DATETIME2 NOT NULL,
    [recibidaEn] DATETIME2 NOT NULL CONSTRAINT [AuditoriaCaja_recibidaEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [AuditoriaCaja_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AuditoriaCaja_cajaId_idLocal_key] UNIQUE NONCLUSTERED ([cajaId],[idLocal])
);

-- CreateTable
CREATE TABLE [dbo].[AuditoriaPanel] (
    [id] INT NOT NULL IDENTITY(1,1),
    [usuarioId] INT NOT NULL,
    [accion] VARCHAR(50) NOT NULL,
    [detalle] NVARCHAR(max),
    [creadaEn] DATETIME2 NOT NULL CONSTRAINT [AuditoriaPanel_creadaEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [AuditoriaPanel_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AperturaCaja_jornadaId_idx] ON [dbo].[AperturaCaja]([jornadaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Venta_ocurridaEn_idx] ON [dbo].[Venta]([ocurridaEn]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ItemVenta_ventaId_idx] ON [dbo].[ItemVenta]([ventaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Anulacion_cajaId_idLocal_idx] ON [dbo].[Anulacion]([cajaId], [idLocal]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MovimientoCaja_aperturaId_idx] ON [dbo].[MovimientoCaja]([aperturaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditoriaCaja_ocurridaEn_idx] ON [dbo].[AuditoriaCaja]([ocurridaEn]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditoriaPanel_creadaEn_idx] ON [dbo].[AuditoriaPanel]([creadaEn]);

-- AddForeignKey
ALTER TABLE [dbo].[Producto] ADD CONSTRAINT [Producto_categoriaId_fkey] FOREIGN KEY ([categoriaId]) REFERENCES [dbo].[Categoria]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Variante] ADD CONSTRAINT [Variante_productoId_fkey] FOREIGN KEY ([productoId]) REFERENCES [dbo].[Producto]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Variante] ADD CONSTRAINT [Variante_envaseId_fkey] FOREIGN KEY ([envaseId]) REFERENCES [dbo].[Envase]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AperturaCaja] ADD CONSTRAINT [AperturaCaja_cajaId_fkey] FOREIGN KEY ([cajaId]) REFERENCES [dbo].[Caja]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AperturaCaja] ADD CONSTRAINT [AperturaCaja_jornadaId_fkey] FOREIGN KEY ([jornadaId]) REFERENCES [dbo].[Jornada]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AperturaCaja] ADD CONSTRAINT [AperturaCaja_cajeroId_fkey] FOREIGN KEY ([cajeroId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AperturaCaja] ADD CONSTRAINT [AperturaCaja_encargadoId_fkey] FOREIGN KEY ([encargadoId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CierreCaja] ADD CONSTRAINT [CierreCaja_cajaId_fkey] FOREIGN KEY ([cajaId]) REFERENCES [dbo].[Caja]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CierreCaja] ADD CONSTRAINT [CierreCaja_aperturaId_fkey] FOREIGN KEY ([aperturaId]) REFERENCES [dbo].[AperturaCaja]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CierreCaja] ADD CONSTRAINT [CierreCaja_cerradoPorId_fkey] FOREIGN KEY ([cerradoPorId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Venta] ADD CONSTRAINT [Venta_cajaId_fkey] FOREIGN KEY ([cajaId]) REFERENCES [dbo].[Caja]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Venta] ADD CONSTRAINT [Venta_aperturaId_fkey] FOREIGN KEY ([aperturaId]) REFERENCES [dbo].[AperturaCaja]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Venta] ADD CONSTRAINT [Venta_cajeroId_fkey] FOREIGN KEY ([cajeroId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ItemVenta] ADD CONSTRAINT [ItemVenta_ventaId_fkey] FOREIGN KEY ([ventaId]) REFERENCES [dbo].[Venta]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ItemVenta] ADD CONSTRAINT [ItemVenta_varianteId_fkey] FOREIGN KEY ([varianteId]) REFERENCES [dbo].[Variante]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ItemVenta] ADD CONSTRAINT [ItemVenta_promocionId_fkey] FOREIGN KEY ([promocionId]) REFERENCES [dbo].[Promocion]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Anulacion] ADD CONSTRAINT [Anulacion_cajaId_fkey] FOREIGN KEY ([cajaId]) REFERENCES [dbo].[Caja]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Anulacion] ADD CONSTRAINT [Anulacion_ventaId_fkey] FOREIGN KEY ([ventaId]) REFERENCES [dbo].[Venta]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Anulacion] ADD CONSTRAINT [Anulacion_encargadoId_fkey] FOREIGN KEY ([encargadoId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MovimientoCaja] ADD CONSTRAINT [MovimientoCaja_cajaId_fkey] FOREIGN KEY ([cajaId]) REFERENCES [dbo].[Caja]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MovimientoCaja] ADD CONSTRAINT [MovimientoCaja_aperturaId_fkey] FOREIGN KEY ([aperturaId]) REFERENCES [dbo].[AperturaCaja]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MovimientoCaja] ADD CONSTRAINT [MovimientoCaja_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MovimientoCaja] ADD CONSTRAINT [MovimientoCaja_autorizoId_fkey] FOREIGN KEY ([autorizoId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AuditoriaCaja] ADD CONSTRAINT [AuditoriaCaja_cajaId_fkey] FOREIGN KEY ([cajaId]) REFERENCES [dbo].[Caja]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AuditoriaCaja] ADD CONSTRAINT [AuditoriaCaja_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AuditoriaPanel] ADD CONSTRAINT [AuditoriaPanel_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

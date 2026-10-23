/*
  Warnings:

  - You are about to drop the column `activa` on the `Caja` table. All the data in the column will be lost.
  - You are about to alter the column `nombre` on the `Caja` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(50)`.
  - Added the required column `actualizadoEn` to the `Caja` table without a default value. This is not possible if the table is not empty.
  - Added the required column `version` to the `Caja` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
ALTER TABLE [dbo].[Caja] DROP CONSTRAINT [Caja_nombre_key];

-- AlterTable
ALTER TABLE [dbo].[Caja] ALTER COLUMN [nombre] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[Caja] DROP COLUMN [activa];
ALTER TABLE [dbo].[Caja] ADD [activo] BIT NOT NULL CONSTRAINT [Caja_activo_df] DEFAULT 1,
[actualizadoEn] DATETIME2 NOT NULL,
[version] INT NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[VersionConfig] (
    [id] INT NOT NULL CONSTRAINT [VersionConfig_id_df] DEFAULT 1,
    [actual] INT NOT NULL CONSTRAINT [VersionConfig_actual_df] DEFAULT 0,
    CONSTRAINT [VersionConfig_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Usuario] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(100) NOT NULL,
    [rol] NVARCHAR(20) NOT NULL,
    [pinHash] NVARCHAR(255) NOT NULL,
    [activo] BIT NOT NULL CONSTRAINT [Usuario_activo_df] DEFAULT 1,
    [version] INT NOT NULL,
    [creadaEn] DATETIME2 NOT NULL CONSTRAINT [Usuario_creadaEn_df] DEFAULT CURRENT_TIMESTAMP,
    [actualizadoEn] DATETIME2 NOT NULL,
    CONSTRAINT [Usuario_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Envase] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(50) NOT NULL,
    [orden] INT NOT NULL CONSTRAINT [Envase_orden_df] DEFAULT 0,
    [activo] BIT NOT NULL CONSTRAINT [Envase_activo_df] DEFAULT 1,
    [version] INT NOT NULL,
    [creadaEn] DATETIME2 NOT NULL CONSTRAINT [Envase_creadaEn_df] DEFAULT CURRENT_TIMESTAMP,
    [actualizadoEn] DATETIME2 NOT NULL,
    CONSTRAINT [Envase_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Envase_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- CreateTable
CREATE TABLE [dbo].[Categoria] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(100) NOT NULL,
    [orden] INT NOT NULL CONSTRAINT [Categoria_orden_df] DEFAULT 0,
    [activo] BIT NOT NULL CONSTRAINT [Categoria_activo_df] DEFAULT 1,
    [version] INT NOT NULL,
    [creadaEn] DATETIME2 NOT NULL CONSTRAINT [Categoria_creadaEn_df] DEFAULT CURRENT_TIMESTAMP,
    [actualizadoEn] DATETIME2 NOT NULL,
    CONSTRAINT [Categoria_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Categoria_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- CreateTable
CREATE TABLE [dbo].[Producto] (
    [id] INT NOT NULL IDENTITY(1,1),
    [categoriaId] INT NOT NULL,
    [nombre] NVARCHAR(100) NOT NULL,
    [orden] INT NOT NULL CONSTRAINT [Producto_orden_df] DEFAULT 0,
    [activo] BIT NOT NULL CONSTRAINT [Producto_activo_df] DEFAULT 1,
    [version] INT NOT NULL,
    [creadaEn] DATETIME2 NOT NULL CONSTRAINT [Producto_creadaEn_df] DEFAULT CURRENT_TIMESTAMP,
    [actualizadoEn] DATETIME2 NOT NULL,
    CONSTRAINT [Producto_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Producto_nombre_key] UNIQUE NONCLUSTERED ([nombre]),
    CONSTRAINT [Producto_categoriaId_nombre_key] UNIQUE NONCLUSTERED ([categoriaId],[nombre])
);

-- CreateTable
CREATE TABLE [dbo].[Variante] (
    [id] INT NOT NULL IDENTITY(1,1),
    [productoId] INT NOT NULL,
    [envaseId] INT NOT NULL,
    [precio] INT NOT NULL,
    [activo] BIT NOT NULL CONSTRAINT [Variante_activo_df] DEFAULT 1,
    [version] INT NOT NULL,
    [creadaEn] DATETIME2 NOT NULL CONSTRAINT [Variante_creadaEn_df] DEFAULT CURRENT_TIMESTAMP,
    [actualizadoEn] DATETIME2 NOT NULL,
    CONSTRAINT [Variante_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Variante_productoId_envaseId_key] UNIQUE NONCLUSTERED ([productoId],[envaseId])
);

-- CreateTable
CREATE TABLE [dbo].[Promocion] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(100) NOT NULL,
    [tipo] NVARCHAR(20) NOT NULL,
    [llevar] INT,
    [pagar] INT,
    [porcentaje] INT,
    [monto] INT,
    [dias] NVARCHAR(20) NOT NULL,
    [horaDesde] CHAR(5),
    [horaHasta] CHAR(5),
    [pausada] BIT NOT NULL CONSTRAINT [Promocion_pausada_df] DEFAULT 1,
    [activo] BIT NOT NULL CONSTRAINT [Promocion_activo_df] DEFAULT 1,
    [version] INT NOT NULL,
    [creadaEn] DATETIME2 NOT NULL CONSTRAINT [Promocion_creadaEn_df] DEFAULT CURRENT_TIMESTAMP,
    [actualizadoEn] DATETIME2 NOT NULL,
    CONSTRAINT [Promocion_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PromocionAlcance] (
    [id] INT NOT NULL IDENTITY(1,1),
    [promocionId] INT NOT NULL,
    [productoId] INT,
    [categoriaId] INT,
    [activo] BIT NOT NULL CONSTRAINT [PromocionAlcance_activo_df] DEFAULT 1,
    [version] INT NOT NULL,
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [PromocionAlcance_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    [actualizadoEn] DATETIME2 NOT NULL,
    CONSTRAINT [PromocionAlcance_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PromocionEnvase] (
    [id] INT NOT NULL IDENTITY(1,1),
    [promocionId] INT NOT NULL,
    [envaseId] INT NOT NULL,
    [activo] BIT NOT NULL CONSTRAINT [PromocionEnvase_activo_df] DEFAULT 1,
    [version] INT NOT NULL,
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [PromocionEnvase_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    [actualizadoEn] DATETIME2 NOT NULL,
    CONSTRAINT [PromocionEnvase_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PromocionEnvase_promocionId_envaseId_key] UNIQUE NONCLUSTERED ([promocionId],[envaseId])
);

-- CreateIndex
ALTER TABLE [dbo].[Caja] ADD CONSTRAINT [Caja_nombre_key] UNIQUE NONCLUSTERED ([nombre]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Usuario_version_idx] ON [dbo].[Usuario]([version]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Envase_version_idx] ON [dbo].[Envase]([version]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Categoria_version_idx] ON [dbo].[Categoria]([version]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Producto_version_idx] ON [dbo].[Producto]([version]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Variante_version_idx] ON [dbo].[Variante]([version]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Promocion_version_idx] ON [dbo].[Promocion]([version]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PromocionAlcance_version_idx] ON [dbo].[PromocionAlcance]([version]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PromocionEnvase_version_idx] ON [dbo].[PromocionEnvase]([version]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Caja_version_idx] ON [dbo].[Caja]([version]);

-- AddForeignKey
ALTER TABLE [dbo].[Producto] ADD CONSTRAINT [Producto_categoriaId_fkey] FOREIGN KEY ([categoriaId]) REFERENCES [dbo].[Categoria]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Variante] ADD CONSTRAINT [Variante_productoId_fkey] FOREIGN KEY ([productoId]) REFERENCES [dbo].[Producto]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Variante] ADD CONSTRAINT [Variante_envaseId_fkey] FOREIGN KEY ([envaseId]) REFERENCES [dbo].[Envase]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PromocionAlcance] ADD CONSTRAINT [PromocionAlcance_promocionId_fkey] FOREIGN KEY ([promocionId]) REFERENCES [dbo].[Promocion]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PromocionAlcance] ADD CONSTRAINT [PromocionAlcance_productoId_fkey] FOREIGN KEY ([productoId]) REFERENCES [dbo].[Producto]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PromocionAlcance] ADD CONSTRAINT [PromocionAlcance_categoriaId_fkey] FOREIGN KEY ([categoriaId]) REFERENCES [dbo].[Categoria]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PromocionEnvase] ADD CONSTRAINT [PromocionEnvase_promocionId_fkey] FOREIGN KEY ([promocionId]) REFERENCES [dbo].[Promocion]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PromocionEnvase] ADD CONSTRAINT [PromocionEnvase_envaseId_fkey] FOREIGN KEY ([envaseId]) REFERENCES [dbo].[Envase]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- fila Unica del contador de version
INSERT INTO [dbo].[VersionConfig] ([id], [actual]) VALUES (1, 0);

-- Un alcance aputa a un producto '  a un categoria, nunca ambos ni ninguno
ALTER TABLE [dbo].[PromocionAlcance] ADD CONSTRAINT [PromocionAlcance_destino_ck]
     CHECK (([productoId] IS NOT NULL AND [categoriaId] IS NULL)
         OR ([productoId] IS NULL AND [categoriaId] IS NOT NULL));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[EstadoSyncCaja] (
    [cajaId] INT NOT NULL,
    [ultimoContactoEn] DATETIME2 NOT NULL,
    [versionCatalogo] INT,
    [ultimaSubidaEn] DATETIME2,
    CONSTRAINT [EstadoSyncCaja_pkey] PRIMARY KEY CLUSTERED ([cajaId])
);

-- AddForeignKey
ALTER TABLE [dbo].[EstadoSyncCaja] ADD CONSTRAINT [EstadoSyncCaja_cajaId_fkey] FOREIGN KEY ([cajaId]) REFERENCES [dbo].[Caja]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[AccesoPanel] (
    [id] INT NOT NULL IDENTITY(1,1),
    [usuarioId] INT NOT NULL,
    [email] NVARCHAR(254) NOT NULL,
    [passwordHash] NVARCHAR(255) NOT NULL,
    [creadaEn] DATETIME2 NOT NULL CONSTRAINT [AccesoPanel_creadaEn_df] DEFAULT CURRENT_TIMESTAMP,
    [actualizadoEn] DATETIME2 NOT NULL,
    CONSTRAINT [AccesoPanel_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AccesoPanel_usuarioId_key] UNIQUE NONCLUSTERED ([usuarioId]),
    CONSTRAINT [AccesoPanel_email_key] UNIQUE NONCLUSTERED ([email])
);

-- AddForeignKey
ALTER TABLE [dbo].[AccesoPanel] ADD CONSTRAINT [AccesoPanel_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

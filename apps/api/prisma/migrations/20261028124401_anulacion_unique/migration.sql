/*
  Warnings:

  - A unique constraint covering the columns `[cajaId,idLocal]` on the table `Anulacion` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
DROP INDEX [Anulacion_cajaId_idLocal_idx] ON [dbo].[Anulacion];

-- CreateIndex
ALTER TABLE [dbo].[Anulacion] ADD CONSTRAINT [Anulacion_cajaId_idLocal_key] UNIQUE NONCLUSTERED ([cajaId], [idLocal]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

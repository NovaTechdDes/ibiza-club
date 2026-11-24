-- Los dias de la promo pasan de VIERNES / SABADO / AMBOS a una lista de dias de la semana ("5,6").
-- Se sube la version global y la de cada promo convertida, para que las cajas las vuelvan a bajar.
BEGIN TRY

BEGIN TRAN;

UPDATE [dbo].[VersionConfig] SET [actual] = [actual] + 1 WHERE [id] = 1;

UPDATE [dbo].[Promocion]
SET [dias] = CASE [dias]
        WHEN 'VIERNES' THEN '5'
        WHEN 'SABADO'  THEN '6'
        WHEN 'AMBOS'   THEN '5,6'
    END,
    [version] = (SELECT [actual] FROM [dbo].[VersionConfig] WHERE [id] = 1)
WHERE [dias] IN ('VIERNES', 'SABADO', 'AMBOS');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

import z from "zod";
import { AppError } from "../../errors/app-error.js";
import { env } from "../../config/env.js";

const API_GITHUB = "https://api.github.com"
const PREFIJO_TAG = "caja-v";
const DURACION_CACHE = 5 * 60 *1000;

const releaseSchema = z.object({
    tag_name: z.string(),
    draft: z.boolean(),
    prerelease: z.boolean(),
    body: z.string().nullable(),
    published_at: z.string().nullable(),
    assets: z.array(z.object({ id: z.number(), name: z.string()}))
});

export type UltimaVersion = {
    version: string;
    notas: string;
    publicadaEn: string;
    assetInstaladorId: number;
    firma: string;
}

const headersGitHub = (accept = "application/vnd.github+json") => ({
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ibiza-api",
});


const pedirAsset = (assetId:number, redirect: RequestRedirect) => 
    fetch(`${API_GITHUB}/repos/${env.GITHUB_REPO}/releases/assets/${assetId}`, {
        headers: headersGitHub("application/octet-stream"),
        redirect,
        signal: AbortSignal.timeout(10_000)
    });

const errorGithub = (status: number) => new AppError(502, "INTERNO", `GitHub respondió ${status}`);


const buscarUltimaVersion = async (): Promise<UltimaVersion | null> => {
    const res = await fetch(`${API_GITHUB}/repos/${env.GITHUB_REPO}/releases?per_page=30`, {
        headers: headersGitHub(),
        signal: AbortSignal.timeout(10_000),
    });

    if(!res.ok) throw errorGithub(res.status)

    const releases = z.array(releaseSchema).parse(await res.json());
    const release = releases.find((r) => !r.draft && !r.prerelease && r.tag_name.startsWith(PREFIJO_TAG))
    if (!release) return null;


    const version = release.tag_name.slice(PREFIJO_TAG.length);
    const instalador = release.assets.find((a) => a.name === `ibiza-caja_${version}_x64-setup.exe`);
    const firma = release.assets.find((a) => a.name === `ibiza-caja_${version}_x64-setup.exe.sig`)

    if(!instalador || !firma) return null;

    const resFirma = await pedirAsset(firma.id, "follow");
    if(!resFirma.ok) throw errorGithub(resFirma.status);


    return {
        version, 
        notas: release.body ?? '',
        publicadaEn: release.published_at ?? new Date().toISOString(),
        assetInstaladorId: instalador.id,
        firma: (await resFirma.text()).trim(),
    }
}

let cache: {valor: UltimaVersion | null; vence: number} | null = null;

export const obtenerUltimaVersion = async (): Promise<UltimaVersion | null> => {
    if(cache && Date.now() < cache.vence) return cache.valor;
    const valor = await buscarUltimaVersion();
    cache = { valor, vence: Date.now() + DURACION_CACHE} 
    return valor;
}

export const obtenerUrlDescarga = async (version: string): Promise<string> => {
    const ultima = await obtenerUltimaVersion();
    if(!ultima || ultima.version !== version){
        throw AppError.noEncontrado("Esa version no esta disponible")
    }

    const res = await pedirAsset(ultima.assetInstaladorId, "manual");
    await res.body?.cancel();
    const destino = res.headers.get("location");
    if(!destino) throw errorGithub(res.status);
    return destino
}
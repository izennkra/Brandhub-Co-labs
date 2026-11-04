import { pickIllustrations, type Illustration } from './settings';

// Chargement des illustrations : le fichier illustrations.json et ses images. Par défaut, il est
// cherché à côté du script (dossier illustrations/) ; l'attribut « source » donne une autre adresse,
// relative à la page.

// Adresse du script, lue pendant son exécution (document.currentScript n'existe qu'à ce moment-là).
const SCRIPT_URL = (document.currentScript as HTMLScriptElement | null)?.src || location.href;
const DEFAULT_SOURCE = 'illustrations/illustrations.json';

/** Une image en adresse « data: » : le moteur la lit sans souci de domaine (CORS). */
async function asDataUrl(url: URL) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`image introuvable : ${url}`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Les illustrations demandées (attribut « images »), dans l'ordre, avec leurs images chargées. */
export async function loadIllustrations(source: string | null, images: string | null) {
  const url = new URL(source ?? DEFAULT_SOURCE, source ? location.href : SCRIPT_URL);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fichier des illustrations introuvable : ${url}`);
  const manifest = (await response.json()) as { illustrations?: Illustration[] };
  const list = pickIllustrations(manifest.illustrations ?? [], images);
  if (!list.length) throw new Error('aucune illustration à afficher (attribut images, illustrations.json)');
  const sources = await Promise.all(list.map((i) => asDataUrl(new URL(i.fichier, url))));
  return { list, sources };
}

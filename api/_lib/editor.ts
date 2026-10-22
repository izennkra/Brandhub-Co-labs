// Code éditeur des pages Ressource, partagé par /api/store et /api/files.
// Dossier « _lib » : Vercel n'en fait pas une fonction.

export const EDITOR_HEADER = 'x-editor-code';

/** Le code éditeur reçu est-il le bon ? Sans code configuré (EDITOR_CODE), personne ne peut modifier. */
export function codeMatches(request: Request, editorCode: string | undefined) {
  const given = request.headers.get(EDITOR_HEADER) ?? '';
  if (!editorCode || given.length !== editorCode.length) return false;
  // comparaison en temps constant : la durée ne révèle pas les bons caractères
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ editorCode.charCodeAt(i);
  return diff === 0;
}

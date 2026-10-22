// Messages des pages Ressource (« Couleur copiée », « Logo ajouté »…), affichés par le Toaster.
export const resourceEvents = new EventTarget();

export function notify(message: string) {
  resourceEvents.dispatchEvent(new CustomEvent('toast', { detail: message }));
}

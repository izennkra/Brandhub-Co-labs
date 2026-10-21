import { Gallery } from '../../components/resources/Gallery';
import { LAYOUT_FORMATS } from '../../lib/resources/formats';

// Page Patterns prédéfinis : une grille comme Inspiration, remplie des layouts de patterns
// enregistrés depuis le Layout editor, filtrable par format.
export function PatternsPage() {
  return (
    <Gallery
      collection="res-layouts"
      tagLabel="Format"
      tags={LAYOUT_FORMATS}
      canAdd={false}
      emptyText="Aucun layout pour l’instant. Les layouts enregistrés depuis le Layout editor apparaîtront ici."
    />
  );
}

import { Gallery } from '../../components/resources/Gallery';

// Page Imagerie (pas de maquette) : la mosaïque d'Inspiration, avec un filtre par thème.
export function ImageryPage() {
  return <Gallery collection="res-imagery" tagLabel="Thème" emptyText="Aucune image pour l’instant." />;
}

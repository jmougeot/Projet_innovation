interface Plat {
    id: string;
    nom: string;
    prix: number;
    categorie: string;
    description?: string;
    disponible: boolean;
    nombre?: number;
  }
  
const PLAT: Plat[] = [

    {
    id: "E1",
    nom: "Salade César",
    prix: 8.50,
    categorie: "Entrées",
    description: "Laitue, poulet grillé, croûtons, parmesan",
    disponible: true,
    nombre: 0
},
{
    id: "E2",
    nom: "Soupe à l'oignon",
    prix: 7.00,
    categorie: "Entrées",
    disponible: true,
    nombre: 0
},

{
    id: "P1",
    nom: "Steak Frites",
    prix: 18.50,
    categorie: "Plats",
    description: "Steak de boeuf, frites maison, sauce au poivre",
    disponible: true,
    nombre: 0
},
{
    id: "P2",
    nom: "Saumon grillé",
    prix: 22.00,
    categorie: "Plats",
    description: "Saumon frais, légumes de saison",
    disponible: true,
    nombre: 0
},

// Desserts
{
    id: "D1",
    nom: "Crème brûlée",
    prix: 7.50,
    categorie: "Desserts",
    disponible: true,
    nombre: 0
},
{
    id: "D2",
    nom: "Tarte Tatin",
    prix: 8.00,
    categorie: "Desserts",
    description: "Tarte aux pommes caramélisées",
    disponible: true,
    nombre: 0
}
];

export { Plat, PLAT };
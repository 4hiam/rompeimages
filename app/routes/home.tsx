import type { Route } from "./+types/home";
import { PuzzleGenerator } from "../components/PuzzleGenerator";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RompeImages - Rompecabezas Matemáticos de Sumas y Restas" },
    { name: "description", content: "Sube tu propia imagen y crea un divertido rompecabezas matemático. Divide la imagen en 6, 9 o 12 fichas con ejercicios combinados, sumas, restas y resultados barajados." },
  ];
}

export default function Home() {
  return <PuzzleGenerator />;
}


import { Routes, Route } from "react-router-dom";
import choirs from "../data/choirs";
import ChoirDetail from "./ChoirDetail";
import FlashyCard from "../components/FlashyCard";

const choirAccents = {
  youth: "#62d19b",
  "sunday-school": "#e8bd79",
  women: "#d9a6b0",
  men: "#a9c8af",
  essence: "#d48265",
  main: "#d4af37",
};

function ChoirsLanding() {
  return (
    <div className="page-shell">
      <header className="page-heading">
        <span className="eyebrow">Ministry through music</span>
        <h1>Our worship teams.</h1>
        <p>Meet the vibrant choirs who serve AIC Hola through praise, song, and devotion.</p>
      </header>
      <div className="content-grid">
        {choirs.map((choir) => (
          <FlashyCard
            key={choir.slug}
            title={choir.name}
            description={choir.description}
            to={`/choirs/${choir.slug}`}
            meta={choir.focus}
            icon="fa-microphone-lines"
            kind="choir"
            actionLabel="Meet the choir"
            accent={choirAccents[choir.slug] || "#d4af37"}
          />
        ))}
      </div>
    </div>
  );
}

export default function Choirs() {
  return (
    <Routes>
      <Route index element={<ChoirsLanding />} />
      <Route path=":slug" element={<ChoirDetail />} />
    </Routes>
  );
}

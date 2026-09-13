import { useParams, Link } from "react-router-dom";
import choirs from "../data/choirs";
import FlashyCard from "../components/FlashyCard";

export default function ChoirDetail() {
  const { slug } = useParams();
  const choir = choirs.find((item) => item.slug === slug);
  if (!choir) return <div className="page-shell page-heading"><h1>Choir not found</h1><Link className="button" to="/choirs">Back to choirs</Link></div>;
  return <div className="page-shell"><Link className="text-link" to="/choirs">← Back to all choirs</Link><header className="page-heading choir-detail-heading"><span className="eyebrow">{choir.focus}</span><h1>{choir.name}</h1><p>{choir.description}</p></header><div className="section-heading"><div><span className="eyebrow">Listen and watch</span><h2>Media and performances</h2></div><p>Relive special worship moments with the {choir.name}.</p></div><div className="content-grid two">{(choir.media || []).map((item) => <FlashyCard key={item.title} title={item.title} description={item.description} mediaType={item.type} to={item.url || "https://www.youtube.com/@nkandi242"} icon={item.type === "audio" ? "fa-music" : "fa-circle-play"} meta={item.type} actionLabel={item.type === "audio" ? "Listen on YouTube" : "Watch on YouTube"} accent={item.type === "audio" ? "#b9c8e8" : "#eeb0a0"} />)}</div></div>;
}

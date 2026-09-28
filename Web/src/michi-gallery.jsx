// Galería de desarrollo de la mascota (http://localhost:5173/michi.html).
// También la usa el script que genera las imágenes PNG de la app móvil.
import { createRoot } from "react-dom/client";
import "./index.css";
import { Michi } from "./components/ui/Michi";

const POSES = ["headset", "wave", "sit", "laptop", "magnifier", "sleep", "celebrate", "wait", "sad", "peek", "head", "logo"];
const params = new URLSearchParams(location.search);
const only = params.get("pose");
const size = Number(params.get("size")) || 200;

createRoot(document.getElementById("root")).render(
  only ? (
    <div id="shot" style={{ display: "inline-block", lineHeight: 0 }}><Michi pose={only} size={size} /></div>
  ) : (
    <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, fontFamily: "Inter" }}>
      {POSES.map(p => (
        <figure key={p} style={{ margin: 0, background: "#fff", borderRadius: 16, border: "1px solid #e4e9f0", padding: 12, textAlign: "center" }}>
          <Michi pose={p} size={176} />
          <figcaption style={{ fontSize: 13, color: "#5e6c84", fontWeight: 600 }}>{p}</figcaption>
        </figure>
      ))}
    </div>
  )
);

import express from "express";
import cors from "cors";
import bodyParser from "body-parser"; //no se instala es de node

var app = express();
// app.use(
//   cors({
//     origin: "http://example.com",
//   })
// );
app.use(cors());
app.use(bodyParser.json());

app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});
app.get("/deploy", (req, res) => {
  res.status(200).send("ejecutar secuencia de comandos del pipeline cicd");
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Api corriendo por el puerto ${PORT}`));

import express from "express";
import cors from "cors";
import bodyParser from "body-parser"; //no se instala es de node
import { exec } from "child_process";

var app = express();
// app.use(
//   cors({
//     origin: "http://example.com",
//   })
// );
app.use(cors());
app.use(bodyParser.json());

app.post("/app1", (req, res) => {
  const branch = req.body.ref.split("/").pop();
  console.log("Iniciado el proceso de deploy  de  la rama ->", branch);
  exec(
    " cd /var/www/html/app1 && git fetch && git pull && docker-compose up -d --build",
    (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        res.status(500).send(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        res.status(500).send(`Error: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log("Deploy terminado correctamente");
      res.status(200).send("Deploy terminado correctamente");
    }
  );
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Api corriendo por el puerto ${PORT}`));

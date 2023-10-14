import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { exec } from "child_process";
import crypto from "crypto";

var app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/app1", (req, res) => {
  const signature = req.headers["x-hub-signature"];
  const payload = JSON.stringify(req.body);
  const secret = process.env.TOKEN_APP1;

  const hmac = crypto.createHmac("sha1", secret);
  const digest = "sha1=" + hmac.update(payload).digest("hex");

  if (signature !== digest) {
    res.status(403).send("Authentication failed");
    return;
  }

  console.log("Iniciado el proceso de deploy", req.headers);
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

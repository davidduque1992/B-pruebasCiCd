import express from "express";
import cors from "cors";
import { exec } from "child_process";
import http from "http";
import crypto from "crypto";
import { config } from "dotenv";
config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/app1", async (req, res) => {
  const branch = req.body.ref.split("/").pop();
  const signature = req.headers["x-hub-signature"];
  console.log("secret=", signature);
  const expectedSignature = crypto
    .createHmac("sha1", process.env.GITHUB_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (branch === "main") {
    if (signature === `sha1=${expectedSignature}`) {
      try {
        console.log("Iniciado el proceso de deploy de la rama ->", branch);
        const result = await executeCommand(
          "cd /var/www/html/app1 && git fetch && git pull && docker-compose up -d --build"
        );
        console.log(`stdout: ${result}`);
        console.log("Deploy terminado correctamente");
        res.status(200).send("Deploy terminado correctamente");
      } catch (error) {
        console.log(`error: ${error.message}`);
        res.status(500).send(`Error: ${error.message}`);
        try {
          const rollbackResult = await executeCommand(
            "cd /var/www/html/app1 && git reset --hard HEAD~1 && docker-compose up -d --build"
          );
          console.log(`Rollback realizado correctamente: ${rollbackResult}`);
        } catch (rollbackError) {
          console.log(`Error durante el rollback: ${rollbackError.message}`);
        }
      }
    } else {
      console.log(
        "Se detectó un cambio en la rama ->",
        branch,
        "pero la firma no es correcta. Por favor, asegúrate de que estás utilizando la contraseña correcta."
      );
    }
  } else {
    console.log(
      "se detecto un cambio en la rama ->",
      branch,
      "pero no se desencadeno despliegue"
    );
  }
});

const executeCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        reject(new Error(stderr));
        return;
      }
      resolve(stdout);
    });
  });
};

const PORT = 3001;
const server = http.createServer(app);
server.setTimeout(500000); // Tiempo de espera en milisegundos
server.listen(PORT, () => console.log(`Api corriendo por el puerto ${PORT}`));

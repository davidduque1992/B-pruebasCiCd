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

async function deploy(req, branch, signature, res) {
  const expectedSignature = crypto
    .createHmac("sha1", process.env.GITHUB_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (signature !== `sha1=${expectedSignature}`) {
    console.log(
      "Se detectó un cambio en la rama ->",
      branch,
      "pero la firma no es correcta. Por favor, asegúrate de que estás utilizando la contraseña correcta."
    );
    return;
  }

  try {
    console.log("Iniciado el proceso de deploy de la rama ->", branch);
    await executeCommand(
      "cd /var/www/html/app1 && git fetch && git pull && docker-compose up -d --build"
    );
    console.log("Deploy terminado correctamente");
    res.status(200).send("Deploy terminado correctamente");
  } catch (error) {
    console.log(`error: ${error.message}`);
    res.status(500).send(`Error: ${error.message}`);
    try {
      await executeCommand(
        "cd /var/www/html/app1 && git reset --hard HEAD~1 && docker-compose up -d --build && git push"
      );
      console.log(`Rollback realizado correctamente`);
    } catch (rollbackError) {
      console.log(`Error durante el rollback: ${rollbackError.message}`);
    }
  }
}

app.post("/app1", async (req, res) => {
  const branch = req.body.ref.split("/").pop();
  const signature = req.headers["x-hub-signature"];
  console.log("secret=", signature);

  if (branch === "main") {
    await deploy(req, branch, signature, res);
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

const PORT = process.env.PORT || 3001; // Usa el puerto del entorno si está disponible
const server = http.createServer(app);
server.setTimeout(500000); // Tiempo de espera en milisegundos
server.listen(PORT, () => console.log(`Api corriendo por el puerto ${PORT}`));

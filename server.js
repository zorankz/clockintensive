const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Ruta para consultar el reloj de corte
app.post('/consultar', async (req, res) => {
    const { alienNumber } = req.body;

    if (!alienNumber) return res.status(400).json({ error: 'Número A requerido' });

    try {
        // Lanzar Puppeteer con la ruta de Chromium en Render
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium',  // Ruta a Chromium en Render
            headless: true,  // Ejecutar en segundo plano
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Opciones necesarias para Render
        });

        const page = await browser.newPage();
        await page.goto('https://migraconnect.us/eoir-tracker');
        await page.waitForSelector('#case-number');
        await page.type('#case-number', alienNumber);
        await page.click('button[type="submit"], button:has-text("Chequear")');

        await page.waitForTimeout(4000);

        // Extraer el resultado de la página
        const result = await page.evaluate(() => {
            const element = document.querySelector('h2 + span') || document.querySelector('[class*=text-secondary]');
            return element ? element.innerText : 'No se pudo encontrar la información';
        });

        await browser.close();

        // Devolver el resultado al cliente
        res.json({ reloj: result });
    } catch (error) {
        console.error('Error en Puppeteer:', error);
        res.status(500).json({ error: 'Error consultando el reloj' });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
